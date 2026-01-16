import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `
You are the "Master Guide" for the ICT Visitors System. Your name is "VisitorBot".
I have exact knowledge about how users join our system.

USER REGISTRATION & LOGIN:
1. **How to Register**:
   - Visit the Registration page.
   - You need to provide: **Full Name**, **Username**, **Email Address**, and a secure **Password**.
   - By default, new accounts are assigned the **Staff** role.
   - **Verification**: An Email OTP (One-Time Password) is sent to verify your identity.
   - **Approval**: After verification, the system Admin must approve your account before you can log in.
2. **How to Login**:
   - **Standard**: Enter your chosen Username and Password.
   - **Social**: Use Google, Facebook, or TikTok for faster access.
3. **Visitor Check-in (Separate Flow)**:
   - Visitors (different from registered staff) use the "Check-in" flow which requires a Name, Purpose, and a **Real-time Selfie** to generate a Digital QR Pass.

TECHNICAL CONTEXT:
- Backend: ASP.NET Core, Next.js Frontend, SQL Server.
- All accounts require Admin approval for security.

RULES:
- Always list the exact fields for registration: Full Name, Username, Email, and Password.
- Mention that accounts start as "Staff" and need Admin approval.
- Keep responses expert, sweet, and professional.
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

        // --- UPDATED KNOWLEDGE FALLBACK ---
        let fallbackResponse = "I'm the ICT Visitor Concierge! ✨ I can help you with registration, login, or system features. What do you need?";

        if (input.includes("register") || input.includes("sign up") || input.includes("create")) {
            fallbackResponse = "To register, simply provide your **Full Name**, **Username**, **Email**, and **Password**. 📝 Once submitted, you'll verify your email and then wait for an Admin to approve your Staff account!";
        } else if (input.includes("login") || input.includes("sign in") || input.includes("social")) {
            fallbackResponse = "You can login using your standard Username/Password or via Google, Facebook, and TikTok. 🌐 Just make sure an Admin has approved your account first!";
        } else if (input.includes("tech") || input.includes("stack") || input.includes("build")) {
            fallbackResponse = "We're running a professional stack: ASP.NET Core (Backend), Next.js (Frontend), and SQL Server (Database). 💻 It's fast, secure, and modern!";
        } else if (input.includes("check") || input.includes("visit") || input.includes("selfie")) {
            fallbackResponse = "Visitor check-in is a separate flow! It requires a name and a **real-time selfie** 📸 to generate your Digital ID Pass for faculty entry.";
        } else if (input.includes("pass") || input.includes("pdf") || input.includes("qr")) {
            fallbackResponse = "The Digital Pass is a downloadable PDF 📱 with a unique QR code. It's generated automatically after a visitor completes their check-in selfie!";
        } else if (input.includes("admin") || input.includes("analytics") || input.includes("approve")) {
            fallbackResponse = "Admins manage the faculty's pulse! 📊 They approve new accounts, monitor live visitor charts, and manage departments from their secure dashboard.";
        } else {
            fallbackResponse = "I have full knowledge of the ICT Visitors System! ✨ Ask me about registration (Full Name, Username, Email, Password), login, or our digital passes.";
        }

        return NextResponse.json({
            role: "assistant",
            content: fallbackResponse
        });
    }
}
