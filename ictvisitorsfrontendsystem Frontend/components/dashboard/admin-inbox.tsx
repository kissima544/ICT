"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Send, Mail, User, Clock, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

export function AdminInbox() {
    const [messages, setMessages] = useState<any[]>([])
    const [threads, setThreads] = useState<any[]>([])
    const [selectedThread, setSelectedThread] = useState<any>(null)
    const [replyMessage, setReplyMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [adminEmail, setAdminEmail] = useState("admin@ict.com") // Default admin email context

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            // For now, fetching ALL notifications for "admin@ict.com" or generic fetching
            // ideally we need an endpoint to get ALL messages or threaded messages
            // Using existing endpoint:
            const res = await fetch(`${API_BASE_URL}/notifications?email=${adminEmail}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                processThreads(data)
            }
        } catch (error) {
            console.error("Failed to fetch inbox", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Group messages by the "Other Person" (Student)
    const processThreads = (msgs: any[]) => {
        const groups: { [key: string]: any[] } = {}

        msgs.forEach(msg => {
            // If I am receiver, sender is the other person.
            // If I am sender, receiver is the other person.
            const otherPerson = msg.receiverEmail === adminEmail ? msg.senderEmail : msg.receiverEmail

            if (!groups[otherPerson]) {
                groups[otherPerson] = []
            }
            groups[otherPerson].push(msg)
        })

        const threadList = Object.keys(groups)
            .map(email => ({
                email,
                messages: groups[email].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), // Oldest first
                lastMessage: groups[email][groups[email].length - 1], // Last message in time string logic
                unreadCount: groups[email].filter((m: any) => !m.isRead && m.receiverEmail === adminEmail).length
            }))
            .filter(thread => thread.messages.some((m: any) => m.senderEmail !== "System")) // Only show threads with user activity (replies or admin msgs)

        setThreads(threadList)

        // Sync selected thread with new data if it exists
        if (selectedThread) {
            const updatedSelection = threadList.find(t => t.email === selectedThread.email)
            if (updatedSelection) {
                setSelectedThread(updatedSelection)
            }
        }
    }

    const handleSelectThread = (thread: any) => {
        setSelectedThread(thread)
        // Mark as read logic could go here
    }

    const sendReply = async () => {
        if (!replyMessage.trim() || !selectedThread) return

        setIsSending(true)
        try {
            await fetch(`${API_BASE_URL}/notifications/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderEmail: adminEmail,
                    receiverEmail: selectedThread.email,
                    message: replyMessage,
                    parentId: null // Optional threading
                })
            })

            // Optimistic update: Add message to UI immediately
            const newMessage = {
                id: Date.now(),
                senderEmail: adminEmail,
                receiverEmail: selectedThread.email,
                message: replyMessage,
                createdAt: new Date().toISOString(),
                isRead: true
            }

            const updatedThread = {
                ...selectedThread,
                messages: [...selectedThread.messages, newMessage]
            }
            setSelectedThread(updatedThread) // Show immediately

            toast.success("Reply sent")
            setReplyMessage("")
            // Refresh messages
            await fetchMessages()
        } catch (e) {
            toast.error("Failed to send")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Thread List */}
            <Card className="col-span-1 border-border bg-card flex flex-col overflow-hidden">
                <CardHeader className="py-4 border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Inbox
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : threads.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">No messages</div>
                        ) : (
                            threads.map(thread => (
                                <button
                                    key={thread.email}
                                    className={`flex items-start gap-3 p-4 text-left border-b border-border transition-colors hover:bg-secondary/50 ${selectedThread?.email === thread.email ? 'bg-secondary' : ''}`}
                                    onClick={() => handleSelectThread(thread)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{thread.email[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm truncate">{thread.email}</span>
                                            {thread.unreadCount > 0 && (
                                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {thread.messages[thread.messages.length - 1].message}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Chat View */}
            <Card className="col-span-1 md:col-span-2 border-border bg-card flex flex-col overflow-hidden">
                {selectedThread ? (
                    <>
                        <CardHeader className="py-4 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{selectedThread.email[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{selectedThread.email}</CardTitle>
                                    <CardDescription className="text-xs">Student</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                            <div className="space-y-4">
                                {selectedThread.messages.map((msg: any) => {
                                    const isMe = msg.senderEmail === adminEmail || msg.senderEmail === "System"
                                    const isSystem = msg.senderEmail === "System"
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} ${isSystem ? 'opacity-80' : ''}`}>
                                                {isSystem && <span className="text-[10px] uppercase font-bold opacity-70 block mb-1">System Notification</span>}
                                                <p className="text-sm">{msg.message}</p>
                                                <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-card shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                                />
                                <Button onClick={sendReply} disabled={isSending}>
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Mail className="h-12 w-12 mb-4 opacity-20" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
