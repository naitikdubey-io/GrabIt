import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Globe, Server, Database, Cloud, Cpu, ChevronRight, CheckCircle2, Bookmark, ExternalLink, Target, X, BookOpen, Info, Zap, Lightbulb } from 'lucide-react';
import { callGemini, safeParseJSON } from '../utils/gemini';

const TechRoadmaps = ({ onStartPractice }) => {
  const [activeStack, setActiveStack] = useState('Frontend');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicDetails, setTopicDetails] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const stacks = [
    {
      name: 'Frontend',
      icon: Globe,
      color: 'var(--primary)',
      description: 'Master the art of building immersive, high-performance user interfaces.',
      phases: [
        { name: 'The Basics', items: ['Modern HTML5 Semantic Tags', 'CSS3 Grid & Flexbox', 'Responsive Design Principles'] },
        { name: 'JavaScript Mastery', items: ['ES6+ Syntax & Features', 'Asynchronous JS (Promises/Async)', 'DOM Manipulation & Events'] },
        { name: 'Modern Frameworks', items: ['React 19 & Next.js 15', 'State Management (Zustand/Redux)', 'Tailwind CSS & Framer Motion'] },
        { name: 'Advanced Concepts', items: ['Performance Optimization', 'Web Accessibility (A11y)', 'Testing (Jest/Cypress)'] }
      ]
    },
    {
      name: 'Backend',
      icon: Server,
      color: 'var(--accent-indigo)',
      description: 'Architect scalable, robust server-side systems and APIs.',
      phases: [
        { name: 'Core Languages', items: ['Node.js (TypeScript)', 'Python (FastAPI/Django)', 'Go (Goroutines)'] },
        { name: 'Data Persistence', items: ['PostgreSQL & MongoDB', 'Redis Caching', 'Prisma ORM'] },
        { name: 'API Design', items: ['RESTful Best Practices', 'GraphQL (Apollo)', 'WebSockets'] },
        { name: 'System Architecture', items: ['Microservices', 'Message Queues (Kafka)', 'Authentication (JWT/OAuth)'] }
      ]
    },
    {
      name: 'AI & Data',
      icon: Cpu,
      color: 'var(--accent-cyan)',
      description: 'Bridge the gap between data science and production-grade AI.',
      phases: [
        { name: 'Fundamentals', items: ['Python for Data Science', 'Linear Algebra & Statistics', 'NumPy & Pandas'] },
        { name: 'Machine Learning', items: ['Supervised & Unsupervised Learning', 'Scikit-Learn', 'Feature Engineering'] },
        { name: 'Deep Learning', items: ['Neural Networks', 'PyTorch or TensorFlow', 'Computer Vision / NLP'] },
        { name: 'AI Engineering', items: ['LLM Integration (Gemini/GPT)', 'Vector Databases (Pinecone)', 'LangChain Framework'] }
      ]
    },
    {
      name: 'DevOps & Cloud',
      icon: Cloud,
      color: '#f59e0b',
      description: 'Scale and automate infrastructure with modern cloud-native tools.',
      phases: [
        { name: 'Containerization', items: ['Docker Fundamentals', 'Multi-stage Builds', 'Docker Compose'] },
        { name: 'Orchestration', items: ['Kubernetes Clusters', 'Helm Charts', 'Service Mesh (Istio)'] },
        { name: 'Infrastructure', items: ['Terraform (IaC)', 'AWS/GCP Services', 'Serverless Functions'] },
        { name: 'CI/CD Pipelines', items: ['GitHub Actions', 'Jenkins', 'Monitoring (Prometheus/Grafana)'] }
      ]
    }
  ];

  const currentStack = stacks.find(s => s.name === activeStack);

  const fetchTopicDetails = async (topic) => {
    setSelectedTopic(topic);
    setIsFetchingDetails(true);
    setTopicDetails(null);

    try {
      const prompt = `Act as an expert technical mentor. Give me a concise roadmap guidance for the topic: "${topic}" in the context of "${activeStack}" engineering.
      
      Generate a JSON object:
      {
        "importance": "Why this matters in 1 sentence",
        "concepts": ["Concept 1", "Concept 2", "Concept 3"],
        "guidance": "2 sentences on how to master this effectively",
        "difficulty": "Easy/Medium/Hard"
      }
      Output ONLY JSON.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const data = await callGemini(prompt, apiKey);
      const jsonText = data.candidates[0].content.parts[0].text;
      const result = safeParseJSON(jsonText);
      setTopicDetails(result);
    } catch (err) {
      console.error("Failed to fetch topic guidance:", err);
      setTopicDetails({
        importance: "Critical foundation for modern engineering.",
        concepts: ["Core Implementation", "Best Practices", "Performance"],
        guidance: "Start with the official documentation and build a small project to reinforce your understanding.",
        difficulty: "Medium"
      });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="tech-roadmaps">
      <header style={{ marginBottom: '60px' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', 
          padding: '8px 16px', background: 'rgba(255, 255, 255, 0.03)', 
          color: 'var(--text-secondary)', borderRadius: '40px', fontSize: '14px', 
          fontWeight: '700', border: '1px solid var(--border)',
          marginBottom: '16px' 
        }}>
          <Layers size={14} /> Career Path Library
        </div>
        <h1 style={{ fontSize: '48px', marginBottom: '12px', fontWeight: '800' }}>
          Tech <span className="shimmer-text">Roadmaps</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Expert-curated paths to help you master the most in-demand technical roles.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px' }}>
        {/* Sidebar Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stacks.map(stack => (
            <button
              key={stack.name}
              onClick={() => setActiveStack(stack.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px 24px',
                background: activeStack === stack.name ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid',
                borderColor: activeStack === stack.name ? 'var(--border-bright)' : 'transparent',
                borderRadius: '20px',
                color: activeStack === stack.name ? 'var(--text-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left'
              }}
              className="stack-button"
            >
              <div style={{ 
                width: '40px', height: '40px', 
                background: activeStack === stack.name ? stack.color : 'rgba(255,255,255,0.03)',
                color: activeStack === stack.name ? '#000' : stack.color,
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.3s'
              }}>
                <stack.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>{stack.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>Professional Track</div>
              </div>
            </button>
          ))}
        </div>

        {/* Roadmap Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grab-card" style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: `radial-gradient(circle at center, ${currentStack.color}11, transparent)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              
              <div style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '900' }}>{currentStack.name} Engineering</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', lineHeight: '1.7' }}>{currentStack.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {currentStack.phases.map((phase, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: currentStack.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Phase 0{i+1}</div>
                      <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{phase.name}</h3>
                      {i < currentStack.phases.length - 1 && (
                        <div style={{ position: 'absolute', left: '0', bottom: '-40px', width: '2px', height: '40px', background: `linear-gradient(to bottom, ${currentStack.color}44, transparent)` }} />
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                      {phase.items.map((item, j) => (
                        <motion.div
                          key={j}
                          whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fetchTopicDetails(item)}
                          style={{ 
                            padding: '16px 20px', 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CheckCircle2 size={16} color={currentStack.color} />
                          <span style={{ flex: 1 }}>{item}</span>
                          <Info size={12} style={{ opacity: 0.3 }} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '64px', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>Ready to test your {activeStack} skills?</h4>
                  <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Launch an AI interview session specifically focused on this track.</p>
                </div>
                <button 
                  className="btn-grab" 
                  style={{ padding: '14px 28px' }}
                  onClick={() => onStartPractice(activeStack)}
                >
                  Start Practice Session <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="grab-card"
              style={{ 
                width: '100%', maxWidth: '600px', padding: '48px', position: 'relative',
                border: `1px solid ${currentStack.color}33`,
                background: 'linear-gradient(145deg, #111418, #0a0c0f)',
                maxHeight: '90vh',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${currentStack.color}33 transparent`
              }}
            >
              <button onClick={() => setSelectedTopic(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={24} />
              </button>

              <div style={{ marginBottom: '40px' }}>
                <div style={{ color: currentStack.color, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Guidance Path</div>
                <h2 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px' }}>
                   {selectedTopic}
                </h2>
              </div>

              {isFetchingDetails ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '20px' }}>
                    <Zap size={32} color={currentStack.color} />
                  </motion.div>
                  <p style={{ color: 'var(--text-secondary)' }}>AI is generating guidance for this topic...</p>
                </div>
              ) : topicDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border)', flex: 1 }}>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lightbulb size={14} color="#f59e0b" /> THE CORE WHY
                      </h4>
                      <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: '1.6' }}>{topicDetails.importance}</p>
                    </div>
                    <div style={{ width: '120px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>DIFFICULTY</h4>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: topicDetails.difficulty === 'Hard' ? '#ef4444' : topicDetails.difficulty === 'Medium' ? '#f59e0b' : '#10b981' }}>
                        {topicDetails.difficulty}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={14} color={currentStack.color} /> KEY CONCEPTS TO MASTER
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      {topicDetails.concepts.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '14px' }}>
                          <div style={{ width: '6px', height: '6px', background: currentStack.color, borderRadius: '50%' }} />
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '20px', background: `${currentStack.color}08`, borderRadius: '16px', border: `1px dashed ${currentStack.color}33` }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={14} color={currentStack.color} /> MENTOR GUIDANCE
                    </h4>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                      "{topicDetails.guidance}"
                    </p>
                  </div>

                  <button className="btn-grab" style={{ width: '100%', padding: '16px' }} onClick={() => setSelectedTopic(null)}>
                    Got it, Thanks!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .stack-button:hover {
          background: rgba(255,255,255,0.03);
          border-color: var(--border-medium);
        }
      `}</style>
    </div>
  );
};

export default TechRoadmaps;
