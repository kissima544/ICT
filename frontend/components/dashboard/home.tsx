"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface ApiVisitor {
  id: number
  full_Name: string
  program: string
  student_Year: string
  purpose: string
  visiteDate: string
  time_in: string
  time_out: string
}

export function DashboardHome() {
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
        toast.error("Failed to load dashboard stats from server")
      }
    }
    loadVisitors()
  }, [])

  const stats = useMemo(() => {
    const isActive = (v: ApiVisitor) => !v.time_out || v.time_out.startsWith("00:00:00")

    const total = visitors.length
    const checkedIn = visitors.filter(isActive).length
    const checkedOut = total - checkedIn

    // crude average visit time in hours (if both in/out present)
    const durations: number[] = []
    visitors.forEach((v) => {
      if (!v.time_in || isActive(v)) return
      const [inH, inM] = v.time_in.split(":").map(Number)
      const [outH, outM] = v.time_out.split(":").map(Number)
      if (isNaN(inH) || isNaN(outH)) return
      const start = inH * 60 + inM
      const end = outH * 60 + outM
      if (end > start) durations.push((end - start) / 60)
    })
    const avgHours =
      durations.length > 0
        ? `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)}h`
        : "0h"

    const formatPercent = (value: number) => `${value.toFixed(0)}%`

    return [
      {
        title: "Total Visitors",
        value: total.toString(),
        change: formatPercent(0),
        trend: "up" as const,
        icon: Users,
        description: "All time",
      },
      {
        title: "Checked In",
        value: checkedIn.toString(),
        change: formatPercent(0),
        trend: "up" as const,
        icon: UserCheck,
        description: "Currently active",
      },
      {
        title: "Checked Out",
        value: checkedOut.toString(),
        change: formatPercent(0),
        trend: "up" as const,
        icon: UserX,
        description: "All time",
      },
      {
        title: "Avg. Visit Time",
        value: avgHours,
        change: formatPercent(0),
        trend: "down" as const,
        icon: Clock,
        description: "Per visitor",
      },
    ]
  }, [visitors])

  const recentVisitors = useMemo(
    () =>
      visitors
        .slice()
        .sort((a, b) => new Date(b.visiteDate).getTime() - new Date(a.visiteDate).getTime())
        .slice(0, 5)
        .map((v) => {
          const date = new Date(v.visiteDate)
          const time = v.time_in || v.time_out || ""
          const active = !v.time_out || v.time_out.startsWith("00:00:00")
          return {
            name: v.full_Name,
            program: v.program,
            time: `${date.toLocaleDateString()} ${time}`,
            status: active ? "checked-in" : "checked-out",
          }
        }),
    [visitors],
  )

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">Here's an overview of your visitor management system.</p>
      </div>

      {/* Stats Grid (live from backend) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={stat.trend === "up" ? "text-primary text-sm" : "text-destructive text-sm"}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Visitors (live from backend) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Visitors</CardTitle>
          <CardDescription className="text-muted-foreground">Latest visitor activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentVisitors.map((visitor, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">
                      {visitor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">{visitor.program}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground">{visitor.time}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visitor.status === "checked-in" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {visitor.status === "checked-in" ? "Checked In" : "Checked Out"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
