"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Settings, LogOut, ChevronDown, Search, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserProfile {
  name: string
  email: string
  photo?: string
  provider?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

export function DashboardHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile>({
    name: "User",
    email: "",
    photo: "",
    provider: "local",
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Reply state
  const [replyOpen, setReplyOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile
        setUser((prev) => ({
          ...prev,
          ...parsed,
        }))
      }
    } catch (e) {
      console.error("Failed to load user profile", e)
    }
  }, [])

  useEffect(() => {
    if (!user.email) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications?email=${user.email}`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
          setUnreadCount(data.filter((n: any) => !n.isRead).length)
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user.email])

  const markAsRead = async (notification: any) => {
    if (notification.isRead) return
    try {
      await fetch(`${API_BASE_URL}/notifications/${notification.id}/read`, { method: "PUT" })
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error("Failed to mark as read", e)
    }
  }

  const handleReply = (notification: any) => {
    setSelectedNotification(notification)
    setReplyOpen(true)
  }

  const sendReply = async () => {
    if (!replyMessage.trim() || !user.email) return
    setIsSending(true)
    try {
      const receiver = selectedNotification.senderEmail === "System" ? "admin@ict.com" : selectedNotification.senderEmail
      await fetch(`${API_BASE_URL}/notifications/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: user.email,
          receiverEmail: receiver,
          message: replyMessage,
          parentId: selectedNotification.id
        })
      })
      toast.success("Reply sent!")
      setReplyOpen(false)
      setReplyMessage("")
    } catch (e) {
      console.error("Failed to reply", e)
      toast.error("Failed to send reply")
    } finally {
      setIsSending(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token")
      window.localStorage.removeItem("user")
    }
    toast.success("Logged out successfully")
    router.push("/")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search visitors..."
          className="bg-input border-border pl-10 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-border bg-popover text-popover-foreground">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`flex flex-col p-3 border-b last:border-0 ${!notification.isRead ? 'bg-muted/50' : ''}`}>
                    <div
                      className="cursor-pointer mb-2"
                      onClick={() => markAsRead(notification)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-primary mb-1">{notification.senderEmail}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className={`text-sm ${!notification.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {(notification.senderEmail !== "System" || true) && (
                      <Button variant="outline" size="sm" className="h-7 text-xs self-start" onClick={() => handleReply(notification)}>
                        Reply
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to {selectedNotification?.senderEmail}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary pl-3 italic">
                "{selectedNotification?.message}"
              </p>
              <Textarea
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyOpen(false)}>Cancel</Button>
              <Button onClick={sendReply} disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-foreground hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    user.photo && user.photo.length > 0
                      ? user.photo
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0d9488&color=fff`
                  }
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover text-popover-foreground">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
