# AlgorithmX 🤖

**AlgorithmX is an intelligent, conversational AI agent for managing your Facebook Page content.** 

It leverages the power of Google's Gemini model to understand natural language commands, allowing you to create, schedule, edit, and manage your social media presence through a simple and intuitive chat interface.

![AlgorithmX Screenshot](https://storage.googleapis.com/aistudio-project-images/3421a49a-b44c-4734-9286-a36c61f2249c)

---

## ✨ Key Features

-   **Conversational Interface**: Manage your posts by simply talking to the AI. No complex forms, just plain English.
-   **Full Post Management**: Create, edit, and delete posts on the fly.
-   **Advanced Scheduling & Backdating**: Schedule posts for the future or backdate them to organize your timeline.
-   **AI-Powered Safety Guardrails**: The AI is instructed to act as a responsible social media manager, helping you create high-quality, human-like content that avoids spam triggers.
-   **Image & Media Attachments**: Easily attach images to your commands to create visually engaging posts.
-   **Secure Authentication**: User accounts are secured with Google Sign-In.
-   **Live Previews**: See a real-time view of your scheduled and published posts directly in the dashboard.
-   **Multi-Provider Ready**: Includes a settings panel to manage API keys for other optional AI services.

## 🚀 How It Works

AlgorithmX streamlines content management into a simple conversational flow:

1.  **You Command**: Type a command like, `"Schedule a post for tomorrow at 5pm with the caption 'New product launch!' and add this image."`
2.  **AI Interprets**: The Gemini model processes your command, extracts the key details (intent, caption, schedule time), and structures it for the application.
3.  **UI Reacts**: The application receives the structured data and opens a pre-filled modal for you to review and confirm.
4.  **Content Managed**: Your post is created, scheduled, or edited in the live-preview dashboard.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI & NLU**: Google Gemini API (`gemini-2.5-flash`)
-   **Authentication**: Google Identity Services
-   **State Management**: React Hooks & Context API
-   **Build**: Vite (as an underlying modern build tool)

## 📦 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm (or your favorite package manager)
-   A Google Gemini API Key
-   A Google Cloud Project with an OAuth 2.0 Client ID for a Web Application.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/YOUR_USERNAME/AlgorithmX.git
    cd AlgorithmX
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your API key and Client ID. Use the `.env.example` file as a template.

    ```env
    # Google Gemini API Key
    VITE_API_KEY="YOUR_GEMINI_API_KEY"

    # Google Cloud OAuth 2.0 Client ID
    VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    ```

4.  **Run the application:**
    ```sh
    npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) (or the port specified by Vite) to view it in the browser.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YOUR_USERNAME/AlgorithmX/issues).

## 📄 License

This project is open-source and available under the MIT License.