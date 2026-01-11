"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Users, Home, BarChart3, Table, ChevronLeft, ChevronRight, Activity, ShieldAlert, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "chart", label: "Visitors Chart", icon: BarChart3 },
  { id: "table", label: "Visitors Table", icon: Table },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "inbox", label: "Messages", icon: Mail },

]

export function DashboardSidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const userStr = localStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      setUserRole(user?.role || null)
    } catch (e) {
      console.error("Error reading user role:", e)
    }
  }, [])
  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Users className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">ICT Visitors</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Users className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-border bg-card text-foreground shadow-md hover:bg-secondary"
        onClick={onToggle}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-4">
        <ul className="space-y-1">
          {menuItems
            .filter(item => {
              if (userRole === "Student") return item.id === "home" // Only home (Check-in) for student
              return true
            })
            .map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span>
                      {userRole === "Student" && item.id === "home" ? "Check-in/Out" : item.label}
                    </span>
                  )}
                </button>
              </li>
            ))}
        </ul>

        {mounted && userRole === "Admin" && (
          <div className="pt-4 border-t border-sidebar-border">
            {!collapsed && <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">Management</p>}
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary transition-all",
                collapsed && "justify-center"
              )}
            >
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Admin Portal</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 flex items-center justify-between">
        {!collapsed && <p className="text-xs text-sidebar-foreground/50">© 2025 ICT Visitors</p>}
        {/* Toggle Theme - visible even when collapsed if we want, or just when expanded. Let's make it always accessible or adjust layout */}
        <div className={cn("flex justify-center", collapsed ? "w-full" : "")}>
          <ModeToggle />
        </div>
      </div>
    </aside>
  )
}
