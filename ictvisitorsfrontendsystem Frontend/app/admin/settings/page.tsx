"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Save, RefreshCw, Database, Bell, Shield, Globe, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [settings, setSettings] = useState<any[]>([])

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                const res = await fetch(`${API_BASE_URL}/admin/settings`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setSettings(data)
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const getSetting = (key: string, defaultValue: string) => {
        return settings.find(s => s.key === key)?.value || defaultValue
    }

    const updateSettingLocal = (key: string, value: string) => {
        setSettings(prev => {
            const existing = prev.find(s => s.key === key)
            if (existing) {
                return prev.map(s => s.key === key ? { ...s, value } : s)
            }
            return [...prev, { key, value }]
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
            const res = await fetch(`${API_BASE_URL}/admin/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(settings),
            })

            if (res.ok) {
                toast.success("Settings saved successfully")
            } else {
                toast.error("Failed to save settings")
            }
        } catch (err) {
            toast.error("Error connecting to server")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-muted-foreground hover:text-primary">Admin</Link>
                            <span className="text-muted-foreground">/</span>
                            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                        </div>
                        <p className="text-muted-foreground">Global configuration for the Visitor Management System.</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-muted/50 p-1 h-auto">
                        <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" /> General</TabsTrigger>
                        <TabsTrigger value="departments" className="gap-2"><Database className="h-4 w-4" /> Departments</TabsTrigger>
                        <TabsTrigger value="programs" className="gap-2"><Database className="h-4 w-4" /> Programs</TabsTrigger>
                        <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
                        <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" /> Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <Card className="border-border">
                                    <CardHeader>
                                        <CardTitle>System Information</CardTitle>
                                        <CardDescription>Basic system identifiers and localization.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="site-name">Organization Name</Label>
                                            <Input
                                                id="site-name"
                                                value={getSetting("org_name", "ICT Visitor Management")}
                                                onChange={(e) => updateSettingLocal("org_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="timezone">System Timezone</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="timezone"
                                                    value={getSetting("timezone", "(GMT+08:00) Manila")}
                                                    onChange={(e) => updateSettingLocal("timezone", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="departments" className="mt-6 space-y-6">
                        <EntityManager
                            title="Departments"
                            description="Manage the list of departments available in dropdowns."
                            endpoint="departments"
                        />
                    </TabsContent>

                    <TabsContent value="programs" className="mt-6 space-y-6">
                        <EntityManager
                            title="Programs"
                            description="Manage the list of programs available in dropdowns."
                            endpoint="programs"
                        />
                    </TabsContent>

                    <TabsContent value="security" className="mt-6 space-y-6">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>Authentication Policy</CardTitle>
                                <CardDescription>Manage how users access the administrative area.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Require MFA for Admins</Label>
                                        <p className="text-sm text-muted-foreground">Enforce 2-step verification for all administrative accounts.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Auto-logout Inactive Sessions</Label>
                                        <p className="text-sm text-muted-foreground">Log users out after 15 minutes of inactivity.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ip-whitelist">IP Whitelist (Optional)</Label>
                                    <Input id="ip-whitelist" placeholder="e.g. 192.168.1.0/24" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-6">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>System Notifications</CardTitle>
                                <CardDescription>Configure when and how to receive system alerts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Daily Email Summary</Label>
                                        <p className="text-sm text-muted-foreground">Receive a summary of all visitors at the end of the day.</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>High Occupancy Alert</Label>
                                        <p className="text-sm text-muted-foreground">Notify when visitor count exceeds 50.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="data" className="mt-6">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>Data Management</CardTitle>
                                <CardDescription>Retention and archival settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="retention">Data Retention Period</Label>
                                    <Input id="retention" defaultValue="2 Years" />
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <Button variant="destructive" className="w-full">
                                        Purge All Visitor History
                                    </Button>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">Warning: This action is irreversible.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function EntityManager({ title, description, endpoint }: { title: string, description: string, endpoint: string }) {
    const [items, setItems] = useState<any[]>([])
    const [newItemName, setNewItemName] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [endpoint])

    const fetchItems = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (err) {
            console.error(err)
            toast.error(`Failed to load ${title}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!newItemName.trim()) return

        setIsAdding(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newItemName })
            })

            if (res.ok) {
                toast.success(`${title} added successfully`)
                setNewItemName("")
                fetchItems()
            } else {
                toast.error("Failed to add item")
            }
        } catch (err) {
            toast.error("Error connecting to server")
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success("Item deleted")
                fetchItems()
            } else {
                toast.error("Failed to delete item")
            }
        } catch (err) {
            toast.error("Error connecting to server")
        }
    }

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2">
                    <Input
                        placeholder={`Add new ${title.slice(0, -1)}...`}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={isAdding || !newItemName.trim()}>
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>}
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                                <span className="font-medium">{item.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
