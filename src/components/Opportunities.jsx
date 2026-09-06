import React from 'react';
import { Briefcase, MapPin, DollarSign, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Opportunities = () => {
  const jobs = [
    { id: 1, title: 'Senior Frontend Engineer', company: 'TechFlow AI', location: 'Remote', salary: '$140k - $180k', match: 94, tags: ['React', 'TypeScript', 'Node.js'] },
    { id: 2, title: 'Product UI/UX Designer', company: 'GrabIt Studios', location: 'New York, NY', salary: '$110k - $150k', match: 88, tags: ['Figma', 'Prototyping', 'User Research'] },
    { id: 3, title: 'Full Stack Developer', company: 'Nexus Systems', location: 'Austin, TX', salary: '$130k - $160k', match: 82, tags: ['Next.js', 'PostgreSQL', 'AWS'] },
    { id: 4, title: 'Junior React Developer', company: 'Innovate Labs', location: 'Remote', salary: '$80k - $110k', match: 96, tags: ['JavaScript', 'Tailwind', 'Git'] },
  ];

  return (
    <div className="opportunities-content animate-fade-in">
      <header style={{ marginBottom: '60px' }}>
        <div className="pill-grab" style={{ marginBottom: '16px' }}>
          <ShieldCheck size={14} /> AI-Verified Opportunities
        </div>
        <h1 style={{ fontSize: '48px', marginBottom: '12px', fontWeight: '900' }}>
          Match Your <span style={{ color: 'var(--primary)' }}>Skills</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Active roles matching your current interview performance and skills.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {jobs.map((job, index) => (
          <motion.div
            key={job.id}
            className="grab-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '40px', alignItems: 'center', padding: '32px 40px' }}
          >
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                <Briefcase size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '24px' }}>{job.title}</h3>
                  <div className="pill-grab" style={{ fontSize: '11px', padding: '4px 10px' }}>{job.match}% MATCH</div>
                </div>
                <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {job.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> {job.salary}</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{job.company}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-grab" style={{ padding: '12px', justifyContent: 'center' }}>
                Prepare for Interview <Zap size={16} />
              </button>
              <button className="btn-dark" style={{ padding: '12px', justifyContent: 'center', fontSize: '13px' }}>
                View Job Details <ArrowUpRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Opportunities;
