# How to Get Your FREE AI API Key (Google Gemini)

I have switched the system to use **Google Gemini**, which has a generous free tier!

## Steps

1.  **Get a Key**
    *   Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
    *   Click **Create API key**.
    *   Click **Create API key in new project**.

2.  **Copy the Key**
    *   Copy the key string shown in the popup.

3.  **Configure the Project**
    *   Open your project folder `ictvisitorsfrontendsystem Frontend`.
    *   Create (or edit) the file named `.env.local`.
    *   Add this line:
        ```env
        GEMINI_API_KEY=your-copied-key-here
        ```
    *   Save the file.

4.  **Restart**
    *   Stop the running server (Ctrl+C).
    *   Run `npm run dev` again.

Enjoy your free AI Chatbot! ✨
