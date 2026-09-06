import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { ArrowRight, Mic, BookOpen, Target, Sparkles, Briefcase, Zap, Star, Shield, Cpu, Globe, Activity, CheckCircle2 } from 'lucide-react';
import Billing from './Billing';

const TiltCard = ({ children, className, style }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
        ...style
      }}
      className={className}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.08) 0%, transparent 60%)`,
          zIndex: 10,
          pointerEvents: "none"
        }}
      />
      <div style={{ transform: "translateZ(30px)", height: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
};

const LandingPage = ({ onGetStarted }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  
  const handleMouseMove = (e) => {
    setMousePos({
      x: (e.clientX - window.innerWidth / 2) / 50,
      y: (e.clientY - window.innerHeight / 2) / 50
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* Refined Ambient Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div 
          animate={{ 
            x: mousePos.x * 3, 
            y: mousePos.y * 3,
          }}
          style={{ 
            position: 'absolute', top: '-10%', left: '10%', width: '50vw', height: '50vw', 
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)', 
            filter: 'blur(100px)'
          }} 
        />
        <motion.div 
          animate={{ 
            x: -mousePos.x * 2, 
            y: -mousePos.y * 2,
          }}
          style={{ 
            position: 'absolute', bottom: '-10%', right: '10%', width: '40vw', height: '40vw', 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)', 
            filter: 'blur(100px)'
          }} 
        />
      </div>

      <nav style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(10px)' }}>
        <div className="container-wide" style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
              <Zap size={22} color="#000" strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.04em' }}>GrabIt</h2>
          </div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <button className="btn-dark" style={{ border: 'none', background: 'none', color: 'var(--text-muted)' }}>Pricing</button>
            <button className="btn-dark" style={{ border: 'none', background: 'none', color: 'var(--text-muted)' }}>Docs</button>
            <button className="btn-grab" onClick={() => onGetStarted()}>
              Launch Platform <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      <motion.div 
        className="container-wide"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ paddingTop: '100px', position: 'relative', zIndex: 5, paddingBottom: '100px' }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '200px' }}>
          <motion.div variants={itemVariants} className="pill-grab" style={{ marginBottom: '24px' }}>
             <Sparkles size={14} /> Next-Gen Career Intelligence
          </motion.div>
          <motion.h1 
            variants={itemVariants}
            style={{ fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: '800', maxWidth: '1000px', margin: '0 auto 24px', lineHeight: '0.95', letterSpacing: '-0.05em' }}
          >
            Grab your future with <br />
            <span className="shimmer-text">AI Precision</span>
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            style={{ fontSize: '20px', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 48px', lineHeight: '1.6' }}
          >
            Engineering the ultimate interview simulation. GrabIt combines behavioral neuro-analytics with industry-leading AI to ensure you land the offer.
          </motion.p>
          
          <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="btn-grab" onClick={onGetStarted} style={{ padding: '16px 40px', fontSize: '18px' }}>
              Get Started for Free
            </button>
            <button className="btn-dark" style={{ padding: '16px 40px', fontSize: '18px' }}>
              View Case Studies
            </button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '200px' }}>
           {[
             { title: "Neural Interviews", desc: "Adaptive AI personas that evolve based on your technical depth and communication style.", icon: Cpu, color: 'var(--primary)' },
             { title: "Vector Matching", desc: "Real-time opportunity tracking that maps your skills to active global high-tier roles.", icon: Globe, color: 'var(--accent-indigo)' },
             { title: "Quantum Feedback", desc: "Deep-level structural analysis of your answers with actionable delta-improvement metrics.", icon: Activity, color: 'var(--accent-cyan)' }
           ].map((f, i) => (
             <motion.div variants={itemVariants} key={i}>
               <TiltCard className="grab-card" style={{ padding: '40px' }}>
                 <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '24px', border: '1px solid var(--border-medium)' }}>
                   <f.icon size={24} />
                 </div>
                 <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>{f.title}</h3>
                 <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '15px' }}>{f.desc}</p>
               </TiltCard>
             </motion.div>
           ))}
        </div>

        {/* Professional Trust Section */}
        <div style={{ textAlign: 'center', marginBottom: '200px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '48px' }}>Powering candidates at</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '64px', opacity: 0.4, filter: 'grayscale(100%) brightness(200%)' }}>
             {/* Mock Logos */}
             <div style={{ fontSize: '24px', fontWeight: '900' }}>GOOGLE</div>
             <div style={{ fontSize: '24px', fontWeight: '900' }}>META</div>
             <div style={{ fontSize: '24px', fontWeight: '900' }}>STRIPE</div>
             <div style={{ fontSize: '24px', fontWeight: '900' }}>OPENAI</div>
             <div style={{ fontSize: '24px', fontWeight: '900' }}>APPLE</div>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '200px' }}>
          {[
            { name: "Alex Rivera", role: "L6 SWE at Google", text: "The behavioral analytics in GrabIt are frighteningly accurate. It caught nuances in my structural delivery that human mentors missed.", avatar: "AR" },
            { name: "Lin Zhang", role: "Product Manager at Stripe", text: "GrabIt transformed my preparation from 'hoping for the best' to 'executing a strategy'. It's the highest ROI tool in my career stack.", avatar: "LZ" }
          ].map((t, i) => (
            <motion.div variants={itemVariants} key={i}>
              <div className="grab-card" style={{ padding: '40px' }}>
                <p style={{ fontSize: '18px', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '32px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--primary-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', fontSize: '14px' }}>{t.avatar}</div>
                  <div>
                    <h4 style={{ fontSize: '16px' }}>{t.name}</h4>
                    <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Interview Practice Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center', marginBottom: '200px' }}>
          <motion.div variants={itemVariants}>
            <TiltCard className="grab-card" style={{ padding: '32px', minHeight: '380px', background: 'rgba(10, 10, 12, 0.9)' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>AI Interviewer</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-white)', lineHeight: '1.5' }}>
                  "Tell me about a time when you had to work with a difficult team member."
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>Your Answer</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  "In my previous role, I worked with a colleague who often missed deadlines. I decided to have a 1-on-1 chat to understand their challenges..."
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-white)' }}>Clarity</span>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>8/10</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '80%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }} 
                  />
                </div>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1' }}>
              AI Interview <br />
              <span style={{ color: 'var(--primary)' }}>Practice</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '500px' }}>
              Practice with realistic interview scenarios powered by advanced AI. Get instant feedback on your answers, identify areas for improvement, and build confidence for any interview situation.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                "Behavioral and situational questions",
                "Real-time feedback and scoring",
                "Industry-specific scenarios"
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--text-main)', fontWeight: '500' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Precision Performance Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '200px' }}>
          <motion.div variants={itemVariants}>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1' }}>
              Precision <br />
              <span style={{ color: 'var(--primary)' }}>Performance Analytics</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '500px' }}>
              Our AI engine dissects your interview performance with surgical precision, providing deep insights into your technical depth and behavioral delivery.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { text: "Detailed analysis of where you excelled", icon: Sparkles },
                { text: "Critical identification of areas where you lacked", icon: Target },
                { text: "Actionable roadmap for improvement", icon: Zap }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={20} />
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--text-main)', fontWeight: '500' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <TiltCard className="grab-card" style={{ padding: '32px', minHeight: '420px', background: 'linear-gradient(145deg, rgba(10, 10, 12, 0.8) 0%, rgba(5, 5, 7, 0.9) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                   <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Live Performance Report</h4>
                </div>
                <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '100px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  Overall: 84%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Excelled */}
                <div style={{ background: 'rgba(16, 185, 129, 0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Sparkles size={14} /> EXCELLED
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Strong system design fundamentals and clear articulation of scalability trade-offs.</p>
                </div>

                {/* Lacked */}
                <div style={{ background: 'rgba(239, 68, 68, 0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Target size={14} /> AREAS LACKED
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Initial responses to behavioral questions lacked the STAR method structure.</p>
                </div>

                {/* Improvement */}
                <div style={{ background: 'rgba(99, 102, 241, 0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Zap size={14} /> IMPROVEMENT
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Focus on quantifying impact in your professional experience descriptions.</p>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>

        {/* Billing */}
        <div id="pricing" style={{ marginBottom: '200px' }}>
          <Billing />
        </div>

        {/* Premium Footer */}
        <footer style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', marginBottom: '60px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#000" strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '20px' }}>GrabIt</h3>
              </div>
              <p style={{ color: 'var(--text-dim)', maxWidth: '300px', fontSize: '14px', lineHeight: '1.6' }}>The professional standard for AI-driven career acceleration. Grab your future today.</p>
            </div>
            {['Product', 'Company', 'Legal'].map((col) => (
              <div key={col}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-white)', marginBottom: '20px' }}>{col}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-dim)', fontSize: '13px' }}>
                  <span>Link Item</span>
                  <span>Link Item</span>
                  <span>Link Item</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '12px', paddingBottom: '40px' }}>
            <p>© 2026 GrabIt AI. Built for the ambitious.</p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default LandingPage;
