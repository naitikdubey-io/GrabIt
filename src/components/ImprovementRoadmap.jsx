import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Target, Zap, MessageCircle, AlertCircle, TrendingUp, Award, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { grabitApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ImprovementRoadmap = ({ onStartPractice }) => {
  const [latestSession, setLatestSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterRoadmap, setMasterRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const cloudRoadmap = await grabitApi.getLatestRoadmap();
        if (cloudRoadmap?.roadmap_json) {
          setMasterRoadmap(cloudRoadmap.roadmap_json);
        }

        const history = await grabitApi.getInterviews();
        if (history && history.length > 0) {
          const sorted = [...history].sort((a, b) => {
             const idA = a.id || a.created_at;
             const idB = b.id || b.created_at;
             return idB > idA ? 1 : -1;
          });
          setLatestSession(sorted[0]);
        } else {
          setLatestSession(null);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const generateMasterRoadmap = async () => {
    const history = await grabitApi.getInterviews();
    if (!history || history.length < 1) return;

    setIsGenerating(true);
    try {
      const summaries = history.map((s, i) => {
        const stats = s.analytics || {};
        return `Session ${i+1} (${s.role}):
        - Technical: ${stats.tech}%
        - Behavioral: ${stats.behavioral}%
        - Body Language/Presence: ${stats.bodyLanguage}%
        - Feedback: ${JSON.stringify(s.summary)}`;
      }).join('\n\n');

      const prompt = `Act as an elite Career Coach. Based on these interview performance summaries, generate a "30-Day Professional Evolution Plan" specifically for a ${latestSession?.role || 'Professional'} role.
      
      Performance Data:
      ${summaries}
      
      Generate a JSON object with:
      1. "title": A catchy, high-impact roadmap title.
      2. "overview": A 2-sentence executive summary of the growth strategy.
      3. "phases": Array of 3 phases (Days 1-10, 11-20, 21-30). 
         Each phase must include:
         - "name": Phase name
         - "focus": Primary area of improvement (Technical, Behavioral, or Presence)
         - "milestones": Array of 4 specific, actionable tasks.
      
      Output ONLY JSON. Start with { and end with }.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const data = await (await import('../utils/gemini')).callGemini(prompt, apiKey);
      const jsonText = data.candidates[0].content.parts[0].text;
      const result = (await import('../utils/gemini')).safeParseJSON(jsonText);

      if (result) {
        setMasterRoadmap(result);
        await grabitApi.saveRoadmap(result.title || "Master Roadmap", result);
      }
    } catch (err) {
      console.error("Master Roadmap Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return null;

  // Empty State
  if (!latestSession) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grab-card"
          style={{ padding: '80px 40px', maxWidth: '800px', margin: '0 auto', background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent)' }}
        >
          <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            <AlertCircle size={48} />
          </div>
          <h2 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: '800' }}>Build Your Roadmap</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', margin: '0 auto 48px', lineHeight: '1.6' }}>
            Complete your first AI interview simulation to unlock a personalized 30-day professional evolution plan.
          </p>
          <button className="btn-grab" style={{ padding: '16px 40px', fontSize: '16px' }} onClick={onStartPractice}>
            Launch Your First Session <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  const { summary, role, score } = latestSession;
  
  return (
    <div className="roadmap-content">
      <header style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--primary)', borderRadius: '40px', fontSize: '14px', 
            fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '16px' 
          }}>
            <Sparkles size={14} /> Long-Term Career Intelligence
          </div>
          <h1 style={{ fontSize: '48px', marginBottom: '12px', fontWeight: '800' }}>
            Professional <span style={{ color: 'var(--primary)' }}>Evolution</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
            Multi-session analysis for **{role}**.
          </p>
        </div>
        {!masterRoadmap && (
          <button 
            className="btn-grab" 
            onClick={generateMasterRoadmap}
            disabled={isGenerating}
            style={{ padding: '14px 28px' }}
          >
            {isGenerating ? 'Synthesizing Data...' : 'Generate 30-Day Master Plan'} <Sparkles size={16} />
          </button>
        )}
      </header>

      {/* Master Roadmap View */}
      {masterRoadmap && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '80px' }}
        >
          <div className="grab-card" style={{ padding: '48px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800' }}>{masterRoadmap.title}</h2>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-dark" 
                  onClick={generateMasterRoadmap} 
                  disabled={isGenerating} 
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <motion.div
                    animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
                    transition={isGenerating ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.2 }}
                  >
                    <RefreshCcw size={12} />
                  </motion.div>
                  {isGenerating ? 'Synthesizing...' : 'Update Strategy'}
                </motion.button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '700px' }}>{masterRoadmap.overview}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {masterRoadmap.phases.map((phase, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border)', height: '100%' }}>
                    <div style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={12} /> Phase {i+1}
                    </div>
                    <h3 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '700' }}>{phase.name}</h3>
                    <div style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', color: 'var(--primary)', fontSize: '12px', fontWeight: '700', display: 'inline-block', marginBottom: '16px' }}>
                      Focus: {phase.focus}
                    </div>
                  <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-medium)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {phase.milestones.map((ms, j) => (
                      <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', marginTop: '6px', boxShadow: '0 0 8px var(--primary)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>{ms}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Immediate Session Insights */}
      <h3 style={{ fontSize: '24px', marginBottom: '32px', color: 'var(--text-white)' }}>
        <Zap size={20} color="var(--primary)" style={{ marginRight: '12px' }} /> Latest Session Drills
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {[
          ...(summary?.lacked?.map(item => ({
            title: 'Critical Gap',
            description: item,
            icon: Target,
            impact: 'High',
            color: '#ef4444'
          })) || []),
          ...(summary?.improvements?.map(item => ({
            title: 'Action Item',
            description: item,
            icon: Zap,
            impact: 'Growth',
            color: 'var(--accent-indigo)'
          })) || [])
        ].map((item, index) => (
          <motion.div
            key={index}
            className="grab-card"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1fr 200px', 
              gap: '32px', 
              alignItems: 'center', 
              padding: '24px 32px',
              borderLeft: `4px solid ${item.color}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                <item.icon size={28} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{item.title}</h3>
                <div style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {item.impact.toUpperCase()}
                </div>
              </div>
              <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.6' }}>{item.description}</p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button 
                className="btn-dark" 
                style={{ padding: '10px 20px', fontSize: '13px' }}
                onClick={() => onStartPractice(item.description)}
              >
                Targeted Drill <TrendingUp size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="grab-card" 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: '60px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ padding: '20px', background: 'var(--primary)', borderRadius: '20px', color: '#000', boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}>
            <TrendingUp size={40} />
          </div>
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Rapid Recovery Session</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Want to immediately fix the issues from your last session?</p>
          </div>
          <button className="btn-grab" style={{ marginLeft: 'auto', padding: '14px 28px', fontSize: '15px' }} onClick={() => onStartPractice(summary?.lacked?.[0] || 'General Improvement')}>
            Start Drill <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ImprovementRoadmap;
