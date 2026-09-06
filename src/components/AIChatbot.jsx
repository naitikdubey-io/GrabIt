import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Zap, MessageSquare, Info, ChevronRight, Share2, Clock, Plus, History as HistoryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callGemini } from '../utils/gemini';
import { grabitApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AIChatbot = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activePersona, setActivePersona] = useState('Career Mentor');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  const scrollRef = useRef(null);
  const { user } = useAuth();

  const personas = [
    { 
      id: 'Career Mentor', 
      desc: 'Expert in career growth, networking, and industry trends.', 
      icon: <Sparkles size={16} />,
      prompt: "You are the GrabIt Career Mentor. You help users with career growth, networking strategies, and understanding industry trends. Be encouraging, professional, and provide actionable advice."
    },
    { 
      id: 'Tech Tutor', 
      desc: 'Deep-dive expert into specific languages, frameworks, and architecture.', 
      icon: <Zap size={16} />,
      prompt: "You are the GrabIt Tech Tutor. You help users learn specific technical concepts, debug code, and understand software architecture. Be technical, precise, and provide code examples where helpful."
    },
    { 
      id: 'Mock Interviewer', 
      desc: 'Casual practice for any role without a formal simulation session.', 
      icon: <MessageSquare size={16} />,
      prompt: "You are the GrabIt Casual Interviewer. You provide low-pressure practice questions and feedback. Help the user sharpen their communication skills in a conversational way."
    }
  ];

  // 1. Fetch Sessions when Persona Changes
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const data = await grabitApi.getChatSessions(activePersona);
        setSessions(data || []);
        
        // If there's at least one session, load the most recent one
        if (data && data.length > 0) {
          if (!activeSessionId || !data.some(s => s.id === activeSessionId)) {
            setActiveSessionId(data[0].id);
            setMessages(data[0].messages || []);
          }
        } else {
          startNewChat();
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
        startNewChat();
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [activePersona]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      text: `Hello! I'm your GrabIt ${activePersona}. How can I help you today?`,
      timestamp: new Date().toISOString()
    }]);
  };

  const selectSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const persona = personas.find(p => p.id === activePersona);
      
      // Construct context
      const recentHistory = messages.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.text}`).join('\n\n');
      const fullPrompt = `${persona.prompt}\n\nCONVERSATION HISTORY:\n${recentHistory}\n\nUSER MESSAGE: ${input}\n\nASSISTANT RESPONSE:`;
      
      const data = await callGemini(fullPrompt, apiKey);
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I processed your request, but received an empty response.";

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: aiText,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save / Update session (LocalStorage + Cloud)
      try {
        if (activeSessionId) {
          await grabitApi.updateChatSession(activeSessionId, finalMessages);
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages, updated_at: new Date().toISOString() } : s));
        } else {
          const newSession = await grabitApi.createChatSession(activePersona, finalMessages);
          if (newSession?.id) {
            setActiveSessionId(newSession.id);
            setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
          }
        }
      } catch (syncErr) {
        console.warn("Chat session save warning:", syncErr);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const fallbackMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: `⚠️ Unable to reach Gemini AI service right now (${error.message || 'Rate limited or offline'}). Please try sending your message again in a moment.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    
    try {
      await grabitApi.deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        startNewChat();
      }
    } catch (err) {
      alert("Failed to delete session.");
    }
  };

  return (
    <div className="chatbot-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar: Persona & Session History */}
      <div className="grab-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="var(--primary)" /> AI Assistant
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Your multi-expert growth system.</p>
        </div>

        {/* Persona Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Experts</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {personas.map(p => (
              <button 
                key={p.id}
                onClick={() => { setActivePersona(p.id); setActiveSessionId(null); }}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  background: activePersona === p.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${activePersona === p.id ? 'var(--primary)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  color: activePersona === p.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: '0.2s'
                }}
              >
                {p.id}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="btn-grab" 
          onClick={startNewChat}
          style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '12px' }}
        >
          <Plus size={16} /> New Conversation
        </button>

        {/* Session History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HistoryIcon size={12} /> {activePersona} History
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoadingSessions ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>Loading history...</div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>No saved sessions yet.</div>
            ) : (
              sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => selectSession(s)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: activeSessionId === s.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${activeSessionId === s.id ? 'var(--border-bright)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: '0.2s',
                    position: 'relative',
                    group: true
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span>{s.messages.length} messages</span>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, s.id)}
                    style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: '#f87171', opacity: 0.4, cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Conversations are stored as separate sessions. Click **New Conversation** to start fresh.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="grab-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{activePersona}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeSessionId ? "Viewing saved session" : "New active session"}</p>
            </div>
          </div>
          <button className="btn-dark" style={{ padding: '8px 12px' }}>
            <Share2 size={14} />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '32px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px',
            scrollBehavior: 'smooth'
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  display: 'flex', 
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '12px'
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <Bot size={18} />
                  </div>
                )}
                <div style={{ 
                  maxWidth: '75%', 
                  padding: '16px 20px', 
                  borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: m.role === 'user' ? '#000' : 'white',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontWeight: m.role === 'user' ? '600' : '400',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  boxShadow: m.role === 'user' ? '0 10px 20px rgba(16, 185, 129, 0.2)' : 'none'
                }}>
                  {m.text.split('\n').map((line, idx) => (
                    <p key={idx} style={{ marginBottom: line ? '8px' : '0' }}>{line}</p>
                  ))}
                  <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                    {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {m.role === 'user' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <User size={18} />
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '12px' }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Bot size={18} />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }} />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }} />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div style={{ padding: '32px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message the ${activePersona}...`}
              style={{ 
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 60px 16px 20px',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                resize: 'none',
                height: '64px',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: input.trim() && !isTyping ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: input.trim() && !isTyping ? '#000' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-dim)' }}>
            <span>Cloud-synced sessions. Your history is permanent.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
