import React, { useState, useEffect } from 'react';
import { Calendar, Award, ExternalLink, Sparkles, Trash2, RefreshCcw, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { grabitApi } from '../utils/api';

const VideoPlayer = ({ videoUrl }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '13px', margin: 0, fontWeight: '500' }}>
          ⚠️ Temporary session video link expired. New practice session videos will persist permanently.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
      <video 
        src={videoUrl} 
        controls 
        playsInline
        preload="metadata"
        onError={() => setHasError(true)}
        style={{ width: '100%', maxHeight: '400px', display: 'block' }}
      />
    </div>
  );
};

const History = () => {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await grabitApi.getInterviews();
      const mapped = (data || []).map(item => {
        let summaryObj = item.report_json;
        if (typeof summaryObj === 'string') {
          try { summaryObj = JSON.parse(summaryObj); } catch (e) {}
        }
        if (!summaryObj || typeof summaryObj !== 'object') {
          if (typeof item.summary === 'object' && item.summary !== null) {
            summaryObj = item.summary;
          } else if (typeof item.summary === 'string') {
            try { summaryObj = JSON.parse(item.summary); } catch (e) { summaryObj = { summary: item.summary }; }
          } else {
            summaryObj = {};
          }
        }

        return {
          id: item.id,
          role: item.role || 'Practice Session',
          date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })),
          score: item.score || 0,
          status: item.status || 'Completed',
          questions: item.questions || 0,
          summary: summaryObj,
          video_url: item.video_url,
          analytics: item.analytics || {
            tech: item.tech_score || 0,
            behavioral: item.behavioral_score || 0,
            stability: item.stability_score || 0,
            bodyLanguage: item.body_language_score || 0
          }
        };
      });
      setHistory(mapped);
    } catch (err) {
      console.error("Critical error in history fetch:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDelete = async (session) => {
    try {
      if (session.video_url) {
        try {
          const urlParts = session.video_url.split('/interview-recordings/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('interview-recordings').remove([filePath]);
          }
        } catch (storageErr) {
          console.warn("Could not delete storage video:", storageErr);
        }
      }

      await grabitApi.deleteInterview(session.id);

      setHistory(prev => prev.filter(s => s.id !== session.id));
      if (expandedId === session.id) setExpandedId(null);
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session. Please try again.");
    }
  };

  return (
    <div className="history-content">
      <header style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--primary)', borderRadius: '40px', fontSize: '14px', 
            fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '16px' 
          }}>
            <Sparkles size={14} /> Performance Archive
          </div>
          <h1 style={{ fontSize: '48px', marginBottom: '12px', fontWeight: '800' }}>
            Interview <span style={{ color: 'var(--primary)' }}>History</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Review your past performance data and feedback logs.</p>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={loading}
          style={{ 
            padding: '12px 20px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            color: 'white', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <RefreshCcw size={16} className={loading ? 'spin' : ''} /> Refresh Sync
        </button>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="loader-grab"></div>
        </div>
      ) : history.length === 0 ? (
        <div style={{ 
          padding: '80px 40px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '24px', 
          border: '1px solid var(--border)' 
        }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
            margin: '0 auto 24px'
          }}>
            <Award size={40} />
          </div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No sessions yet</h3>
          <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 32px' }}>
            Complete your first AI interview practice to start tracking your performance and getting cloud-synced reports.
          </p>
        </div>
      ) : (
        <div className="grab-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '24px 32px', color: 'var(--text-dim)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session / Role</th>
                <th style={{ padding: '24px 32px', color: 'var(--text-dim)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '24px 32px', color: 'var(--text-dim)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                <th style={{ padding: '24px 32px', color: 'var(--text-dim)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '24px 32px' }}></th>
              </tr>
            </thead>
            <tbody>
              {history.map((session, index) => (
                <React.Fragment key={session.id}>
                <motion.tr 
                  key={session.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} 
                  className="history-row"
                >
                <td style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                      <Award size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>{session.role}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>{session.questions} Questions</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px 32px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--text-dim)" /> {session.date}
                  </div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: session.score > 80 ? 'var(--primary)' : session.score > 70 ? '#f59e0b' : '#ef4444',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '800', 
                      fontSize: '14px',
                      color: session.score > 80 ? 'var(--primary)' : session.score > 70 ? '#f59e0b' : '#ef4444'
                    }}>
                      {session.score}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <div style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: session.status === 'Completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: session.status === 'Completed' ? 'var(--primary)' : '#ef4444'
                  }}>
                    {session.status}
                  </div>
                </td>
                <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} 
                      className="icon-btn"
                      onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', opacity: 0.6 }} 
                      className="icon-btn-delete"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this session and its recording?')) {
                          handleDelete(session);
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
              {expandedId === session.id && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ background: 'rgba(16, 185, 129, 0.02)' }}
                >
                  <td colSpan="5" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} /> Detailed Performance Report
                      </h4>
                      
                      {typeof session.summary === 'string' ? (
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
                          {session.summary || "No detailed report available for this older session."}
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '15px' }}>
                              {session.summary?.summary}
                            </p>
                          </div>
                          
                          {session.summary?.excelled && session.summary.excelled.length > 0 && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                              <h5 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '15px' }}>🟢 Areas Where You Excelled</h5>
                              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                                {session.summary.excelled.map((item, i) => <li key={i} style={{ marginBottom: '8px' }}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          
                          {session.summary?.lacked && session.summary.lacked.length > 0 && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                              <h5 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '15px' }}>🔴 Areas For Improvement</h5>
                              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                                {session.summary.lacked.map((item, i) => <li key={i} style={{ marginBottom: '8px' }}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          
                          {session.summary?.improvements && session.summary.improvements.length > 0 && (
                            <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                              <h5 style={{ color: '#3b82f6', marginBottom: '16px', fontSize: '15px' }}>🚀 Actionable Next Steps</h5>
                              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                                {session.summary.improvements.map((item, i) => <li key={i} style={{ marginBottom: '8px' }}>{item}</li>)}
                              </ul>
                            </div>
                          )}

                          {session.video_url && (
                            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                               <h5 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <Video size={18} /> Session Recording
                               </h5>
                               <VideoPlayer videoUrl={session.video_url} />
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
        </table>
      </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .history-row:hover {
          background: rgba(255, 255, 255, 0.015);
        }
        .icon-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .icon-btn-delete:hover {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.1);
          opacity: 1 !important;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
};

export default History;
