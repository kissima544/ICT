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
    try {
        const body = await req.json()
        const { messages } = body

        // Get the last user message
        const lastMessage = messages[messages.length - 1].content

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    role: "assistant",
                    content: "I'm currently running in 'Offline Mode' because my AI brain isn't connected to Netlify yet! ✨ Please add a GEMINI_API_KEY to your Netlify Environment Variables."
                },
                { status: 200 }
            )
        }

        const cleanKey = GEMINI_API_KEY.trim();
        const genAI = new GoogleGenerativeAI(cleanKey);
        const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${lastMessage}`;

        // FINAL PRESENTATION FALLBACK: High-compatibility model strings for v1beta
        const attempts = [
            { name: "gemini-1.5-flash", version: "v1beta" },
            { name: "gemini-1.5-flash-latest", version: "v1beta" },
            { name: "gemini-1.5-pro", version: "v1beta" },
            { name: "gemini-pro", version: "v1beta" }
        ];

        let text = "";
        let lastError: any = null;

        for (const attempt of attempts) {
            try {
                const model = genAI.getGenerativeModel({ model: attempt.name }, { apiVersion: attempt.version as any });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                if (text) break;
            } catch (err: any) {
                console.warn(`Attempt ${attempt.name} failed:`, err.message);
                lastError = err;
            }
        }

        if (!text && lastError) {
            throw lastError;
        }

        return NextResponse.json({ role: "assistant", content: text })
    } catch (error: any) {
        const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
        const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "not-found";

        console.error("Gemini Error:", error)
        return NextResponse.json(
            {
                role: "assistant",
                content: `Error: ${error?.message || 'Unknown error'}. [Final-Diagnostic]. Key=${maskedKey}. IMPORTANT: Search for "Generative Language API" (NOT Gemini API) in Google Cloud and click ENABLE. 😓`
            },
            { status: 200 }
        )
    }
}
