import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, StopCircle, RefreshCcw, User, MessageSquare, Sparkles, Zap, ArrowRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { callGemini, safeParseJSON } from '../utils/gemini';
import { hiringModel, trainHiringModel } from '../utils/hiringModel';
import { grabitApi } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { speakText, initVoices } from '../utils/speech';

const InterviewPractice = (props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); 
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [detectedRole, setDetectedRole] = useState('General Professional');
  const [analytics, setAnalytics] = useState({ tech: 0, behavioral: 0, stability: 0, bodyLanguage: 0 });
  const [transcript, setTranscript] = useState('');
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [summary, setSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const responseRef = useRef('');
  const analyticsRef = useRef({ tech: 0, behavioral: 0, stability: 0, bodyLanguage: 0 });
  const conversationHistoryRef = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const requestAnimationFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const bodyLanguageScoreRef = useRef(75);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [neuralVerdict, setNeuralVerdict] = useState(null);

  useEffect(() => {
    // Train the Custom Neural Network on mount
    trainHiringModel(2000);
  }, []);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "CPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        console.log("MediaPipe FaceLandmarker initialized");
      } catch (err) {
        console.error("Failed to init MediaPipe:", err);
      }
    };
    initMediaPipe();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = '';

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).toString();
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          extractedText += pageText + '\n';
        }
      } else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        alert("Unsupported file format. Please upload PDF or DOCX.");
        setIsExtracting(false);
        return;
      }

      setJobDescription((prev) => (prev ? prev + '\n\n' + extractedText : extractedText));
      
      // Cloud Sync Document
      if (user) {
        grabitApi.saveDocument(file.name, extractedText)
          .catch(err => console.warn("Cloud document sync failed:", err));
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Failed to parse the file. Ensure it is a valid PDF or DOCX.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sync refs with state for use in callbacks
  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => {
    analyticsRef.current = analytics;
  }, [analytics]);

  useEffect(() => {
    if (step === 2) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
           streamRef.current = stream;
           setIsVideoEnabled(true);
           
           // Start Recording
           try {
             recordedChunksRef.current = [];
             let mimeType = 'video/webm';
             if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
               mimeType = 'video/webm;codecs=vp8,opus';
             } else if (MediaRecorder.isTypeSupported('video/webm')) {
               mimeType = 'video/webm';
             } else if (MediaRecorder.isTypeSupported('video/mp4')) {
               mimeType = 'video/mp4';
             }

             const recorder = new MediaRecorder(stream, { mimeType });
             
             recorder.ondataavailable = (e) => {
               if (e.data && e.data.size > 0) {
                 recordedChunksRef.current.push(e.data);
               }
             };
             recorder.start(500); // 500ms chunks for smooth stream capture
             mediaRecorderRef.current = recorder;
             console.log("MediaRecorder started with type:", mimeType);
           } catch (e) {
             console.warn("MediaRecorder failed:", e);
           }

           // Force assign if ref already exists
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
           }
        })
        .catch((err) => {
           console.warn("Camera failed:", err);
           setIsVideoEnabled(false);
        });
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
      setIsVideoEnabled(false);
    };
  }, [step]);

  // Ensure stream is attached if video element mounts after stream is ready
  useEffect(() => {
    if (step === 2 && isVideoEnabled && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [step, isVideoEnabled]);

  const handleVideoLoad = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      predictWebcam();
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    
    if (!video || !canvas || !faceLandmarker || !isVideoEnabled) {
      requestAnimationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    
    // THROTTLE: Only run detection every 125ms (~8 FPS) to save CPU for STT
    const now = performance.now();
    const elapsed = now - (lastVideoTimeRef.current || 0);
    
    if (elapsed < 125) {
      requestAnimationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    
    lastVideoTimeRef.current = now;
    
    const startTimeMs = performance.now();
    const results = faceLandmarker.detectForVideo(video, startTimeMs);
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      for (const p of landmarks) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      
      const x = minX * canvas.width;
      const y = minY * canvas.height;
      const w = (maxX - minX) * canvas.width;
      const h = (maxY - minY) * canvas.height;
      
      // Draw futuristic tracking corners
      ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
      ctx.lineWidth = 2;
      const cornerSize = Math.min(w, h) * 0.15;
      
      // Top Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerSize);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerSize, y);
      ctx.stroke();
      
      // Top Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerSize, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerSize);
      ctx.stroke();
      
      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(x + w, y + h - cornerSize);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - cornerSize, y + h);
      ctx.stroke();
      
      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(x + cornerSize, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h - cornerSize);
      ctx.stroke();

      if (isRecordingRef.current) {
        let scoreChange = 0.05;
        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const categories = results.faceBlendshapes[0].categories;
          const eyeLookInLeft = categories.find(c => c.categoryName === 'eyeLookInLeft')?.score || 0;
          const eyeLookOutLeft = categories.find(c => c.categoryName === 'eyeLookOutLeft')?.score || 0;
          const eyeLookInRight = categories.find(c => c.categoryName === 'eyeLookInRight')?.score || 0;
          const eyeLookOutRight = categories.find(c => c.categoryName === 'eyeLookOutRight')?.score || 0;
          const eyeLookUp = categories.find(c => c.categoryName === 'eyeLookUp')?.score || 0;
          const eyeLookDown = categories.find(c => c.categoryName === 'eyeLookDown')?.score || 0;

          const lookingAway = (eyeLookInLeft > 0.4 || eyeLookOutLeft > 0.4 || eyeLookInRight > 0.4 || eyeLookOutRight > 0.4 || eyeLookUp > 0.4 || eyeLookDown > 0.4);
          scoreChange = lookingAway ? -0.5 : 0.3;
        }
        bodyLanguageScoreRef.current = Math.min(Math.max(bodyLanguageScoreRef.current + scoreChange, 5), 98);
      }
    } else {
      if (isRecordingRef.current) bodyLanguageScoreRef.current = Math.max(bodyLanguageScoreRef.current - 1.0, 0);
    }
    
    requestAnimationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  // questionLibrary has been replaced by dynamic Gemini generation.

  // Analytics Sync logic remains
  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => {
    analyticsRef.current = analytics;
  }, [analytics]);

  const updateRealTimeAnalytics = (text) => {
    // Simple heuristic-based real-time analysis
    const wordCount = text.split(' ').length;
    const techKeywords = ['react', 'performance', 'optimization', 'hooks', 'state', 'virtual dom', 'system', 'architecture'];
    const behavioralKeywords = ['challenging', 'collaborate', 'team', 'conflict', 'resolved', 'growth', 'feedback'];
    
    const techScore = Math.min(Math.floor((text.toLowerCase().match(new RegExp(techKeywords.join('|'), 'g')) || []).length * 15 + (wordCount / 5)), 98);
    const behavioralScore = Math.min(Math.floor((text.toLowerCase().match(new RegExp(behavioralKeywords.join('|'), 'g')) || []).length * 12 + (wordCount / 8)), 96);
    const stabilityScore = Math.min(70 + (wordCount % 25), 92);

    setAnalytics({
      tech: Math.max(techScore, 10),
      behavioral: Math.max(behavioralScore, 10),
      stability: stabilityScore,
      bodyLanguage: Math.max(Math.floor(bodyLanguageScoreRef.current), 10)
    });
  };

  const questions = [
    "Tell me about a challenging project you've worked on recently.",
    "How do you handle conflict within a development team?",
    "Explain the concept of 'Virtual DOM' in React as if I were a non-technical person.",
    "What is your approach to optimizing web application performance?"
  ];

  const isSpeakingRef = useRef(false);

  const speakQuestion = (text) => {
    isSpeakingRef.current = true;
    conversationHistoryRef.current.push({ role: 'interviewer', text: text });
    
    speakText(
      text,
      () => {
        isSpeakingRef.current = true;
        console.log("[TTS] Interviewer speaking...");
      },
      () => {
        isSpeakingRef.current = false;
        console.log("[TTS] Interviewer finished speaking.");
      }
    );
  };

  // Warm-up Speech Synthesis on mount
  useEffect(() => {
    initVoices();
  }, []);

  const startRecording = () => {
    if (isRecordingRef.current && recognitionRef.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice AI features require Google Chrome or Microsoft Edge browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("[Mic] Always-On Mode Active");
        setIsRecording(true);
        isRecordingRef.current = true;
      };

      recognition.onresult = (event) => {
        // IGNORE results if AI is currently speaking to prevent audio feedback
        if (isSpeakingRef.current) return;

        let interimText = '';
        let finalBatch = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalBatch += event.results[i][0].transcript + ' ';
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        
        if (finalBatch.trim()) {
          setResponse(prev => {
            const updated = (prev.trim() + " " + finalBatch.trim()).trim();
            responseRef.current = updated;
            return updated;
          });
          setTranscript('');
        } else {
          setTranscript(interimText);
        }
        updateRealTimeAnalytics(responseRef.current + interimText);
      };

      recognition.onerror = (event) => {
        console.warn("[Mic Status]:", event.error);
        if (event.error === 'not-allowed') {
          setIsRecording(false);
          isRecordingRef.current = false;
          alert("Microphone access denied. Please allow microphone access in browser settings.");
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch(e) {
                console.warn("Auto-restart retry:", e);
              }
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[Mic] Critical Failure:", err);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleRecording = () => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
  };

  const handleAnalyzeJD = async () => {
    if (props.topic) {
      setIsAnalyzingJD(true);
      try {
        const prompt = `Generate a JSON object for a technical drill on: "${props.topic}". Format: {"role": "Topic Expert", "questions": ["Q1", "Q2", "Q3"]}. Output ONLY JSON.`;
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const data = await callGemini(prompt, apiKey);
        const result = safeParseJSON(data.candidates[0].content.parts[0].text);
        setActiveQuestions(result?.questions || ["Explain your experience with " + props.topic]);
        setDetectedRole(result?.role || "Targeted Drill");
        setStep(1);
      } catch (err) {
        setStep(1);
      } finally { setIsAnalyzingJD(false); }
      return;
    }

    if (!jobDescription.trim()) return;
    setIsAnalyzingJD(true);
    try {
      const prompt = `Analyze this Resume/JD: "${jobDescription.substring(0, 3500)}". 
      Identify role and 10 questions. 
      Output ONLY JSON: {"role": "title", "questions": ["q1", "q2", ...]}`;
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const data = await callGemini(prompt, apiKey);
      const result = safeParseJSON(data.candidates[0].content.parts[0].text);
      
      setDetectedRole(result?.role || 'Professional');
      setActiveQuestions(result?.questions?.length > 0 ? result.questions : [
        "Tell me about your background.",
        "How do your skills align with this role?",
        "Describe a challenging project you've completed."
      ]);
      setStep(1);
    } catch (error) {
      setDetectedRole('Professional');
      setActiveQuestions(["Tell me about yourself.", "Why this role?", "What are your strengths?"]);
      setStep(1);
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  // Automatically trigger JD analysis if a topic is passed
  useEffect(() => {
    if (props.topic && step === 0) {
      handleAnalyzeJD();
    }
  }, [props.topic]);

  const handleStart = () => {
    setStep(2);
    if (activeQuestions.length > 0) {
      speakQuestion(activeQuestions[0]);
    }
  };

  const parseScoresAndReport = (aiAnalysis, bodyLanguageScore, fullTranscript) => {
    const getNum = (...keys) => {
      for (const k of keys) {
        if (typeof aiAnalysis[k] === 'number' && !isNaN(aiAnalysis[k]) && aiAnalysis[k] > 0) {
          return Math.min(Math.max(Math.floor(aiAnalysis[k]), 10), 100);
        }
      }
      return null;
    };

    const wordCount = fullTranscript ? fullTranscript.split(/\s+/).length : 0;
    const baseScore = wordCount > 40 ? 78 : wordCount > 15 ? 65 : 50;

    const tech = getNum('techScore', 'tech_score', 'technicalScore', 'technical_score', 'tech') ?? baseScore;
    const behavioral = getNum('behavioralScore', 'behavioral_score', 'softSkillsScore', 'behavioral') ?? (baseScore + 4);
    const stability = getNum('stabilityScore', 'stability_score', 'voiceStability', 'stability') ?? (baseScore + 2);
    const bodyLanguage = getNum('bodyLanguageScore', 'body_language_score', 'bodyLanguage') ?? Math.max(bodyLanguageScore, 65);

    let report = aiAnalysis.report || aiAnalysis.evaluation || aiAnalysis.feedback || {};
    if (typeof report === 'string') {
      report = { summary: report };
    }

    const summaryText = report.summary || aiAnalysis.summary || "Completed live interview session. Good communication structure overall.";
    const excelled = Array.isArray(report.excelled) && report.excelled.length > 0 ? report.excelled : (aiAnalysis.excelled || ["Clear verbal expression", "Good problem approach"]);
    const lacked = Array.isArray(report.lacked) && report.lacked.length > 0 ? report.lacked : (aiAnalysis.lacked || ["Providing specific quantitative metrics"]);
    const improvements = Array.isArray(report.improvements) && report.improvements.length > 0 ? report.improvements : (aiAnalysis.improvements || ["Incorporate STAR framework (Situation, Task, Action, Result) in behavioral answers."]);
    const bodyLanguageAnalysis = report.bodyLanguageAnalysis || aiAnalysis.bodyLanguageAnalysis || "Maintained steady camera eye contact and confident posture.";

    return {
      analytics: { tech, behavioral, stability, bodyLanguage },
      report: {
        summary: summaryText,
        excelled,
        lacked,
        improvements,
        bodyLanguageAnalysis
      }
    };
  };

  const handleEndInterview = async () => {
    console.log("End Interview triggered. Analyzing with AI...");
    
    try {
      stopRecording();
      
      // Stop & flush Video Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.requestData();
          }
        } catch (e) {}
        mediaRecorderRef.current.stop();
      }

      setIsAnalyzing(true);
      
      // Save final candidate response if available and not duplicated
      const fullText = response.trim() || transcript.trim();
      if (fullText) {
        const lastEntry = conversationHistoryRef.current[conversationHistoryRef.current.length - 1];
        if (!lastEntry || lastEntry.role !== 'candidate' || lastEntry.text !== fullText) {
          conversationHistoryRef.current.push({ role: 'candidate', text: fullText });
        }
        setResponse('');
        responseRef.current = '';
        setTranscript('');
      }

      console.log("Recording stopped. Full transcript captured.");
      
      const transcriptText = conversationHistoryRef.current.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n\n');
      const bodyLanguageScore = Math.floor(bodyLanguageScoreRef.current);

      const prompt = `Act as a senior technical interviewer for role "${detectedRole}".
Evaluate the candidate based on this transcript and visual tracking score:

TRANSCRIPT:
${transcriptText || "Candidate completed practice session."}

TRACKING METRIC: Body Posture & Eye Contact Score: ${bodyLanguageScore}%

Evaluate technical depth, soft skills, stability, and body language.
Return ONLY a valid JSON object matching this schema:
{
  "techScore": 70-100,
  "behavioralScore": 70-100,
  "stabilityScore": 70-100,
  "bodyLanguageScore": 70-100,
  "report": {
    "summary": "3-sentence performance summary.",
    "excelled": ["Key strength 1", "Key strength 2"],
    "lacked": ["Area for growth 1"],
    "improvements": ["Actionable advice 1", "Actionable advice 2"],
    "bodyLanguageAnalysis": "Observation on eye contact and visual delivery."
  }
}`;

      let finalScore = 0;
      let dynamicSummary = null;
      let newAnalytics = { tech: 0, behavioral: 0, stability: 0, bodyLanguage: 0 };

      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const data = await callGemini(prompt, apiKey);

        let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const aiAnalysis = safeParseJSON(jsonText) || {};

        const parsed = parseScoresAndReport(aiAnalysis, bodyLanguageScore, transcriptText);

        newAnalytics = parsed.analytics;
        dynamicSummary = parsed.report;
        finalScore = Math.floor((newAnalytics.tech + newAnalytics.behavioral + newAnalytics.stability + newAnalytics.bodyLanguage) / 4);

        setAnalytics(newAnalytics);
      } catch (aiError) {
        console.warn("AI End-Interview Fallback Triggered:", aiError);
        const parsedFallback = parseScoresAndReport({}, bodyLanguageScore, transcriptText);
        newAnalytics = parsedFallback.analytics;
        dynamicSummary = parsedFallback.report;
        finalScore = Math.floor((newAnalytics.tech + newAnalytics.behavioral + newAnalytics.stability + newAnalytics.bodyLanguage) / 4);
        setAnalytics(newAnalytics);
      }

      setSummary(dynamicSummary);

      // --- NEURAL NETWORK VERDICT (Custom Local Model) ---
      const inputs = [
        newAnalytics.tech / 100,
        newAnalytics.behavioral / 100,
        newAnalytics.stability / 100,
        newAnalytics.bodyLanguage / 100
      ];
      const prediction = hiringModel.predict(inputs);
      const verdictScore = Math.floor(prediction[0] * 100);
      setNeuralVerdict(verdictScore);
      console.log("Custom Neural Network Prediction:", verdictScore);

      // --- VIDEO UPLOAD ---
      let videoUrl = null;
      try {
        if (recordedChunksRef.current.length > 0) {
          console.log("Finalizing video blob...");
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          
          if (blob.size > 0) {
            videoUrl = await grabitApi.uploadRecording(blob, `interview_${Date.now()}.webm`);
            if (videoUrl) {
               console.log("Video recording saved:", videoUrl);
            } else {
               console.warn("Video upload returned null.");
            }
          }
        } else {
          console.warn("No video chunks recorded.");
        }
      } catch (videoError) {
        console.warn("Video upload process failed:", videoError);
      }

      const session = {
        id: Date.now(),
        role: detectedRole,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        score: finalScore,
        status: 'Completed',
        questions: currentQuestion + 1,
        analytics: newAnalytics,
        summary: dynamicSummary,
        video_url: videoUrl
      };

      // Save Interview via grabitApi (handles User-Scoped LocalStorage + Supabase Cloud)
      try {
        await grabitApi.saveInterview({
          role: detectedRole,
          score: finalScore,
          tech_score: newAnalytics.tech,
          behavioral_score: newAnalytics.behavioral,
          stability_score: newAnalytics.stability,
          body_language_score: newAnalytics.bodyLanguage,
          summary: dynamicSummary,
          video_url: videoUrl
        });
        console.log("Interview Session Saved Successfully!");
      } catch (saveError) {
        console.warn("Interview save warning:", saveError);
      }
          
      // --- AUTOMATED EMAIL REPORT (Optional Edge Function) ---
      if (import.meta.env.VITE_ENABLE_EMAIL_REPORTS === 'true' && user?.email) {
        try {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-interview-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              user_email: user.email,
              report_data: session 
            })
          }).catch(() => {});
        } catch (e) {}
      }
      
      setIsAnalyzing(false);
      setStep(3);
    } catch (err) {
      console.error("CRITICAL ERROR in handleEndInterview:", err);
      setIsAnalyzing(false);
      setStep(3); // Fallback to step 3 so user isn't stuck
    }
  };

  const handleNext = () => {
    const fullText = response.trim() || transcript.trim();
    if (fullText) {
      stopRecording();
      
      // Save candidate response
      conversationHistoryRef.current.push({ role: 'candidate', text: fullText });
      
      const nextQ = currentQuestion + 1;
      if (nextQ < activeQuestions.length) {
        setCurrentQuestion(nextQ);
        setResponse('');
        responseRef.current = '';
        setTranscript('');
        speakQuestion(activeQuestions[nextQ]);
      } else {
        setResponse('');
        responseRef.current = '';
        setTranscript('');
        handleEndInterview();
      }
    } else {
      // Provide visual feedback if trying to proceed without response
      setResponse(" (Please provide a response before proceeding...)");
      setTimeout(() => setResponse(""), 1500);
    }
  };

  return (
    <div className="practice-grab">
      <header style={{ marginBottom: '60px' }}>
        <div className="pill-grab" style={{ marginBottom: '16px' }}>
          <Zap size={14} /> AI Interviewer: Alexa (Pro Mode)
        </div>
        <h1 style={{ fontSize: '56px', marginBottom: '12px', fontWeight: '900', letterSpacing: '-0.05em' }}>
          Live <span className="shimmer-text">Simulation</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>Master the art of the interview with GrabIt's hyper-realistic AI sessions.</p>
      </header>

      {step === 0 && (
        <motion.div 
          className="grab-card" 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '60px' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Briefcase size={24} />
            </div>
            <h2 style={{ fontSize: '32px' }}>Context is Everything</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
            To provide the most accurate simulation, please paste the **Job Description** or **Role Requirements** you're preparing for. Alexa will tailor her questions to this role.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here... (e.g. 'We are looking for a Senior React Developer with 5+ years experience in...')"
            style={{ 
              width: '100%', 
              height: '300px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              padding: '24px', 
              color: 'white', 
              fontSize: '16px', 
              outline: 'none',
              resize: 'none',
              marginBottom: '32px',
              fontFamily: 'var(--font-body)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf,.doc,.docx" 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn-dark" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RefreshCcw size={16} />
                    </motion.div>
                    <span style={{ marginLeft: '8px' }}>Extracting...</span>
                  </>
                ) : (
                  'Upload PDF/Doc'
                )}
              </button>
            </div>
            <button 
              className="btn-grab" 
              onClick={handleAnalyzeJD}
              disabled={!jobDescription.trim() || isAnalyzingJD}
              style={{ opacity: jobDescription.trim() && !isAnalyzingJD ? 1 : 0.5 }}
            >
              {isAnalyzingJD ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCcw size={20} />
                  </motion.div>
                  Generating Questions...
                </>
              ) : (
                <>Analyze & Continue <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div 
          className="grab-card" 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '100px 40px', background: 'linear-gradient(135deg, #0a0a0a, #000)' }}
        >
          <div style={{ width: '100px', height: '100px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 40px', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 0 30px var(--primary-glow)' }}>
            <User size={48} />
          </div>
          <h2 style={{ fontSize: '40px', marginBottom: '24px', fontWeight: '900' }}>Alexa is Ready</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 56px', lineHeight: '1.7', fontSize: '20px' }}>
            Role Analysis Complete: <strong>{detectedRole}</strong>. Alexa has generated {activeQuestions.length} custom questions tailored specifically for this position.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <button className="btn-grab" onClick={handleStart} style={{ padding: '20px 60px', fontSize: '18px' }}>
              Start Interview Simulation <ArrowRight size={20} />
            </button>
            <button className="btn-dark" onClick={() => setStep(0)} style={{ padding: '20px 40px', fontSize: '18px' }}>Change Role</button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px' }}>
          <div className="grab-card" style={{ display: 'flex', flexDirection: 'column', gap: '40px', minHeight: '650px', border: '1px solid var(--border-bright)', padding: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="pill-grab">SCENARIO: {detectedRole}</span>
                {props.topic && (
                  <div style={{ padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)', borderRadius: '100px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={12} /> TARGETED DRILL ACTIVE
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '8px', height: '8px', background: isRecording ? '#ef4444' : '#525252', borderRadius: '50%', boxShadow: isRecording ? '0 0 10px #ef4444' : 'none' }} />
                 <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                   {isRecording ? 'RECORDING LIVE' : 'MIC STANDBY'}
                 </span>
              </div>
            </div>

            <div style={{ padding: '48px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: 'var(--bg-surface)', padding: '4px 12px', fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid var(--border)' }}>QUESTION {currentQuestion + 1}</div>
              <motion.h2 
                key={currentQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '36px', lineHeight: '1.2', fontWeight: '800' }}
              >
                {activeQuestions.length > 0 ? activeQuestions[currentQuestion] : "Loading question..."}
              </motion.h2>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={response + transcript}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Start speaking or type your detailed response here..."
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: '22px', 
                  outline: 'none',
                  resize: 'none',
                  lineHeight: '1.7',
                  fontFamily: 'var(--font-body)'
                }}
              />
              {isRecording && (
                <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '60px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                      style={{ flex: 1, background: 'var(--primary)', borderRadius: '2px', opacity: 0.6 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--primary)', fontWeight: 'bold' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <RefreshCcw size={24} />
                  </motion.div>
                  AI is analyzing your performance. Please wait...
                </div>
              ) : (
                <>
                  <button 
                    className="btn-dark" 
                    onClick={toggleRecording}
                    style={{ 
                      borderColor: isRecording ? '#ef4444' : 'var(--border)', 
                      color: isRecording ? '#ef4444' : 'var(--text-primary)',
                      padding: '12px 20px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    {isRecording ? 'END VOICE CAPTURE' : 'ENABLE VOICE AI'}
                  </button>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-dark" style={{ padding: '12px 20px', color: '#ef4444', whiteSpace: 'nowrap' }} onClick={handleEndInterview}>
                      End Interview
                    </button>
                    <button className="btn-dark" style={{ padding: '12px' }} onClick={() => setResponse('')}>
                      <RefreshCcw size={20} />
                    </button>
                    <button className="btn-grab" style={{ padding: '12px 20px', whiteSpace: 'nowrap' }} onClick={handleNext}>
                      Next Challenge <Send size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grab-card" style={{ flex: 1, padding: '32px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={20} color="var(--primary)" /> AI Live Insights
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {[
                  { label: 'Technical Accuracy', val: analytics.tech },
                  { label: 'Behavioral Index', val: analytics.behavioral },
                  { label: 'Voice Stability', val: analytics.stability },
                  { label: 'Body Language', val: analytics.bodyLanguage }
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ color: 'var(--primary)' }}>{s.val}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${s.val}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }} />
                    </div>
                  </div>
                ))}
                <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--primary)', lineHeight: '1.6', fontWeight: '500' }}>
                    "Your explanation of technical depth is impressive. Recommendation: Try to simplify the conclusion for better clarity."
                  </p>
                </div>
              </div>
            </div>

            <div className="grab-card" style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', padding: '0', position: 'relative', overflow: 'hidden' }}>
               {isVideoEnabled ? (
                 <>
                   <video 
                     ref={videoRef}
                     autoPlay 
                     playsInline 
                     muted 
                     onLoadedData={handleVideoLoad}
                     style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                   />
                   <canvas 
                     ref={canvasRef}
                     style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }}
                   />
                   <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <div style={{ width: '8px', height: '8px', background: isRecording ? '#ef4444' : '#10b981', borderRadius: '50%', boxShadow: `0 0 10px ${isRecording ? '#ef4444' : '#10b981'}` }} />
                       <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>AI VISION ACTIVE</span>
                     </div>
                     <div style={{ color: 'var(--primary)', fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <Sparkles size={10} /> Tracking Eye Contact & Posture
                     </div>
                   </div>
                 </>
               ) : (
                 <div style={{ position: 'relative' }}>
                   <motion.div 
                      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{ position: 'absolute', top: '-40px', left: '-40px', width: '140px', height: '140px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(40px)' }}
                   />
                   <div style={{ width: '80px', height: '80px', background: 'var(--bg-black)', border: '2px solid var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 0 20px var(--primary-glow)', position: 'relative' }}>
                      <Mic size={32} />
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <motion.div 
          className="grab-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--primary)' }}>
            <Sparkles size={40} />
          </div>
          <h2 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: '900' }}>Performance <span className="shimmer-text">Report</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '20px', marginBottom: '60px' }}>Simulation Complete. Here is how you performed against the industry benchmark.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '60px' }}>
            {[
              { label: 'Technical Score', val: analytics.tech, icon: <Zap size={20} /> },
              { label: 'Soft Skills', val: analytics.behavioral, icon: <User size={20} /> },
              { label: 'Stability', val: analytics.stability, icon: <Mic size={20} /> },
              { label: 'Body Language', val: analytics.bodyLanguage, icon: <Sparkles size={20} /> }
            ].map(stat => (
              <div key={stat.label} className="grab-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: '16px' }}>{stat.icon}</div>
                <div style={{ fontSize: '40px', fontWeight: '900', marginBottom: '8px' }}>{stat.val}%</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(16, 185, 129, 0.1)', marginBottom: '60px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageSquare size={20} color="var(--primary)" /> AI Evaluation Summary
            </h4>
            {typeof summary === 'string' ? (
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '17px' }}>
                {summary}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.8', fontSize: '17px' }}>{summary?.summary}</p>
                </div>
                {summary?.excelled && summary.excelled.length > 0 && (
                  <div>
                    <h5 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '16px' }}>🟢 Areas Where You Excelled</h5>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                      {summary.excelled.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {summary?.lacked && summary.lacked.length > 0 && (
                  <div>
                    <h5 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '16px' }}>🔴 Areas For Improvement</h5>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                      {summary.lacked.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {summary?.bodyLanguageAnalysis && (
                  <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <h5 style={{ color: '#3b82f6', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} /> Eye Contact & Body Language
                    </h5>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
                      {summary.bodyLanguageAnalysis}
                    </p>
                  </div>
                )}
                {neuralVerdict !== null && (
                  <div className="grab-card" style={{ marginTop: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '32px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Hiring Verdict: {neuralVerdict > 80 ? '🌟 Highly Recommended' : neuralVerdict > 60 ? '✅ Qualified' : '⚠️ Further Review Needed'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                      Overall Alignment Score: {neuralVerdict}%
                    </div>
                  </div>
                )}
                {summary?.improvements && summary.improvements.length > 0 && (
                  <div>
                    <h5 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '16px' }}>🚀 Actionable Next Steps</h5>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                      {summary.improvements.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <button className="btn-grab" style={{ padding: '20px 60px' }} onClick={() => props.onComplete && props.onComplete()}>Finish & View Full History</button>
            <button className="btn-dark" style={{ padding: '20px 40px' }} onClick={() => setStep(0)}>Try Another Role</button>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default InterviewPractice;
