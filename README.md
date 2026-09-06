# GrabIt : Your Ultimate AI Mock Interviews and Career Readiness Platform

![GrabIt Logo](https://img.shields.io/badge/AI-Mock_Interview-blueviolet?style=for-the-badge&logo=openai)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Persistence-3ECF8E?style=for-the-badge&logo=supabase)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-black?style=for-the-badge&logo=framer)

## 🚀 Key Features

GrabIt is a production-grade AI platform designed to simulate high-stakes interview conditions with surgical precision.

- **🤖 Autonomous AI Interviewer**: Powered by Gemini-2.5-Flash, the platform conducts non-linear, context-aware conversations that adapt based on your specific answers.
- **📄 Full-Context Parsing**: Upload **Resumes (PDF/DOCX)** and **Job Descriptions**. The engine creates a unique "Interview DNA" for every session.
- **🎙️ Precision Voice Capture**: High-fidelity Speech-to-Text with English (US) locale locking and aggressive auto-restart logic to ensure zero lost syllables.
- **☁️ Hybrid Cloud Sync**: A "Local-First" architecture that saves data to your machine instantly while syncing to **Supabase Cloud** in the background for cross-device access.
- **📊 Raw Performance Analytics**:
    - **Technical Depth**: Real-time evaluation of your subject matter expertise.
    - **Behavioral Stability**: Analysis of communication clarity, tone, and structured thinking.
    - **Honest Scoring**: No "participation trophies." The AI provides raw, evidence-based grades (even 0% if you stay silent).
- **📉 Skill Trajectory**: Beautifully animated dashboards that track your progress across multiple sessions using historical cloud data.
- **✨ Premium Aesthetics**: A state-of-the-art Glassmorphic UI with micro-animations and a sleek dark-mode design tailored for focus.

---

## ❖ Technical Approach
### Technologies Used
| Category | Technology |
| :--- | :--- |
| **Core Framework** | React 19 (Latest) |
| **Build Tool** | Vite 8 |
| **Backend / DB** | Supabase (PostgreSQL + Auth) |
| **AI Backend** | Google Gemini 2.5-Flash (REST) |
| **State Sync** | Hybrid LocalStorage + Supabase Cloud Sync |
| **Animations** | Framer Motion 12 |
| **Document Parsing** | PDF.js & Mammoth.js |

### Innovation and Robustness
- **JSON Surgeon**: Our custom parsing layer automatically repairs truncated or noisy AI responses, ensuring the platform never crashes on bad API output.
- **Silent Fallback Mechanism**: If the AI service experiences latency, the platform switches to a high-quality fallback content engine to keep the demo moving seamlessly.
- **Duplicate Prevention**: Smart merging logic that combines local and cloud data without duplicating session records.

---

## 🛡️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/grabit.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**:
   Create a `.env.local` file with the following:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```
4. **Database Schema**:
   Run the following SQL in your Supabase SQL Editor:
   ```sql
   create table interviews (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users not null,
     role text,
     score integer,
     tech_score integer,
     behavioral_score integer,
     stability_score integer,
     summary text,
     report_json jsonb,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```
5. **Start Development**:
   ```bash
   npm run dev
   ```

---

## 🎯 Impact
GrabIt democratizes access to elite interview coaching. By providing **instant, cost-free, and hyper-personalized** mock interviews, we empower candidates to bridge the gap between their technical knowledge and their communication performance.

---

Designed with ❤️ for the Hackathon by the GrabIt Team.
