"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface OTPModalProps {
  open: boolean
  onClose: () => void
  onVerify: (code: string) => Promise<void> | void
  onResend?: () => Promise<void> | void
}

export function OTPModal({ open, onClose, onVerify, onResend }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (open) {
      setOtp(["", "", "", "", "", ""])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [open])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("")
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit
      })
      setOtp(newOtp)
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6) {
      toast.warning("Please enter the complete code")
      return
    }

    setIsLoading(true)
    try {
      await onVerify(code)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    if (onResend) {
      Promise.resolve(onResend()).catch((err) => {
        console.error(err)
        toast.error("Failed to resend code")
      })
    } else {
      toast.info("New code sent to your email")
    }
    setOtp(["", "", "", "", "", ""])
    inputRefs.current[0]?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-foreground">Enter Authentication Code</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We've sent a 6-digit code to your email address
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 bg-input border-border text-center text-lg font-semibold text-foreground"
              />
            ))}
          </div>
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleResend}
              className="w-full border-border text-foreground hover:bg-secondary bg-transparent"
            >
              Resend Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
