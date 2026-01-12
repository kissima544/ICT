module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/ictvisitorsfrontendsystem Frontend/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ictvisitorsfrontendsystem Frontend/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ictvisitorsfrontendsystem Frontend/node_modules/@google/generative-ai/dist/index.mjs [app-route] (ecmascript)");
;
;
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
`;
async function POST(req) {
    try {
        const body = await req.json();
        const { messages } = body;
        // Get the last user message
        const lastMessage = messages[messages.length - 1].content;
        if (!process.env.GEMINI_API_KEY) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                role: "assistant",
                content: "I'm currently running in 'Offline Mode' because my AI brain (Gemini API Key) isn't connected yet! ✨ Please add a GEMINI_API_KEY to the system settings."
            }, {
                status: 200
            });
        }
        const genAI = new __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](process.env.GEMINI_API_KEY);
        // Use gemini-2.5-flash which is available in the free tier
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });
        // Provide context via system instruction equivalent (or prepended context)
        const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${lastMessage}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            role: "assistant",
            content: text
        });
    } catch (error) {
        console.error("Gemini Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$ictvisitorsfrontendsystem__Frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            role: "assistant",
            content: `I encountered an error: ${error?.message || 'Unknown error'}. Please check your API key or try again later. 😓`
        }, {
            status: 200
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__93af77b1._.js.map