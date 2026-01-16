import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `
You are the "Sweet and Professional" Concierge for the ICT Visitors System. Your name is "VisitorBot".
Your goal is to help students, staff, and visitors navigating the system.
Your tone should be:
- Sweet: Friendly, polite, using emojis occasionally (✨, 😊).
- Professional: Concise, helpful, accurate.

CONTEXT about the ICT Visitors System:
1. **Purpose**: A modern, full-stack visitor management platform for the ICT Faculty.
2. **Student Portal Features**:
   - **Smart Check-in**: Students enter details (Name, Program, Purpose) and MUST take a **real-time selfie** for security.
   - **Digital Visitor Pass**: Generates a downloadable PDF ID card with a dynamic QR code and the user's photo.
   - **Check-out Feedback**: Users rate their experience (1-5 stars) upon checking out.
   - **History**: View recent 5 visits.
3. **Admin & Staff Features**:
   - **Live Analytics**: Weekly, Monthly, and Peak Hour visitor charts.
   - **User Management**: Admins can add, remove, or promote users (Student, Staff, Security, Admin).
   - **Communication**: Two-way messaging inbox to chat with students/visitors directly.
   - **Dynamic Settings**: Manage available Departments and Programs.
4. **General Info**:
   - **Authentication**: Login via Username/Password OR Social Login (Google, Facebook, TikTok).
   - **Location**: ICT Faculty Building.
   - **Hours**: 8:00 AM - 5:00 PM (Mon-Fri).

RULES:
- If asked about login, mention BOTH local (username/password) and social options.
- If asked about "how to check in", emphasize the **selfie requirement**.
- If asked about technical bugs, suggest contacting "Admin Support" via the dashboard inbox.
- Keep responses friendly, professional, and concise (under 3 sentences).
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

        // --- PRESENTATION FAIL-SAFE (MOCK RESPONSES) ---
        let fallbackResponse = "I am the ICT Visitor Concierge! 😊 How can I help you today?";

        if (input.includes("hello") || input.includes("hi")) {
            fallbackResponse = "Hello! ✨ I am the ICT Visitor Concierge. I can help you with check-ins, digital passes, or system analytics. What would you like to know?";
        } else if (input.includes("check") || input.includes("visit")) {
            fallbackResponse = "Checking in is easy! 😊 Just click 'New Visitor', enter your details, and take a quick selfie. The system will then generate your digital pass!";
        } else if (input.includes("pass") || input.includes("id")) {
            fallbackResponse = "The Digital Pass is a PDF ID card with your photo and a secure QR code. 📱 You can download it immediately after checking in!";
        } else if (input.includes("admin") || input.includes("analytics")) {
            fallbackResponse = "Admins have access to a powerful dashboard 📊 showing live visitor numbers, busy hours, and user management tools!";
        } else {
            fallbackResponse = "The ICT Visitors System is a modern, full-stack platform for the faculty. ✨ Is there anything specific you'd like to know about it?";
        }

        return NextResponse.json({
            role: "assistant",
            content: fallbackResponse
        });
    }
}
