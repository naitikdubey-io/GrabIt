import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, Star, Sparkles, ChevronRight, Zap, Target, ArrowUpRight, Activity, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { grabitApi } from '../utils/api';

const Dashboard = ({ onStartPractice }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await grabitApi.getInterviews();
      const mapped = (data || []).map(item => ({
        ...item,
        analytics: item.analytics || item.report_json?.analytics || {
          tech: item.tech_score || 0,
          stability: item.stability_score || 0,
          behavioral: item.behavioral_score || 0,
          bodyLanguage: item.body_language_score || 0
        },
        summary: item.summary || item.report_json || {}
      }));
      setHistory(mapped);
    } catch (e) {
      console.warn("Dashboard history fetch failed:", e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const totalSessions = history.length;
  const avgAccuracy = totalSessions > 0 ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / totalSessions) : 0;
  const grabitScore = totalSessions > 0 ? history.reduce((acc, curr) => acc + curr.score, 0) : 0;
  const achievements = history.filter(s => s.score >= 80).length;

  const stats = [
    { label: 'Sessions', value: totalSessions.toString(), icon: Activity, trend: '+12%', color: 'var(--accent-indigo)' },
    { label: 'Avg. Accuracy', value: `${avgAccuracy}%`, icon: Target, trend: '+5%', color: 'var(--primary)' },
    { label: 'Grabit Index', value: grabitScore.toString(), icon: Zap, trend: '+240', color: 'var(--accent-cyan)' },
    { label: 'Achievements', value: achievements.toString(), icon: Award, trend: 'New', color: 'var(--primary-bright)' },
  ];

  const trajectoryData = history.slice(0, 10).reverse().map(s => s.score);

  const avgTech = totalSessions > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.tech_score || curr.analytics?.tech || 0), 0) / totalSessions) : 0;
  const avgStability = totalSessions > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.stability_score || curr.analytics?.stability || 0), 0) / totalSessions) : 0;

  const recentRole = history.length > 0 ? history[0].role : "Software Engineer";

  if (loading && history.length === 0) {
    return (
      <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader-grab"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pill-grab" style={{ marginBottom: '16px' }}
          >
            <Sparkles size={12} /> Live Performance Insights
          </motion.div>
          <h1 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.04em' }}>
            System <span className="shimmer-text">Overview</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Profile Readiness</p>
           <h3 style={{ fontSize: '24px', color: 'var(--primary)' }}>{avgAccuracy}%</h3>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="grab-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: stat.color, border: '1px solid var(--border-medium)' }}>
                <stat.icon size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: stat.color, background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px' }}>
                {stat.trend}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stat.label}</p>
            <h3 style={{ fontSize: '32px', fontWeight: '800' }}>{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Main Chart Area */}
        <motion.div 
          className="grab-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{ padding: '32px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Skill Progression</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Historical performance across sessions</p>
            </div>
            <button className="btn-dark" onClick={fetchHistory} style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCcw size={12} className={loading ? 'spin' : ''} /> Sync
            </button>
          </div>

          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '32px', paddingLeft: '8px', paddingRight: '8px' }}>
            {trajectoryData.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-dim)' }}>
                <Activity size={40} strokeWidth={1} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>Awaiting initial session data...</p>
              </div>
            ) : trajectoryData.map((height, i) => (
              <div 
                key={i} 
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div style={{ position: 'relative', width: '100%', maxWidth: '40px', height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}>
                  <AnimatePresence>
                    {hoveredIdx === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: -12, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        style={{ 
                          position: 'absolute', bottom: `${height}%`, left: '50%', transform: 'translateX(-50%)',
                          background: 'var(--text-white)', color: '#000', padding: '6px 12px',
                          borderRadius: '8px', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 10
                        }}
                      >
                        {height}%
                        <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '8px', height: '8px', background: 'var(--text-white)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ 
                      height: `${Math.max(height, 5)}%`,
                      backgroundColor: hoveredIdx === i ? 'var(--primary)' : (i === trajectoryData.length - 1 ? 'var(--primary)' : 'rgba(255,255,255,0.08)')
                    }}
                    style={{ 
                      width: '100%', 
                      background: i === trajectoryData.length - 1 ? 'var(--primary)' : 'linear-gradient(to top, rgba(255,255,255,0.05), rgba(255,255,255,0.12))',
                      borderRadius: '8px 8px 4px 4px',
                      position: 'relative',
                      boxShadow: (i === trajectoryData.length - 1 || hoveredIdx === i) ? '0 0 20px var(--primary-glow)' : 'none',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    {(i === trajectoryData.length - 1 || hoveredIdx === i) && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 12px var(--primary)' }} />
                    )}
                  </motion.div>
                </div>
                <div style={{ position: 'absolute', bottom: '-28px', fontSize: '11px', color: hoveredIdx === i ? 'var(--text-white)' : 'var(--text-dim)', fontWeight: '700', transition: '0.2s' }}>
                  {`S${i + 1}`}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div 
            className="grab-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(0,0,0,0))',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary-glow)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px' }}>Active Match</h3>
              <div className="pill-grab" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-white)', border: 'none' }}>Hot</div>
            </div>
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>{recentRole}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>Your current technical depth makes you a top 5% candidate for this role.</p>
            <button 
              className="btn-grab" 
              onClick={onStartPractice}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Start Session <ArrowUpRight size={16} />
            </button>
          </motion.div>

          <motion.div 
            className="grab-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            style={{ padding: '32px' }}
          >
            <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Vector Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { label: 'Technical Depth', val: avgTech, color: 'var(--primary)' },
                { label: 'Communication Clarity', val: avgStability, color: 'var(--accent-indigo)' }
              ].map(s => (
                <div key={s.label}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                     <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{s.label}</span>
                     <span style={{ color: s.color, fontWeight: '700' }}>{s.val}%</span>
                   </div>
                   <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '100px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${s.val}%` }} 
                        transition={{ duration: 1.5, ease: "easeOut" }} 
                        style={{ height: '100%', background: s.color, borderRadius: '100px', boxShadow: `0 0 10px ${s.color}44` }} 
                      />
                   </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
