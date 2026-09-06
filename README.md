# GrabIt — AI Mock Interviews & Career Growth Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_AI-FF6F00?style=for-the-badge&logo=google)](https://mediapipe.dev/)

**GrabIt** is an advanced, production-grade AI platform built to simulate hyper-realistic technical and behavioral interviews. Powered by **Google Gemini 2.5 Flash**, **MediaPipe Computer Vision**, **Web Speech API**, and **Supabase Cloud**, GrabIt delivers real-time body language tracking, voice interaction, performance analytics, and personalized career roadmaps.

---

## 🌟 Key Features

- **🤖 Interactive AI Interviewer**: Context-aware live interview simulation with non-linear follow-up questions tailored to your target role.
- **👁️ Computer Vision & Body Language Analysis**: Real-time facial landmark and posture tracking powered by MediaPipe to measure eye contact, stability, and confidence.
- **🎙️ Natural Voice AI (TTS & STT)**:
  - High-clarity speech synthesis utilizing natural AI voices.
  - Continuous speech-to-text with auto-restart, pause detection, and feedback loop prevention.
- **📊 Comprehensive Performance Reports**:
  - Breakdown across Technical Accuracy, Behavioral Index, Voice Stability, and Body Language.
  - Detailed AI feedback highlights: *Areas Where You Excelled*, *Areas for Improvement*, and *Actionable Next Steps*.
  - Neural network verdict model predicting candidate hiring readiness.
- **🤖 Multi-Expert AI Assistant**: Specialized chat personas including **Career Mentor**, **Tech Tutor**, and **Mock Interviewer** with cloud-synced session history.
- **🗺️ Tech & Growth Roadmaps**: Dynamic 30-Day Professional Evolution plans and technology skill trees.
- **📄 Resume & JD Parsing**: Upload PDF or DOCX files to automatically extract job context and tailor interview questions.
- **⚡ Local-First & Hybrid Cloud Persistence**: Instant LocalStorage data retention merged with Supabase cloud database sync so your data is never lost.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Framer Motion 12, Lucide React
- **AI Models**: Google Gemini 2.5-Flash REST API, MediaPipe Tasks Vision (FaceLandmarker)
- **Backend & Database**: Supabase (PostgreSQL, Storage Buckets, Auth)
- **Speech Technologies**: Web Speech API (`SpeechSynthesis`, `SpeechRecognition`)
- **Document Processing**: PDF.js, Mammoth.js

---

## 📋 Prerequisites

Before running the project locally, ensure you have installed:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Browser**: Google Chrome or Microsoft Edge (recommended for Web Speech API and MediaPipe camera support)

---

## 🚀 Quick Start & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/naitikdubey-io/GrabIt.git
cd GrabIt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini AI Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Note**: You can obtain a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### 4. Supabase Database Setup (Optional for Cloud Sync)

If you wish to enable cloud synchronization, execute the following SQL scripts in your [Supabase SQL Editor](https://supabase.com/dashboard):

```sql
-- Create Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  score INTEGER,
  tech_score INTEGER,
  behavioral_score INTEGER,
  stability_score INTEGER,
  body_language_score INTEGER,
  summary TEXT,
  report_json JSONB,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Chatbot Sessions Table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Roadmaps Table
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  roadmap_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 📦 Build for Production

To compile the application for production:

```bash
npm run build
```

To preview the built app locally:

```bash
npm run preview
```

---

## 📁 Folder Structure

```
GrabIt/
├── public/                 # Static assets & web workers
├── src/
│   ├── assets/             # Images and SVG icons
│   ├── components/         # React application components
│   │   ├── AIChatbot.jsx            # Multi-persona AI Chatbot
│   │   ├── Auth.jsx                 # Authentication modal/view
│   │   ├── Dashboard.jsx            # Performance overview & analytics
│   │   ├── History.jsx              # Performance Archive & Video Player
│   │   ├── ImprovementRoadmap.jsx   # 30-Day Growth Plan generator
│   │   ├── InterviewPractice.jsx    # Live AI Simulation with Camera & Voice
│   │   ├── LandingPage.jsx          # Landing marketing page
│   │   ├── Opportunities.jsx        # Job matching feed
│   │   ├── PracticeQuestions.jsx    # Practice question library
│   │   ├── Sidebar.jsx              # Application navigation bar
│   │   ├── SingleQuestionPractice.jsx# Targeted question drill
│   │   └── TechRoadmaps.jsx         # Interactive technology learning maps
│   ├── context/
│   │   └── AuthContext.jsx          # Supabase & Demo Auth Provider
│   ├── utils/
│   │   ├── api.js                   # Hybrid LocalStorage + Supabase API
│   │   ├── gemini.js                # Gemini REST client & JSON surgeon
│   │   ├── hiringModel.js           # Custom Neural Network model
│   │   ├── speech.js                # High-fidelity TTS & STT speech engine
│   │   └── supabaseClient.js        # Supabase client initialization
│   ├── App.jsx                      # Main app router component
│   └── main.jsx                     # React entry point
├── .env.local               # Local environment configuration (git-ignored)
├── .gitignore               # Git ignored paths
├── package.json             # Node dependencies & scripts
└── README.md                # Documentation
```

---

## 🛡️ License & Acknowledgments

- **License**: MIT License
- **Built for**: Hackathon & AI Career Readiness

---

Developed with ❤️ by the **GrabIt Team**.
