import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Shield, BarChart3, Clock, ArrowRight, CheckCircle2, Zap, LayoutDashboard, Lock } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-full border border-white/20 bg-background/60 backdrop-blur-xl shadow-lg shadow-primary/5 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-lg shadow-primary/20">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ICT Visitors</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How it works</NavLink>
            <NavLink href="#pricing">Benefits</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/10 hover:text-primary rounded-full px-4">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New: Two-Way Messaging Live
          </div>

          <h1 className="max-w-4xl mx-auto text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1] animate-fade-in-up animation-delay-150">
            Visitor Management, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">Reimagined.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed animate-fade-in-up animation-delay-300">
            A sweet, professional, and secure way to manage visitors for your ICT department.
            Streamline check-ins and boost security effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up animation-delay-450">
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-2 hover:bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                Learn more
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview Overlay */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/20 bg-white/5 p-2 backdrop-blur-sm shadow-2xl animate-fade-in-up animation-delay-600 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-purple-600 opacity-20 blur transition duration-1000 group-hover:opacity-40"></div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto h-6 w-2/3 max-w-[400px] rounded-md bg-background/50 text-[10px] flex items-center justify-center text-muted-foreground font-mono">
                  ict-visitors.app/dashboard
                </div>
              </div>
              <img
                src="/modern-dark-dashboard-with-visitor-statistics-char.jpg"
                alt="Dashboard Preview"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-secondary/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatItem value="15k+" label="Check-ins" icon={CheckCircle2} />
            <StatItem value="99.9%" label="Uptime" icon={Zap} />
            <StatItem value="500+" label="Active Users" icon={Users} />
            <StatItem value="24/7" label="Secure" icon={Lock} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-3">Powerful Features</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Built for modern teams</h3>
            <p className="text-xl text-muted-foreground">Everything you need to manage your visitors efficiently, packaged in a beautiful interface.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlassCard
              icon={<LayoutDashboard className="h-6 w-6 text-indigo-500" />}
              title="Smart Dashboard"
              description="Real-time analytics and visitor tracking at a glance. Get insights instantly."
            />
            <GlassCard
              icon={<Shield className="h-6 w-6 text-emerald-500" />}
              title="Enhanced Security"
              description="Secure check-ins via QR codes and instant notifications for unauthorized access attempts."
            />
            <GlassCard
              icon={<Clock className="h-6 w-6 text-amber-500" />}
              title="Time Tracking"
              description="Automated entry and exit logging. Perfect for auditing and attendance records."
            />
            <GlassCard
              icon={<Users className="h-6 w-6 text-blue-500" />}
              title="Role Management"
              description="Granular permissions for Admins, Receptionists, and Students."
            />
            <GlassCard
              icon={<BarChart3 className="h-6 w-6 text-pink-500" />}
              title="Data Analytics"
              description="Visual charts and downloadable reports to understand visitor traffic patterns."
            />
            <GlassCard
              icon={<Zap className="h-6 w-6 text-purple-500" />}
              title="Instant Alerts"
              description="Notifications via Email and Dashboard when visitors arrive or depart."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-12 lg:p-16 text-center text-white shadow-2xl relative overflow-hidden group">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>

            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Ready to upgrade your system?</h2>
            <p className="text-white/80 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their visitor management experience.
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 rounded-full bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ICT Visitors</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ICT Visitors System. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/50 px-3 py-2 rounded-full">
      {children}
    </Link>
  )
}

function StatItem({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}

function GlassCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 border border-white/5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
