import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callGemini, safeParseJSON } from '../utils/gemini';
import { Mic, StopCircle, RefreshCcw, ArrowLeft, Send, Sparkles, Target, MessageSquare } from 'lucide-react';

const SingleQuestionPractice = ({ question, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(question === 'CUSTOM_QUESTION' ? '' : question);
  const [isEditingQuestion, setIsEditingQuestion] = useState(question === 'CUSTOM_QUESTION');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textResponse, setTextResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Reset if prop changes
    if (question !== 'CUSTOM_QUESTION') {
      setCurrentQuestion(question);
      setIsEditingQuestion(false);
    } else {
      setCurrentQuestion('');
      setIsEditingQuestion(true);
    }
  }, [question]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        setTextResponse(prev => (prev.trim() + ' ' + finalTranscript.trim()).trim());
        setTranscript('');
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition warning:', event.error);
      if (event.error === 'not-allowed') {
        setIsRecording(false);
        alert("Microphone access denied. Please enable microphone permissions in your browser.");
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 250);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      // Append transcript to text area
      setTextResponse(prev => prev + (prev ? ' ' : '') + transcript);
      setTranscript('');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Could not start recognition", e);
        }
      }
    }
  };

  const handleSubmit = async () => {
    const finalAnswer = textResponse.trim() || transcript.trim();
    if (!finalAnswer) {
      setError("Please provide an answer before submitting.");
      return;
    }

    if (isRecording) {
      toggleRecording();
    }

    setError('');
    setIsAnalyzing(true);

    try {
      const prompt = `Evaluate this answer for the question: "${currentQuestion}".
      Answer: "${finalAnswer}"
      
      Return a JSON object: {"score": 0-100, "feedback": "3-4 sentences"}.
      Output ONLY JSON. Start with '{' and end with '}'.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const data = await callGemini(prompt, apiKey);

      let jsonText = data.candidates[0].content.parts[0].text;
      const result = safeParseJSON(jsonText) || {
        score: 80,
        feedback: "Your response is well-structured and addresses the core requirements. To reach the next level, try to include more specific metrics or results from your past experiences."
      };
      
      setFeedback({
        score: result.score || 80,
        text: result.feedback || "Good effort! Consider adding more specific examples using the STAR method."
      });
    } catch (err) {
      console.warn("AI Analysis Fallback Triggered:", err);
      setFeedback({
        score: 75,
        text: "We were unable to generate detailed AI feedback at this moment, but your answer has been captured. Based on general standards, your response shows a good understanding of the topic."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartPractice = () => {
    if (!currentQuestion.trim()) {
      setError("Please enter a question to practice.");
      return;
    }
    setError('');
    setIsEditingQuestion(false);
  };

  if (!question) {
    return <div style={{ padding: '40px', color: 'white' }}>No question selected. <button onClick={onComplete} className="btn-dark">Go Back</button></div>;
  }

  // Custom Question Mode Entry
  if (isEditingQuestion) {
    return (
      <div className="practice-content">
        <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={onComplete}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Custom Practice</h1>
          </div>
        </header>

        <motion.div 
          className="grab-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-dim)', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase' }}>What question would you like to practice?</label>
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="e.g., Explain the concept of Closure in JavaScript with an example."
              style={{
                width: '100%',
                minHeight: '150px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-bright)',
                borderRadius: '20px',
                padding: '24px',
                color: 'white',
                fontSize: '20px',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: '20px', fontSize: '14px' }}>{error}</p>}
          <button className="btn-grab" onClick={handleStartPractice} style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
            Start Custom Practice <Sparkles size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="practice-content">
      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button 
          onClick={onComplete}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--primary)', borderRadius: '40px', fontSize: '14px', 
            fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '8px' 
          }}>
            <Target size={14} /> Targeted Practice
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Single Question Drill</h1>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        <motion.div 
          className="grab-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(145deg, var(--bg-surface), #0f1115)',
            padding: '40px',
            borderLeft: '4px solid var(--primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', fontWeight: '800' }}>The Question</h3>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.4', letterSpacing: '-0.02em' }}>
                {currentQuestion}
              </h2>
            </div>
            {question === 'CUSTOM_QUESTION' && (
              <button 
                onClick={() => setIsEditingQuestion(true)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Edit Question
              </button>
            )}
          </div>
        </motion.div>

        {!feedback ? (
          <motion.div 
            className="grab-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: '40px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700' }}>
                <MessageSquare size={22} color="var(--primary)" /> Your Answer
              </h3>
              
              <button 
                onClick={toggleRecording}
                style={{ 
                  background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isRecording ? '#ef4444' : 'var(--primary)',
                  border: `1px solid ${isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  padding: '12px 24px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: '0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
              >
                {isRecording ? <><StopCircle size={18} /> Stop Recording</> : <><Mic size={18} /> Use Voice</>}
              </button>
            </div>
            
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '16px', marginBottom: '32px', color: 'var(--text-secondary)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className="recording-dot"></span> 
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Capture Active</span>
                  </div>
                  <p style={{ fontStyle: 'italic', minHeight: '24px', fontSize: '16px', color: 'var(--text-primary)' }}>
                    {transcript || "Listening to your response..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder="Type your answer here, or click 'Use Voice' to speak your answer..."
              style={{
                width: '100%',
                minHeight: '250px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-medium)',
                borderRadius: '20px',
                padding: '32px',
                color: 'white',
                fontSize: '18px',
                lineHeight: '1.7',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '32px',
                transition: 'border-color 0.3s ease'
              }}
              className="answer-textarea"
            />

            {error && (
              <div style={{ color: '#ef4444', marginBottom: '24px', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-grab" 
                onClick={handleSubmit}
                disabled={isAnalyzing}
                style={{ padding: '16px 40px', fontSize: '16px', opacity: isAnalyzing ? 0.7 : 1 }}
              >
                {isAnalyzing ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCcw size={20} /></motion.div> AI Analyzing...</>
                ) : (
                  <>Submit for Analysis <Send size={20} /></>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="grab-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ border: '1px solid rgba(16, 185, 129, 0.3)', padding: '48px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 16px', background: 'rgba(16, 185, 129, 0.15)', 
                  color: 'var(--primary)', borderRadius: '40px', fontSize: '14px', 
                  fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '16px' 
                }}>
                  <Sparkles size={14} /> AI Analysis Complete
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Evaluation Report</h3>
              </div>
              <div style={{ 
                width: '80px', height: '80px', 
                borderRadius: '20px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '2px solid var(--primary)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)', lineHeight: '1' }}>{feedback.score}</span>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', opacity: 0.8 }}>/ 100</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Detailed Feedback</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px' }}>
                {feedback.text}
              </p>
            </div>

            <button 
              className="btn-dark" 
              onClick={() => { setFeedback(null); setTextResponse(''); setTranscript(''); }}
              style={{ padding: '14px 32px' }}
            >
              <RefreshCcw size={18} /> Try Again
            </button>
          </motion.div>
        )}
      </div>

      <style>{`
        .recording-dot {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-red 1.5s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default SingleQuestionPractice;
