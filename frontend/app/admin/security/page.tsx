"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, AlertTriangle, Globe, Smartphone, Monitor, MapPin } from "lucide-react"
import Link from "next/link"

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-muted-foreground hover:text-primary">Admin</Link>
                            <span className="text-muted-foreground">/</span>
                            <h1 className="text-2xl font-bold tracking-tight">Security & Access</h1>
                        </div>
                        <p className="text-muted-foreground">Monitor login attempts and manage system access policies.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">4</div>
                            <p className="text-xs text-muted-foreground">Users currently online</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-500">12</div>
                            <p className="text-xs text-muted-foreground">Across 3 unique IPs</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Account Lockouts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">0</div>
                            <p className="text-xs text-muted-foreground">No accounts currently blocked</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Recent Authentication Events</CardTitle>
                        <CardDescription>Real-time monitor of login activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { event: "Login Success", user: "admin", device: "Desktop", browser: "Chrome", location: "Manila, PH", time: "Just now", icon: Monitor, color: "text-emerald-500" },
                                { event: "Login Success", user: "receptionist_1", device: "Tablet", browser: "Safari", location: "Quezon City, PH", time: "45 mins ago", icon: Smartphone, color: "text-emerald-500" },
                                { event: "Invalid Password", user: "j.smith", device: "Desktop", browser: "Firefox", location: "Davao City, PH", time: "1 hour ago", icon: AlertTriangle, color: "text-amber-500" },
                                { event: "Blocked Attempt", user: "unknown", device: "Cloud Node", browser: "Unknown", location: "Singapore, SG", time: "3 hours ago", icon: Lock, color: "text-destructive" },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{item.event}</p>
                                            <p className="text-sm text-muted-foreground">User: <span className="text-foreground">{item.user}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Monitor className="h-3 w-3" />
                                            {item.device} • {item.browser}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {item.location}
                                        </div>
                                        <div className="font-medium text-foreground">
                                            {item.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle>Security Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10">
                                <Shield className="mr-2 h-4 w-4" />
                                Revoke All Staff Sessions
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Lock className="mr-2 h-4 w-4" />
                                Rotate API Encryption Keys
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Globe className="mr-2 h-4 w-4" />
                                View Blocked Countries
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-primary">System Shield Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm">Your system is protected by <strong>Advanced Role-Based Access Control</strong> and <strong>JWT Authentication</strong>.</p>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                                <li>HTTPS forced on all routes</li>
                                <li>Secure cookie handling enabled</li>
                                <li>XSS & CSRF protection active</li>
                                <li>Bcrypt password hashing (Cost factor 12)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
