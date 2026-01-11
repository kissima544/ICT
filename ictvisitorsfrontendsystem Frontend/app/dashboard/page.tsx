"use client"

import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardHome } from "@/components/dashboard/home"
import { VisitorsChart } from "@/components/dashboard/visitors-chart"
import { VisitorsTable } from "@/components/dashboard/visitors-table"
import { AnalyticsView } from "@/components/dashboard/analytics-view"
import { AdminInbox } from "@/components/dashboard/admin-inbox"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserRole(user.role)
    }
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          {userRole === "Student" ? (
            <StudentDashboard />
          ) : (
            <>
              {activeTab === "home" && <DashboardHome />}
              {activeTab === "chart" && <VisitorsChart />}
              {activeTab === "table" && <VisitorsTable />}
              {activeTab === "analytics" && <AnalyticsView />}
              {activeTab === "inbox" && <AdminInbox />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
