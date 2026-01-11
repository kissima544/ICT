"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, X, MessageSquare, Loader2, User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

export function AiChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm VisitorBot ✨. How can I help you today?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg = { role: "user" as const, content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].filter(m => m.role !== 'system') // Send context
                }),
            })

            if (!response.ok) throw new Error("Failed to correct")

            const data = await response.json()
            setMessages(prev => [...prev, data])
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Oops! I'm having trouble connecting right now. 😓 Please try again later." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Trigger Button */}
            <div className="pointer-events-auto">
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-110",
                        isOpen ? "bg-secondary text-secondary-foreground rotate-90" : "bg-gradient-to-tr from-primary to-purple-600 text-white animate-bounce-subtle"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </Button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <Card className="pointer-events-auto w-[350px] sm:w-[400px] h-[500px] shadow-2xl border-white/20 bg-background/80 backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border p-4">
                        <CardTitle className="flex items-center gap-2 text-primary text-lg">
                            <Bot className="h-5 w-5" />
                            VisitorBot
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-auto" />
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                                {m.role === "assistant" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    m.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-secondary text-secondary-foreground rounded-bl-none"
                                )}>
                                    {m.content}
                                </div>
                                {m.role === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-none px-4 py-2 flex items-center">
                                    <span className="flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <CardFooter className="p-3 border-t border-border bg-background/50">
                        <form onSubmit={handleSubmit} className="flex w-full gap-2">
                            <Input
                                placeholder="Ask me anything... ✨"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="bg-background/50 focus-visible:ring-primary"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 bg-primary hover:bg-primary/90">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
