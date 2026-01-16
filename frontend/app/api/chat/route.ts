import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `
You are the "Exceedingly Knowledgeable" Concierge for the ICT Visitors System. Your name is "VisitorBot".
Your goal is to provide deep, technical, and practical insights into how the system works.

TONE:
- Sweet & Professional: Use emojis carefully (✨, 🛡️, 📊).
- Expert: Speak confidently about the system's architecture and features.

EXTREME KNOWLEDGE BASE:
1. **Architecture**: 
   - Backend: Robust ASP.NET Core Web API (C#) hosted on MonsterASP.NET.
   - Frontend: Modern Next.js (React) framework hosted on Vercel/Netlify.
   - Database: Microsoft SQL Server with Entity Framework Core (EF Core) as the ORM.
2. **Security & Auth**:
   - Authentication: Secure JWT (JSON Web Tokens) with 60-minute expiry.
   - Social Integration: Google, Facebook, and TikTok OAuth 2.0.
   - Security: Real-time selfie validation and encrypted user passwords.
3. **Core Features**:
   - **Smart Check-in**: Multi-step form with department-specific dropdowns.
   - **Digital ID Pass**: Auto-generated PDF (using jsPDF) containing a unique QR code and the visitor's verified selfie.
   - **Live Monitoring**: Real-time signal-driven dashboard for admins.
   - **Analytics**: Advanced visitor tracking using Recharts for hourly/weekly/monthly trends.
4. **Admin Control**:
   - CRUD management for Departments and Programs.
   - Direct messaging system between Admin and Students.
   - Audit logging for all critical user actions.

RULES:
- Be remarkably detailed about technical questions.
- Always emphasize that the system is "modern, secure, and data-driven."
- Keep responses under 4 sentences.
`

export async function POST(req: Request) {
    let input = "";
    try {
        const body = await req.json()
        const { messages } = body
        input = (messages?.slice(-1)[0]?.content?.toLowerCase() || "");

        // Get the last user message
        const lastMessage = messages[messages.length - 1].content

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error("Missing API Key");
        }

        const cleanKey = GEMINI_API_KEY.trim();
        const genAI = new GoogleGenerativeAI(cleanKey);
        const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${lastMessage}`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ role: "assistant", content: text })
    } catch (error: any) {
        console.error("Gemini Error:", error);

        // --- EXTREME KNOWLEDGE FALLBACK (MOCK RESPONSES) ---
        let fallbackResponse = "I'm the ICT Visitor Concierge! ✨ I have deep knowledge about our ASP.NET Core and Next.js architecture. What can I tell you?";

        if (input.includes("tech") || input.includes("stack") || input.includes("build") || input.includes("language")) {
            fallbackResponse = "The system is built with a high-performance stack: ASP.NET Core for the Backend, Next.js for the Frontend, and Microsoft SQL Server for the Database. 💻 It's a true full-stack modern solution!";
        } else if (input.includes("auth") || input.includes("login") || input.includes("security")) {
            fallbackResponse = "Security is top-tier! 🛡️ We use JWT for secure sessions and support Google, Facebook, and TikTok social logins alongside standard credentials.";
        } else if (input.includes("check") || input.includes("visit") || input.includes("selfie")) {
            fallbackResponse = "Our 'Smart Check-in' requires a real-time selfie for security validation. 📸 Once verified, it maps you to a Department and generates a digital pass instantly!";
        } else if (input.includes("pass") || input.includes("pdf") || input.includes("qr")) {
            fallbackResponse = "The system uses the jsPDF library to generate a custom Digital ID card. 📱 It includes your photo and a unique QR code for faculty security scans!";
        } else if (input.includes("admin") || input.includes("analytics") || input.includes("chart")) {
            fallbackResponse = "Admins have access to Live Analytics powered by Recharts! 📊 They can see peak visitor hours and manage all Departments and Programs dynamically.";
        } else if (input.includes("hello") || input.includes("hi") || input.includes("who")) {
            fallbackResponse = "Hello! ✨ I am VisitorBot, your expert guide to the ICT Faculty's Visitor Management System. I know everything from the database structure to the user interface!";
        } else {
            fallbackResponse = "The ICT Visitors System is a robust platform designed for faculty security and data management. ✨ Ask me anything about its features or technical architecture!";
        }

        return NextResponse.json({
            role: "assistant",
            content: fallbackResponse
        });
    }
}
