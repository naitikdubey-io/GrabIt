import React from 'react';
import { LayoutDashboard, MessageSquare, Mic, BookOpen, History, CreditCard, Sparkles, LogOut, Settings, Briefcase, Zap, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab, onBackToLanding }) => {
  const { signOut, user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chatbot', label: 'AI Assistant', icon: MessageSquare },
    { id: 'practice', label: 'AI Practice', icon: Mic },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'tech_roadmaps', label: 'Tech Roadmaps', icon: Layers },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'history', label: 'Performance', icon: History },
    { id: 'roadmap', label: 'Growth Plan', icon: Sparkles },
    { id: 'billing', label: 'GrabIt Pro', icon: CreditCard },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onBackToLanding();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="sidebar-grab">
      <div 
        style={{ padding: '0 12px 48px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        onClick={onBackToLanding}
      >
        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
          <Zap size={20} color="#000" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.04em', color: 'var(--text-white)' }}>GrabIt</h2>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-grab ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{ position: 'relative' }}
          >
            <item.icon size={18} style={{ opacity: activeTab === item.id ? 1 : 0.7 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {activeTab === item.id && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-medium)', paddingTop: '24px' }}>
        {user && (
          <div style={{ padding: '0 16px 12px 16px', fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Logged in as: <br/>
            <span style={{ color: 'var(--text-muted)', textTransform: 'none' }}>{user.email}</span>
          </div>
        )}
        <div className="nav-grab">
          <Settings size={18} />
          <span>Settings</span>
        </div>
        <div className="nav-grab" style={{ color: '#f87171' }} onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
