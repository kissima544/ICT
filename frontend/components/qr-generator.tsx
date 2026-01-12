"use client"

import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"

interface QRGeneratorProps {
    value: string
    visitorName: string
}

export function QRGenerator({ value, visitorName }: QRGeneratorProps) {
    const qrRef = useRef<HTMLDivElement>(null)

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector("canvas")
        if (canvas) {
            const url = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.href = url
            link.download = `visitor-badge-${visitorName.replace(/\s+/g, "-").toLowerCase()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("QR Code downloaded successfully")
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-white w-fit mx-auto">
            <div ref={qrRef} className="bg-white p-2">
                <QRCodeCanvas
                    value={value}
                    size={200}
                    level={"H"}
                    includeMargin={true}
                />
            </div>
            <div className="text-center">
                <p className="font-semibold">{visitorName}</p>
                <p className="text-sm text-muted-foreground">Scan to Check-in</p>
            </div>
            <div className="flex w-full gap-2">
                <Button onClick={downloadQR} className="flex-1" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast.info("Link copied to clipboard")}>
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
