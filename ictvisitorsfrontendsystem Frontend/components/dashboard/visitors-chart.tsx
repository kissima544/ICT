"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
} from "recharts"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

interface ApiVisitor {
  id: number
  visiteDate: string
}

interface WeeklyPoint {
  day: string
  visitors: number
}

interface MonthlyPoint {
  month: string
  visitors: number
}

interface HourlyPoint {
  hour: string
  visitors: number
}

export function VisitorsChart() {
  const [visitors, setVisitors] = useState<ApiVisitor[]>([])

  useEffect(() => {
    const loadVisitors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/visitors`)
        if (!res.ok) throw new Error("Failed to load visitors")
        const data: ApiVisitor[] = await res.json()
        setVisitors(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load analytics data from server")
      }
    }
    loadVisitors()
  }, [])

  const weeklyData: WeeklyPoint[] = useMemo(() => {
    const counts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    }
    visitors.forEach((v) => {
      const d = new Date(v.visiteDate)
      if (isNaN(d.getTime())) return
      const dayIndex = d.getDay() // 0 = Sun
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
      const key = map[dayIndex]
      counts[key] = (counts[key] || 0) + 1
    })
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      visitors: counts[day] || 0,
    }))
  }, [visitors])

  const monthlyData: MonthlyPoint[] = useMemo(() => {
    const counts: Record<string, number> = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    visitors.forEach((v) => {
      const d = new Date(v.visiteDate)
      if (isNaN(d.getTime())) return
      const key = monthNames[d.getMonth()]
      counts[key] = (counts[key] || 0) + 1
    })
    return monthNames.map((m) => ({
      month: m,
      visitors: counts[m] || 0,
    }))
  }, [visitors])

  const hourlyData: HourlyPoint[] = useMemo(() => {
    const counts: Record<string, number> = {}
    visitors.forEach((v) => {
      const d = new Date(v.visiteDate)
      if (isNaN(d.getTime())) return
      const hour = `${d.getHours()}:00`
      counts[hour] = (counts[hour] || 0) + 1
    })
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    return hours.map((h) => ({
      hour: h,
      visitors: counts[h] || 0,
    }))
  }, [visitors])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visitors Analytics</h1>
        <p className="text-muted-foreground">Visual insights into visitor patterns and trends</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Chart (live from backend) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Weekly Visitors</CardTitle>
            <CardDescription className="text-muted-foreground">Visitor count for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <defs>
                  <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#428BCA" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#5CB3CC" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <Bar dataKey="visitors" fill="url(#weeklyGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend (live from backend) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Trend</CardTitle>
            <CardDescription className="text-muted-foreground">Visitor trend over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <defs>
                  <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9B59B6" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#8E44AD" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7D3C98" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#9B59B6"
                  strokeWidth={3}
                  fill="url(#monthlyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours (live from backend) */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Peak Hours</CardTitle>
            <CardDescription className="text-muted-foreground">Busiest times of the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <defs>
                  <linearGradient id="hourlyGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16A085" stopOpacity={1} />
                    <stop offset="50%" stopColor="#27AE60" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2ECC71" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="url(#hourlyGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#27AE60", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#2ECC71" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
