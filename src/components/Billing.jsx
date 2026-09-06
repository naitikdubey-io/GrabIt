import React, { useState } from 'react';
import { Check, Zap, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Billing = () => {
  const [selectedPlan, setSelectedPlan] = useState('Professional');

  const plans = [
    {
      name: 'Starter',
      price: '0',
      description: 'Ideal for getting started with basic interview simulations.',
      features: ['3 AI Interviews / month', 'Standard AI feedback', 'Access to 100+ questions', 'Community forums'],
      icon: Zap,
      color: 'var(--text-dim)',
      btn: 'Current Plan',
      current: true
    },
    {
      name: 'Professional',
      price: '19',
      description: 'Comprehensive prep for serious job seekers.',
      features: ['Unlimited AI Interviews', 'Advanced behavioral insights', 'Resume optimization tools', 'Personalized roadmap', 'Priority server access'],
      icon: Crown,
      color: 'var(--primary)',
      btn: 'Go Professional',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '49',
      description: 'Custom solutions for organizations and large cohorts.',
      features: ['Custom AI model training', 'Admin team dashboard', 'Advanced cohort analytics', 'API access & integrations', 'Dedicated support'],
      icon: ShieldCheck,
      color: 'var(--accent-indigo)',
      btn: 'Contact Sales'
    }
  ];

  return (
    <div className="billing-content">
      <header style={{ marginBottom: '64px', textAlign: 'center' }}>
        <div className="pill-grab" style={{ margin: '0 auto 24px' }}>
          <Crown size={14} /> Professional Grade Preparation
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.04em' }}>
          Unlock Your <span className="shimmer-text">Full Potential</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Choose the performance tier that matches your career ambitions.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {plans.map((plan, index) => {
          const isSelected = selectedPlan === plan.name;
          return (
          <motion.div
            key={plan.name}
            className="grab-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedPlan(plan.name)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              borderColor: isSelected ? 'var(--primary)' : 'var(--border-medium)',
              borderWidth: isSelected ? '2px' : '1px',
              padding: '40px 32px',
              cursor: 'pointer'
            }}
          >
            {plan.popular && (
              <div style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                background: 'var(--primary)', 
                color: '#000', 
                padding: '4px 10px', 
                fontSize: '10px', 
                fontWeight: '800', 
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                POPULAR
              </div>
            )}
            
            <div style={{ marginBottom: '32px' }}>
              <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-dim)', marginBottom: '20px', transition: 'color 0.3s ease' }}>
                <plan.icon size={32} />
              </div>
              <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{plan.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                <span style={{ fontSize: '40px', fontWeight: '800' }}>${plan.price}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>/month</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>{plan.description}</p>
            </div>

            <div style={{ flex: 1, marginBottom: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', alignItems: 'flex-start' }}>
                    <Check size={16} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-dim)', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-main)' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className={isSelected ? 'btn-grab' : 'btn-dark'} 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={plan.current}
            >
              {plan.btn} {isSelected && <ArrowRight size={16} />}
            </button>
          </motion.div>
          )
        })}
      </div>

      <div style={{ marginTop: '80px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
          Custom requirements? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>Speak with our engineering team</span>
        </p>
      </div>
    </div>
  );
};

export default Billing;
