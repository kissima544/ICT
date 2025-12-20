"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { OTPModal } from "@/components/otp-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

import { API_BASE_URL } from "@/lib/config"

/*
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"
*/
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "593848406993-vjp90tn3evm9rt5dpqhre1j3j3l53soa.apps.googleusercontent.com"

const decodeJwtPayload = (token: string): any | null => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  // Load Google Identity script and initialize (using button render, not One Tap/FedCM)
  useEffect(() => {
    if (typeof window === "undefined") return

    const existing = document.getElementById("google-identity-script")
    if (existing) {
      // Script already loaded, just render button
      const google = (window as any).google
      if (google?.accounts?.id) {
        const buttonContainer = document.getElementById("google-signin-button")
        if (buttonContainer && !buttonContainer.hasChildNodes()) {
          google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
          })
        }
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.id = "google-identity-script"
    script.onload = () => {
      const google = (window as any).google
      if (!google || !google.accounts || !google.accounts.id) return

      // Initialize with callback (same as auth.js style)
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            // Same contract as auth.js: send { idToken } to backend
            const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
              toast.error(data.message || "Google login failed")
              return
            }

            // Backend is OTP-based: expects frontend to show OTP modal
            if (data.requiresOtp) {
              setGoogleIdToken(response.credential as string)
              setShowOTPModal(true)
              toast.info("Authentication code sent to your email.")
              return
            }

            // Fallback: if backend ever returns a token directly
            if (data.token) {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("token", data.token as string)
                const payload = decodeJwtPayload(response.credential)
                if (payload) {
                  const profile = {
                    name: payload.name || payload.given_name || "User",
                    email: payload.email || "",
                    photo: payload.picture || "",
                    provider: "google",
                  }
                  window.localStorage.setItem("user", JSON.stringify(profile))
                }
              }
              toast.success("Google login successful!")
              router.push("/dashboard")
            }
          } catch (err) {
            console.error(err)
            toast.error("Google login request failed")
          }
        },
      })

      // Render hidden Google Sign-In button (for programmatic triggering)
      const buttonContainer = document.getElementById("google-signin-button")
      if (buttonContainer) {
        google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular",
        })
      }
    }

    document.head.appendChild(script)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      toast.warning("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.message || "Login failed")
        return
      }

      if (data.token) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("token", data.token as string)
          // Store basic user profile for header (local login)
          const profile = {
            name: formData.username,
            email: formData.username,
            photo: "",
            provider: "local",
          }
          window.localStorage.setItem("user", JSON.stringify(profile))
        }
      }

      toast.success("Login successful!")
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Unable to reach server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleOtpVerify = async (code: string) => {
    if (!googleIdToken) {
      toast.error("Missing Google token. Please try signing in again.")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: googleIdToken, otp: code }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.token) {
        toast.error(data.message || "Invalid or expired code")
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", data.token as string)
        const payload = decodeJwtPayload(googleIdToken)
        if (payload) {
          const profile = {
            name: payload.name || payload.given_name || "User",
            email: payload.email || "",
            photo: payload.picture || "",
            provider: "google",
          }
          window.localStorage.setItem("user", JSON.stringify(profile))
        }
      }

      setShowOTPModal(false)
      toast.success("Verification successful!")
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Error verifying code. Please try again.")
    }
  }

  const handleGoogleOtpResend = async () => {
    if (!googleIdToken) {
      toast.error("Missing Google token. Please try signing in again.")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: googleIdToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || "Failed to resend code")
        return
      }
      toast.info(data.message || "New code sent to your email.")
    } catch (err) {
      console.error(err)
      toast.error("Error resending code. Please try again.")
    }
  }

  // Google login is now handled by the rendered button, no need for handleGoogleLogin

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">ICT Visitors</span>
        </Link>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-input border-border pr-10 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In button - custom styled button that triggers Google flow */}
              <div id="google-signin-button" className="hidden" />
              <Button
                type="button"
                variant="outline"
                className="w-full border-border bg-transparent text-foreground hover:bg-secondary"
                onClick={() => {
                  const google = (window as any).google
                  if (google?.accounts?.id) {
                    // Click the hidden rendered Google button
                    const buttonContainer = document.getElementById("google-signin-button")
                    const googleButton = buttonContainer?.querySelector('[role="button"]') as HTMLElement
                    if (googleButton) {
                      googleButton.click()
                    }
                  }
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <OTPModal
        open={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleGoogleOtpVerify}
        onResend={handleGoogleOtpResend}
      />

      <ForgotPasswordModal open={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </div>
  )
}
