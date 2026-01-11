"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShieldAlert, Settings, FileText, ArrowRight, Server, Lock, Activity, Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function AdminDashboard() {
    const [statsData, setStatsData] = useState<any>(null)
    const [recentLogs, setRecentLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                const headers = { "Authorization": `Bearer ${token}` }

                const [statsRes, logsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/dashboard-stats`, { headers }),
                    fetch(`${API_BASE_URL}/admin/audit-logs`, { headers })
                ])

                if (statsRes.ok) setStatsData(await statsRes.json())
                if (logsRes.ok) {
                    const logs = await logsRes.json()
                    setRecentLogs(logs.slice(0, 5))
                }
            } catch (err) {
                console.error("Failed to fetch admin data:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAdminData()
    }, [])

    const stats = [
        { title: "Total Staff", value: statsData?.totalStaff ?? "...", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Active Admins", value: statsData?.activeAdmins ?? "...", icon: Lock, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "System Alerts", value: statsData?.alerts ?? "0", icon: ShieldAlert, color: "text-green-500", bg: "bg-green-500/10" },
        { title: "Server Status", value: statsData?.systemStatus ?? "Online", icon: Server, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ]

    const adminModules = [
        {
            title: "User Management",
            description: "Manage staff accounts, roles, and permissions.",
            href: "/admin/users",
            icon: Users,
            color: "bg-blue-500",
        },
        {
            title: "Audit Logs",
            description: "Track system activities and security events.",
            href: "/admin/logs",
            icon: FileText,
            color: "bg-orange-500",
        },
        {
            title: "System Settings",
            description: "Configure departments, reasons, and limits.",
            href: "/admin/settings",
            icon: Settings,
            color: "bg-slate-700",
        },
        {
            title: "Security & Access",
            description: "Review failed logins and active sessions.",
            href: "/admin/security",
            icon: Lock,
            color: "bg-red-500",
        },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b bg-card px-6 sticky top-0 z-10">
                <div className="flex items-center gap-3 font-bold text-xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                        <ShieldAlert className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span>Admin Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Live
                    </div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm">Exit to Dashboard</Button>
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-8 space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Administration Overview</h1>
                    <p className="text-lg text-muted-foreground">Monitor system health and manage administrative operations.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title} className="border-border bg-card shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={`rounded-full p-2.5 ${stat.bg}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Module Grid */}
                    <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
                        {adminModules.map((module) => (
                            <Link key={module.title} href={module.href}>
                                <Card className="group h-full cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg bg-card overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                        <div className={`rounded-xl p-3 text-white ${module.color}`}>
                                            <module.icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl">{module.title}</CardTitle>
                                            <CardDescription className="line-clamp-1">{module.description}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-0 flex justify-end">
                                        <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            Open Module <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Recent Activity Card */}
                    <Card className="border-border bg-card shadow-sm h-full truncate">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Recent Activity</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <CardDescription>Latest actions by administrators.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : recentLogs.length > 0 ? (
                                    recentLogs.map((log, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-emerald-500' :
                                                log.status === 'warning' ? 'bg-amber-500' :
                                                    log.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none text-foreground">{log.details}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-semibold">{log.username}</span>
                                                    <span>•</span>
                                                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-10">No recent activity.</p>
                                )}
                            </div>
                            <Link href="/admin/logs" className="mt-6 block">
                                <Button variant="outline" className="w-full text-xs h-9">View Full Audit Log</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
