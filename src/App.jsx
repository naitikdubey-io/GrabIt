import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIChatbot from './components/AIChatbot';
import InterviewPractice from './components/InterviewPractice';
import PracticeQuestions from './components/PracticeQuestions';
import SingleQuestionPractice from './components/SingleQuestionPractice';
import History from './components/History';
import ImprovementRoadmap from './components/ImprovementRoadmap';
import Billing from './components/Billing';
import LandingPage from './components/LandingPage';
import Opportunities from './components/Opportunities';
import TechRoadmaps from './components/TechRoadmaps';
import Auth from './components/Auth';

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [drillTopic, setDrillTopic] = useState(null);

  // Handle user login state
  useEffect(() => {
    if (user) {
      setShowLanding(false);
      setShowAuth(false);
    }
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onStartPractice={() => { setDrillTopic(null); setActiveTab('practice'); }} />;
      case 'chatbot': return <AIChatbot />;
      case 'practice': return (
        <InterviewPractice 
          topic={drillTopic} 
          onComplete={() => {
            setDrillTopic(null);
            setActiveTab('history');
          }} 
        />
      );

      case 'single_practice': return <SingleQuestionPractice question={selectedQuestion} onComplete={() => setActiveTab('questions')} />;
      case 'questions': return <PracticeQuestions onStartPractice={(q) => { setSelectedQuestion(q); setActiveTab('single_practice'); }} />;
      case 'opportunities': return <Opportunities />;
      case 'history': return <History />;
      case 'roadmap': return (
        <ImprovementRoadmap 
          onStartPractice={(topic) => {
            setDrillTopic(topic);
            setActiveTab('practice');
          }} 
        />
      );
      case 'tech_roadmaps': return (
        <TechRoadmaps 
          onStartPractice={(topic) => {
            setDrillTopic(topic);
            setActiveTab('practice');
          }} 
          onStartSinglePractice={(topic) => {
            setSelectedQuestion(topic);
            setActiveTab('single_practice');
          }}
        />
      );
      case 'billing': return <Billing />;
      default: return <Dashboard />;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 }
  };

  if (showLanding && !user) {
    return <LandingPage onGetStarted={() => {
      setShowLanding(false);
      setShowAuth(true);
    }} />;
  }

  if (showAuth && !user) {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowLanding(true)}
          style={{ 
            position: 'absolute', top: '20px', left: '20px', 
            background: 'none', border: 'none', color: 'var(--text-muted)', 
            cursor: 'pointer', zIndex: 10 
          }}
        >
          ← Back to Landing
        </button>
        <Auth />
      </div>
    );
  }

  if (!user) {
    // Fallback if somehow they aren't on landing or auth but aren't logged in
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div className="app-root">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onBackToLanding={() => {
          // If logged in, maybe just go to dashboard or handle logout
          setActiveTab('dashboard');
        }}
      />
      <main className="main-grab">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
