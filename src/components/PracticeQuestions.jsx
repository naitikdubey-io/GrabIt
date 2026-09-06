import React, { useState } from 'react';
import { Search, Filter, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PracticeQuestions = ({ onStartPractice }) => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Technical', 'Behavioral', 'System Design', 'HR'];
  
  const questions = [
    { id: 1, text: "How do you handle a deadline that you cannot meet?", category: 'Behavioral', difficulty: 'Easy' },
    { id: 2, text: "Explain the difference between synchronous and asynchronous programming.", category: 'Technical', difficulty: 'Medium' },
    { id: 3, text: "Design a URL shortening service like Bitly.", category: 'System Design', difficulty: 'Hard' },
    { id: 4, text: "What is your greatest weakness and how are you working on it?", category: 'HR', difficulty: 'Easy' },
    { id: 5, text: "How would you optimize a slow database query?", category: 'Technical', difficulty: 'Medium' },
    { id: 6, text: "Tell me about a time you had to learn a new technology quickly.", category: 'Behavioral', difficulty: 'Medium' },
  ];

  const filteredQuestions = filter === 'All' 
    ? questions 
    : questions.filter(q => q.category === filter);

  return (
    <div className="questions-content">
      <header style={{ marginBottom: '60px' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', 
          padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', 
          color: 'var(--primary)', borderRadius: '40px', fontSize: '14px', 
          fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '16px' 
        }}>
          <Sparkles size={14} /> Curated Question Bank
        </div>
        <h1 style={{ fontSize: '48px', marginBottom: '12px', fontWeight: '800' }}>
          Practice <span style={{ color: 'var(--primary)' }}>Library</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Master the most common interview questions with AI-guided solutions.</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search for questions, topics, or skills..." 
            style={{ 
              width: '100%', 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '16px', 
              padding: '16px 16px 16px 56px',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            className="search-input"
          />
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '6px' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '12px', 
                border: 'none',
                background: filter === cat ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: filter === cat ? 'var(--text-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                fontWeight: filter === cat ? '600' : '500',
                transition: '0.2s',
                fontSize: '14px'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Custom Question Option */}
        <motion.div 
          className="grab-card" 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '24px 32px', border: '1px dashed var(--primary)', 
            background: 'rgba(16, 185, 129, 0.03)', marginBottom: '10px' 
          }}
        >
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ padding: '12px', background: 'var(--primary)', borderRadius: '14px', color: '#000' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ marginBottom: '4px', fontSize: '18px', fontWeight: '800' }}>Create Custom Practice</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Have a specific question in mind? Add it yourself and get AI analysis.</p>
            </div>
          </div>
          <button 
            className="btn-grab" 
            onClick={() => onStartPractice('CUSTOM_QUESTION')}
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            Add Question <ChevronRight size={16} />
          </button>
        </motion.div>

        {filteredQuestions.map((q, i) => (
          <motion.div 
            key={q.id} 
            className="grab-card" 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px' }}
          >
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>{q.text}</h4>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>{q.category}</span>
                  <div style={{ width: '4px', height: '4px', background: 'var(--border)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: q.difficulty === 'Hard' ? '#ef4444' : q.difficulty === 'Medium' ? '#f59e0b' : '#10b981' }}>
                    {q.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <button 
              className="btn-grab" 
              onClick={() => onStartPractice(q.text)}
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Practice Question <ChevronRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>
      
      <style>{`
        .search-input:focus {
          border-color: var(--primary);
          background: var(--bg-surface-soft);
        }
      `}</style>
    </div>
  );
};

export default PracticeQuestions;
