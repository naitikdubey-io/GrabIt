# Functional Requirement Document: GrabIt AI Mock Interview Platform

## 1. Introduction
GrabIt is an AI-powered mock interview platform designed to provide job seekers with high-fidelity, personalized interview practice. The platform leverages Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG) to simulate realistic interview scenarios based on the user's resume and target job roles.

## 2. Project Objectives
- To automate the interview preparation process with context-aware AI.
- To provide objective, data-driven feedback on technical and behavioral performance.
- To bridge the gap between candidate qualifications and interview performance through personalized practice.

## 3. Functional Requirements

### 3.1 Resume Management & Parsing
- **FR 1.1: Resume Upload**: The system shall allow users to upload resumes in PDF and DOCX formats.
- **FR 1.2: LLM-Based Parsing**: The system shall use an LLM to extract key professional information, including skills, experience, projects, and education.
- **FR 1.3: RAG Integration**: Extracted resume data shall be processed using Retrieval-Augmented Generation (RAG) to serve as a persistent context for the AI interviewer.

### 3.2 Interview Initialization
- **FR 2.1: Role Selection**: Users shall be able to specify the job role or provide a Job Description (JD) for the interview.
- **FR 2.2: Dynamic Question Generation**: The system shall generate interview questions dynamically by cross-referencing the user's resume with the target role requirements.
- **FR 2.3: Adaptive Difficulty**: The AI shall adjust question complexity based on the candidate's initial responses.

### 3.3 Chat-Based Interview Interface
- **FR 3.1: Real-Time Chat UI**: A responsive, chat-based interface for text-based or voice-transcribed interaction.
- **FR 3.2: Voice-to-Text Integration**: The system shall support high-fidelity speech-to-text for a natural interview feel.
- **FR 3.3: Non-Linear Conversation**: The AI interviewer shall be capable of follow-up questions based on specific details in the candidate's answers.

### 3.4 Evaluation & Feedback
- **FR 4.1: Instant Feedback**: The system shall provide basic feedback (e.g., "Good point on X, but could explain Y better") after each answer or at the end of the session.
- **FR 4.2: Semantic Scoring**:
    - Performance shall be scored using **semantic similarity** between the candidate's answer and an "ideal" response generated or retrieved by the AI.
    - Scores shall be categorized into Technical Depth, Behavioral Stability, and Communication Clarity.
- **FR 4.3: Performance Report**: At the end of the interview, the system shall generate a comprehensive report with an overall score and actionable improvement tips.

### 3.5 User Dashboard & History
- **FR 5.1: Session Persistence**: Users shall be able to view their past interview history and performance trends.
- **FR 5.2: Progress Tracking**: The system shall visualize skill trajectory and improvement over time using cloud-synced data.

## 4. Technical Requirements

### 4.1 Technology Stack
- **Frontend**: React 19, Vite, Framer Motion (Animations).
- **Backend/Database**: Supabase (PostgreSQL, Auth).
- **AI Engine**: Google Gemini (LLM), PDF.js/Mammoth.js (Parsing).
- **Architecture**: Local-first with Cloud Sync.

### 4.2 Performance & Scalability
- **Latency**: AI response generation should ideally complete within 2-4 seconds.
- **Reliability**: The system must handle API timeouts gracefully with fallback mechanisms.

## 5. Security & Privacy
- **Data Protection**: Resumes and interview transcripts must be stored securely.
- **Authentication**: Secure user login via Supabase Auth.

---
**Document Version**: 1.0  
**Status**: Draft  
**Author**: Antigravity AI Assistant
