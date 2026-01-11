"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Search, Filter, Download, Calendar, User, Info, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

interface AuditLog {
    id: number
    timestamp: string
    username: string
    action: string
    module: string
    details: string
    status: "success" | "warning" | "error" | "info"
    ipAddress: string
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setLogs(data)
                }
            } catch (err) {
                console.error("Failed to fetch logs:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchLogs()
    }, [])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case "error": return <AlertTriangle className="h-4 w-4 text-destructive" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-muted-foreground hover:text-primary">Admin</Link>
                            <span className="text-muted-foreground">/</span>
                            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                        </div>
                        <p className="text-muted-foreground">Track all administrative and security actions in the system.</p>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Logs
                    </Button>
                </div>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs by action, user or details..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Date Range
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter by Module
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead className="w-[120px]">User</TableHead>
                                        <TableHead className="w-[150px]">Action</TableHead>
                                        <TableHead className="w-[120px]">Module</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="w-[100px]">IP Address</TableHead>
                                        <TableHead className="w-[80px] text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : logs.filter(log =>
                                        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        log.details.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-medium">{log.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold uppercase">{log.action}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                    {log.module}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.details}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.ipAddress}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {getStatusIcon(log.status)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {!isLoading && logs.length === 0 && (
                            <div className="py-20 text-center space-y-3">
                                <Shield className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                                <p className="text-muted-foreground">No audit logs found for the selected criteria.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
