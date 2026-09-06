import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, ArrowRight, Loader2, AlertCircle, Zap, ShieldCheck, Globe } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { signIn, signUp, loginAsDemo } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn({ email, password });
        if (error) throw error;
      } else {
        const { error } = await signUp({ email, password, username });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (err) {
      console.warn('Auth error:', err);
      const isNetworkErr = err.message?.includes('fetch') || err.message?.includes('Network') || err.message?.includes('Failed');
      setError(
        isNetworkErr
          ? 'Cloud authentication endpoint unavailable. Click "Continue in Demo Mode" below to proceed offline!'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Aesthetic Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Header / Project Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '100px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            background: 'var(--primary)', 
            borderRadius: '6px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Zap size={18} color="#000" strokeWidth={3} />
          </div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '800', 
            letterSpacing: '-0.02em',
            color: 'var(--text-white)'
          }}>GrabIt AI</span>
        </div>
        <h1 className="shimmer-text" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Next-Gen Interview Intelligence
        </h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grab-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '12px', 
            borderRadius: '16px', 
            background: 'var(--primary-soft)',
            marginBottom: '16px'
          }}>
            {isLogin ? <LogIn className="text-primary" size={32} /> : <UserPlus className="text-primary" size={32} />}
          </div>
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            {isLogin ? 'Enter your credentials to continue your prep' : 'Start your journey to your dream job today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="input-group"
            >
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <UserPlus style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
                <input 
                  type="text" 
                  required={!isLogin}
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    color: 'var(--text-white)',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </motion.div>
          )}

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
              <input 
                type="email" 
                required 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  color: 'var(--text-white)',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  color: 'var(--text-white)',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fca5a5',
                  fontSize: '13px'
                }}
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-grab" 
            style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '16px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Get Started'}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          <button 
            type="button" 
            onClick={() => loginAsDemo(email, username)}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={18} /> Continue in Demo / Guest Mode
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '14px', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>

      {/* Footer Details */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ 
          marginTop: '48px', 
          textAlign: 'center', 
          zIndex: 1,
          color: 'var(--text-dim)',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            <span>Secure Enterprise Login</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} />
            <span>Global AI Infrastructure</span>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%', maxWidth: '300px' }}>
          <p style={{ marginBottom: '4px' }}>
            &copy; 2026 <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Neural Nexus</span>. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', opacity: 0.6 }}>
            <span>v2.0.4-stable</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
            <span>Neural Nexus Team</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
