"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { LogIn, LogOut, Clock, History, Loader2, QrCode, Star, Download, ShieldCheck, Camera, User, RefreshCw, X, Mail } from "lucide-react"
import { jsPDF } from "jspdf"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"

export function StudentDashboard() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [activeSession, setActiveSession] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    // Form state
    const [fullName, setFullName] = useState("")
    const [program, setProgram] = useState("")
    const [studentYear, setStudentYear] = useState("")
    const [purpose, setPurpose] = useState("")
    const [department, setDepartment] = useState("")

    // Rating state
    const [showRatingDialog, setShowRatingDialog] = useState(false)
    const [selectedRating, setSelectedRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)

    // Camera state
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
    const [showCamera, setShowCamera] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)

    const [departments, setDepartments] = useState<any[]>([])
    const [programs, setPrograms] = useState<any[]>([])

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const token = localStorage.getItem("token")
                const headers = { "Authorization": `Bearer ${token}` }
                const [deptRes, progRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/departments`, { headers }),
                    fetch(`${API_BASE_URL}/programs`, { headers })
                ])
                if (deptRes.ok) setDepartments(await deptRes.json())
                if (progRes.ok) setPrograms(await progRes.json())
            } catch (err) {
                console.error("Failed to fetch lists", err)
            }
        }
        fetchLists()
    }, [])

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            const parsed = JSON.parse(storedUser)
            setUser(parsed)
            setFullName(parsed.name || "")
            fetchData(parsed)
        }
    }, [])

    const fetchData = async (currentUser: any) => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/visitors`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const allVisitors = await res.json()
                // Use the passed currentUser instead of state to avoid race condition
                const myVisits = allVisitors.filter((v: any) =>
                    v.full_Name === (currentUser?.name) ||
                    v.full_Name === (currentUser?.username) ||
                    v.full_Name === (currentUser?.email)
                )

                setHistory(myVisits.slice(0, 5))
                const active = myVisits.find((v: any) => !v.time_out || v.time_out === "")
                setActiveSession(active)
            }
        } catch (err) {
            console.error("Failed to fetch student data:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 400, height: 400, facingMode: "user" }
            })
            setStream(mediaStream)
            setShowCamera(true)
        } catch (err) {
            toast.error("Could not access camera. Please check permissions.")
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setShowCamera(false)
    }

    const capturePhoto = () => {
        const video = document.getElementById("camera-preview") as HTMLVideoElement
        if (!video) return
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const base64 = canvas.toDataURL("image/jpeg", 0.7)
            setCapturedPhoto(base64)
            stopCamera()
        }
    }

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName || !program || !studentYear || !purpose || !department) {
            toast.error("Please fill in all fields")
            return
        }

        setIsSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/visitors`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_Name: fullName,
                    email: user?.email, // Link visit to user email for notifications
                    program,
                    student_Year: studentYear,
                    purpose,
                    department,
                    Photo: capturedPhoto
                })
            })

            if (res.ok) {
                toast.success("Checked in successfully!")
                fetchData(user)
                setPurpose("")
                setDepartment("")
                // Keep name/program/year for convenience or reset? 
                // Resetting for a clean slate:
                setFullName(user?.name || "")
                setProgram("")
                setStudentYear("")
                setCapturedPhoto(null)
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error("Check-in failed:", errorData)
                toast.error(errorData.message || "Failed to check in")
            }
        } catch (err) {
            toast.error("Connection error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCheckOut = async () => {
        if (!activeSession) return

        // If rating hasn't been shown yet, show it
        if (!showRatingDialog) {
            setShowRatingDialog(true)
            return
        }

        setIsSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/visitors/checkout/${activeSession.id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ rating: selectedRating })
            })

            if (res.ok) {
                toast.success("Checked out successfully! Thank you for your feedback.")
                setShowRatingDialog(false)
                setSelectedRating(0)
                fetchData(user)
            } else {
                toast.error("Failed to check out")
            }
        } catch (err) {
            toast.error("Connection error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const downloadVisitorPass = async () => {
        if (!activeSession) return

        const element = document.getElementById('digital-visitor-pass')
        if (!element) {
            toast.error("Could not find pass element")
            return
        }

        try {
            // Use html-to-image for better support of modern CSS (gradients, oklch colors)
            const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#ffffff' })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [100, 150] // Mini ID size
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const image = new Image()
            image.src = dataUrl

            // Wait for image to load to get dimensions (though toPng usually returns ready data)
            // Simpler calculation assuming typical aspect ratio or just fitting width
            // Since we know the width of the card is roughly 320px
            const aspect = element.offsetHeight / element.offsetWidth
            const pdfHeight = pdfWidth * aspect

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`${activeSession.full_Name}_VisitorPass.pdf`)
            toast.success("Visitor pass downloaded!")
        } catch (err) {
            console.error("PDF generation failed:", err)
            toast.error("Failed to generate PDF")
        }
    }



    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Student Portal</h1>
                    <p className="text-muted-foreground">Welcome, {user?.name || user?.username}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Check-in / Active Status */}
                <Card className="border-border bg-card shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {activeSession ? <Clock className="h-5 w-5 text-emerald-500" /> : <LogIn className="h-5 w-5 text-primary" />}
                            {activeSession ? "Current Session" : "New Check-in"}
                        </CardTitle>
                        <CardDescription>
                            {activeSession ? "You are currently checked in." : "Fill in the details to start your visit."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeSession ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Purpose:</span>
                                        <span className="font-medium">{activeSession.purpose}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Department:</span>
                                        <span className="font-medium">{activeSession.department || "General"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Started at:</span>
                                        <span className="font-medium">{new Date(activeSession.visiteDate).toLocaleTimeString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center pt-2 pb-6">
                                    {/* ID Card Container */}
                                    <div id="digital-visitor-pass" className="relative w-full max-w-[320px] rounded-xl overflow-hidden bg-white shadow-xl border border-slate-200">
                                        {/* Header Background */}
                                        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800 flex flex-col items-center pt-3">
                                            <div className="flex items-center gap-2 text-white/95 drop-shadow-sm">
                                                <ShieldCheck className="h-4 w-4" />
                                                <span className="font-bold tracking-widest text-xs uppercase opacity-90">Official Visitor Pass</span>
                                            </div>
                                            <div className="text-[10px] text-blue-100 font-medium tracking-wider mt-0.5 uppercase opacity-75">
                                                ICT Management System
                                            </div>
                                        </div>

                                        {/* Circular Photo */}
                                        <div className="absolute top-12 left-1/2 -translate-x-1/2">
                                            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md flex items-center justify-center">
                                                {activeSession.photo ? (
                                                    <img
                                                        src={activeSession.photo}
                                                        alt="Visitor"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-12 w-12 text-slate-300" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="pt-16 pb-6 px-6 text-center space-y-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                                    {activeSession.full_Name}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                                                    Visitor Pass
                                                </p>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-xs text-left bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="text-slate-400 uppercase text-[10px] font-semibold">Department</p>
                                                    <p className="font-medium text-slate-700 truncate">{activeSession.department || "General"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 uppercase text-[10px] font-semibold">Purpose</p>
                                                    <p className="font-medium text-slate-700 truncate">{activeSession.purpose}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 uppercase text-[10px] font-semibold">Date</p>
                                                    <p className="font-medium text-slate-700">{new Date(activeSession.visiteDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 uppercase text-[10px] font-semibold">Time In</p>
                                                    <p className="font-medium text-slate-900 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full w-fit">
                                                        {new Date(activeSession.visiteDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* QR Code */}
                                            <div className="flex flex-col items-center gap-2 pt-2">
                                                {activeSession.visitToken ? (
                                                    <>
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                            <QRCodeSVG value={activeSession.visitToken} size={100} />
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Scan at Exit</p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg w-full h-32">
                                                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin mb-2" />
                                                        <p className="text-[10px] text-slate-400 font-medium">Generating Code...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer Strip */}
                                        <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-800"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        onClick={downloadVisitorPass}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Pass
                                    </Button>
                                    <Button
                                        className="h-11"
                                        onClick={handleCheckOut}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                                        Check Out
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckIn} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="program">Program / Course</Label>
                                        <Select value={program} onValueChange={setProgram}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select Program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs.map(p => (
                                                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Student Year</Label>
                                        <Input
                                            id="year"
                                            placeholder="e.g. 1st Year, 2nd Year"
                                            value={studentYear}
                                            onChange={(e) => setStudentYear(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dept">Department</Label>
                                        <Select value={department} onValueChange={setDepartment}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purpose">Purpose of Visit</Label>
                                    <Input
                                        id="purpose"
                                        placeholder="e.g. Library, Registrar, Inquiry"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                {/* AI Selfie Capture Section */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <Camera className="h-4 w-4 text-primary" />
                                        Visitor Identification Photo (Required)
                                    </Label>

                                    {!showCamera && !capturedPhoto && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-24 border-dashed border-2 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
                                            onClick={startCamera}
                                        >
                                            <Camera className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-muted-foreground">Tap to take a Selfie</span>
                                        </Button>
                                    )}

                                    {showCamera && (
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-primary">
                                            <video
                                                id="camera-preview"
                                                autoPlay
                                                playsInline
                                                ref={(el) => { if (el && stream) el.srcObject = stream }}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                                <Button type="button" size="icon" variant="destructive" onClick={stopCamera}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" size="icon" className="bg-emerald-500 hover:bg-emerald-600 h-12 w-12 rounded-full shadow-lg" onClick={capturePhoto}>
                                                    <Camera className="h-6 w-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {capturedPhoto && !showCamera && (
                                        <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500 aspect-video group">
                                            <img src={capturedPhoto} alt="Selfie" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Retake
                                                </Button>
                                                <div className="bg-emerald-500 text-white p-2 rounded-full">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                                    disabled={isSubmitting || (!capturedPhoto && !showCamera)}
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                                    Complete Check-in
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Quick History */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Recent Visits
                        </CardTitle>
                        <CardDescription>Your last 5 sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {history.length > 0 ? (
                                history.map((visit) => (
                                    <div key={visit.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border">
                                        <div>
                                            <p className="text-sm font-medium">{visit.purpose}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(visit.visiteDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-10">No history yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Rate Your Visit</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            How was your experience at the {activeSession?.department || "ICT Office"}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center space-x-2 py-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setSelectedRating(star)}
                            >
                                <Star
                                    className={`h-10 w-10 ${(hoverRating || selectedRating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button
                            onClick={handleCheckOut}
                            disabled={isSubmitting || selectedRating === 0}
                            className="w-full sm:w-auto px-8"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Confirm & Check Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
