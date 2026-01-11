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
import { SocialLoginButtons } from "@/components/social-login-buttons"
import { OTPModal } from "@/components/otp-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7099/api"
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "593848406993-vjp90tn3evm9rt5dpqhre1j3j3l53soa.apps.googleusercontent.com"
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "879635468332274"
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "sbaw5trug31elajtai"

// PKCE Helper Functions
async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(a: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(a))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(v: string) {
  const hashed = await sha256(v);
  return base64UrlEncode(hashed);
}

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
  const [socialEmail, setSocialEmail] = useState<string | null>(null) // For other social providers
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  // Load Facebook SDK
  useEffect(() => {
    if (typeof window === "undefined") return

      // Setup FB async init
      ; (window as any).fbAsyncInit = function () {
        ; (window as any).FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };

    // Load SDK script
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      (js as any).src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, [])

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

                // Extract role from backend token
                const payload = decodeJwtPayload(data.token as string)
                console.log("[DEBUG] Google Login Payload:", payload)
                const role = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload?.role || "Staff"
                console.log("[DEBUG] Extracted Role:", role)

                const googlePayload = decodeJwtPayload(response.credential)
                const profile = {
                  name: googlePayload?.name || googlePayload?.given_name || "User",
                  email: googlePayload?.email || "",
                  photo: googlePayload?.picture || "",
                  provider: "google",
                  role: role
                }
                window.localStorage.setItem("user", JSON.stringify(profile))
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

          const payload = decodeJwtPayload(data.token as string)
          console.log("[DEBUG] Local Login Payload:", payload)
          const role = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload?.role || "Staff"
          console.log("[DEBUG] Extracted Role:", role)

          // Store basic user profile for header (local login)
          const profile = {
            name: formData.username,
            email: formData.username,
            photo: "",
            provider: "local",
            role: role
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

        const payload = decodeJwtPayload(data.token as string)
        console.log("[DEBUG] OTP Verify Payload:", payload)
        const role = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload?.role || "Staff"
        console.log("[DEBUG] Extracted Role:", role)

        const googlePayload = decodeJwtPayload(googleIdToken)
        const profile = {
          name: googlePayload?.name || googlePayload?.given_name || "User",
          email: googlePayload?.email || "",
          photo: googlePayload?.picture || "",
          provider: "google",
          role: role
        }
        window.localStorage.setItem("user", JSON.stringify(profile))
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

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)

    // Facebook specific flow
    if (provider === "facebook") {
      const FB = (window as any).FB;
      if (!FB) {
        toast.error("Facebook SDK not loaded. Try disabling adblockers.");
        setIsLoading(false);
        return;
      }

      FB.login((response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log('Sending token to backend:', accessToken);

          // Call backend with real token
          fetch(`${API_BASE_URL}/auth/facebook-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken })
          })
            .then(res => res.json().then(data => ({ status: res.status, body: data })))
            .then(({ status, body }) => {
              if (status === 200) {
                if (body.requiresOtp) {
                  setSocialEmail(body.email);
                  setGoogleIdToken(null);
                  setShowOTPModal(true);
                  toast.info(`Authentication code sent to ${body.email}`);
                } else if (body.token) {
                  // Direct successful login (Facebook)
                  if (typeof window !== "undefined") {
                    localStorage.setItem("token", body.token);
                    // Decode basic info
                    const payload = decodeJwtPayload(body.token);
                    const role = payload?.role || "Student";
                    const profile = {
                      name: body.email?.split('@')[0] || "User",
                      email: body.email || "",
                      photo: "",
                      provider: "facebook",
                      role: role
                    };
                    localStorage.setItem("user", JSON.stringify(profile));
                  }
                  toast.success("Login successful!");
                  router.push("/dashboard");
                }
              } else {
                toast.error(body.message || "Facebook login failed");
              }
            })
            .catch(err => {
              console.error(err);
              toast.error("Connection error");
            })
            .finally(() => setIsLoading(false));
        } else {
          console.log('User cancelled login or did not fully authorize.');
          setIsLoading(false);
        }
      }, { scope: 'public_profile,email' });

      return;
    }

    try {
      let endpoint = ""
      let body = {}

      // TikTok specific flow
      if (provider === "tiktok") {
        const csrfState = Math.random().toString(36).substring(7);
        const codeVerifier = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

        // Use the helpers we added
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        localStorage.setItem('tiktok_csrfState', csrfState);
        localStorage.setItem('tiktok_codeVerifier', codeVerifier);

        let url = 'https://www.tiktok.com/v2/auth/authorize/';
        url += `?client_key=${TIKTOK_CLIENT_KEY}`;
        url += '&scope=user.info.basic';
        url += '&response_type=code';
        url += `&redirect_uri=${encodeURIComponent(window.location.origin + '/login')}`;
        url += '&state=' + csrfState;
        url += '&code_challenge=' + codeChallenge;
        url += '&code_challenge_method=S256';

        window.location.href = url;
        return;
      }

      if (provider === "apple") {
        endpoint = "/auth/apple-login"
        body = { identityToken: "mock_apple_token" }
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        if (data.requiresOtp) {
          setSocialEmail(data.email)
          setGoogleIdToken(null) // Clear google token to ensure we use generic verify
          setShowOTPModal(true)
          toast.info(`Authentication code sent to ${data.email}`)
        }
      } else {
        toast.error(data.message || `${provider} login failed`)
      }
    } catch (err) {
      console.error(err)
      toast.error("Connection error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenericOtpVerify = async (code: string) => {
    // If we have googleToken, use google verify
    if (googleIdToken) {
      return handleGoogleOtpVerify(code)
    }

    if (!socialEmail) {
      toast.error("Session expired. Please login again.")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: socialEmail, otp: code })
      })

      const data = await res.json()

      if (res.ok && data.token) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("token", data.token as string)

          const payload = decodeJwtPayload(data.token as string)
          const role = payload?.role || "Student" // Default to Student for social

          // Mock profile since we don't have real token details
          const profile = {
            name: socialEmail.split('@')[0],
            email: socialEmail,
            photo: "",
            provider: "social",
            role: role
          }
          window.localStorage.setItem("user", JSON.stringify(profile))
        }
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error(data.message || "Invalid OTP")
      }
    } catch (err) {
      toast.error("Verification failed")
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
            {/* HTTPS Warning */}
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
              <div className="space-y-3">
                <SocialLoginButtons
                  onLogin={handleSocialLogin}
                  onGoogleClick={() => {
                    const google = (window as any).google
                    if (google?.accounts?.id) {
                      const buttonContainer = document.getElementById("google-signin-button")
                      const googleButton = buttonContainer?.querySelector('[role="button"]') as HTMLElement
                      if (googleButton) {
                        googleButton.click()
                      }
                    }
                  }}
                />
              </div>

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
        onVerify={handleGenericOtpVerify}
        onResend={handleGoogleOtpResend}
      />

      <ForgotPasswordModal open={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </div>
  )
}
