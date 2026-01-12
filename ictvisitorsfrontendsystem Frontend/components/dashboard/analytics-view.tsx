"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUp, ArrowDown, Users, Clock, Activity, Star, Smile } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function AnalyticsView() {
    const [data, setData] = useState<any[]>([])
    const [happinessData, setHappinessData] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const headers = { "Authorization": `Bearer ${token}` }

            // Fetch chart data
            const chartRes = await fetch(`${API_BASE_URL}/analytics/chart-data`, { headers })
            if (chartRes.ok) setData(await chartRes.json())

            // Fetch dashboard stats
            const statsRes = await fetch(`${API_BASE_URL}/analytics/dashboard`, { headers })
            if (statsRes.ok) setStats(await statsRes.json())

            // Fetch happiness data
            const happyRes = await fetch(`${API_BASE_URL}/analytics/happiness`, { headers })
            if (happyRes.ok) setHappinessData(await happyRes.json())

        } catch (err) {
            console.error("Failed to fetch analytics:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Analytics Overview</h2>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalVisitorsToday || 0}</div>
                        <p className="text-xs text-muted-foreground">Unique visits recorded today</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeNow || 0}</div>
                        <p className="text-xs text-emerald-500 flex items-center">
                            Visitors currently on premises
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.peakHour || "--:--"}</div>
                        <p className="text-xs text-muted-foreground">Highest traffic recorded</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart */}
            <Card className="col-span-4 border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Visitor Traffic: Actual vs Predicted</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorVisitors)"
                                    name="Actual Visitors"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="hsl(var(--secondary))"
                                    strokeDasharray="5 5"
                                    fillOpacity={1}
                                    fill="url(#colorPredicted)"
                                    name="AI Prediction"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Happiness Score Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smile className="h-5 w-5 text-yellow-500" />
                            Department Happiness Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {happinessData.length > 0 ? happinessData.map((dept: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">{dept.department}</p>
                                        <p className="text-xs text-muted-foreground">{dept.totalReviews} reviews</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex text-yellow-500">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-3 w-3 ${s <= Math.round(dept.averageRating) ? "fill-yellow-500" : "text-slate-300"}`} />
                                            ))}
                                        </div>
                                        <span className="text-lg font-bold">{dept.averageRating}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-center text-muted-foreground py-10">No feedback data collected yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle>Peak Hours Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm text-blue-700 font-medium italic">
                                    ""Peak traffic is usually between 10 AM and 3 PM. Consider adding more staff to the ICT and Library areas during these hours.""
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-muted rounded flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground">Morning Shift</span>
                                    <span className="text-lg font-bold">Moderate</span>
                                </div>
                                <div className="p-3 bg-muted rounded flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground">Afternoon Shift</span>
                                    <span className="text-lg font-bold text-orange-500">High</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
