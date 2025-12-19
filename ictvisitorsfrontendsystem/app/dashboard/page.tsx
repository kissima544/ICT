"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardHome } from "@/components/dashboard/home"
import { VisitorsChart } from "@/components/dashboard/visitors-chart"
import { VisitorsTable } from "@/components/dashboard/visitors-table"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
          {activeTab === "home" && <DashboardHome />}
          {activeTab === "chart" && <VisitorsChart />}
          {activeTab === "table" && <VisitorsTable />}
        </main>
      </div>
    </div>
  )
}
