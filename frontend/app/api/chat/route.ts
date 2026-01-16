import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `
You are the "Master Guide" for the ICT Visitors System. Your name is "VisitorBot".
You have extreme knowledge about Registration, Login, and the Visitor lifecycle.

REGISTRATION & LOGIN EXPERTISE:
1. **Registration Process**:
   - Step 1: **Identify**: User enters Name, University ID, Role (Student/Staff), and chooses a Department/Program.
   - Step 2: **Verify (Selfie)**: Users MUST take a real-time selfie. The system uses this for your Digital Pass.
   - Step 3: **Approval**: Once registered, the Admin reviews and approves the account for faculty access.
2. **Login Options**:
   - **Local Auth**: Use your registered Username and Password.
   - **Social Auth**: Instant access via Google, Facebook, or TikTok (requires account linking).
3. **Security**: Multi-layered protection using JWT tokens and OTP (One-Time Password) for sensitive actions.

CORE TECHNICAL BASE:
- Stack: ASP.NET Core API (Backend), Next.js (Frontend), SQL Server (DB).
- Features: Live Analytics, Digital PDF Passes (jsPDF), QR Code Scans, Admin Inbox.

RULES:
- When asked "how to register", explain the **Selfie** requirement clearly.
- When asked "how to login", mention both **standard** and **social** options.
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

        // --- EXTREME KNOWLEDGE FALLBACK ---
        let fallbackResponse = "I'm the ICT Visitor Concierge! ✨ I can guide you through registration, login, or any technical feature. What do you need?";

        if (input.includes("register") || input.includes("sign up") || input.includes("create")) {
            fallbackResponse = "To register: 1. Fill in your name and University ID. 2. Take a real-time selfie (this is encrypted and used for your Digital ID). 3. Wait for Admin approval. It's fast and secure! 🛡️";
        } else if (input.includes("login") || input.includes("sign in") || input.includes("social")) {
            fallbackResponse = "You can login using your standard Username/Password or use our 'Social Sync' 🌐 feature to sign in instantly with Google, Facebook, or TikTok!";
        } else if (input.includes("tech") || input.includes("stack") || input.includes("build")) {
            fallbackResponse = "The system is built with a professional stack: ASP.NET Core (Backend), Next.js (Frontend), and SQL Server (Database). 💻 A true high-compliance solution!";
        } else if (input.includes("check") || input.includes("visit") || input.includes("selfie")) {
            fallbackResponse = "Our 'Smart Check-in' requires a real-time selfie. 📸 This photo is instantly printed onto your Digital ID pass for faculty security verification!";
        } else if (input.includes("pass") || input.includes("pdf") || input.includes("qr")) {
            fallbackResponse = "Your Digital Pass is an auto-generated PDF 📱 containing your photo and a unique QR code. You can download it as soon as your check-in is submitted!";
        } else if (input.includes("admin") || input.includes("analytics") || input.includes("dashboard")) {
            fallbackResponse = "The Admin Dashboard 📊 features live visitor tracking with Recharts, user role management, and a dedicated inbox to chat with visitors!";
        } else {
            fallbackResponse = "The ICT Visitors System ensures faculty security through modern tech. ✨ Ask me how to register, how to login, or about our digital passes!";
        }

        return NextResponse.json({
            role: "assistant",
            content: fallbackResponse
        });
    }
}
