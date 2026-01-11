"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const user = JSON.parse(window.localStorage.getItem("user") || "{}")
            if (user.role === "Admin") {
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
                router.push("/dashboard")
            }
        }
    }, [router])

    if (isAuthorized === null) return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    )

    if (isAuthorized === false) return null // Redirecting

    return <>{children}</>
}
