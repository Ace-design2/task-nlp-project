import React, { useState } from 'react';
import './LandingPage.css';
import VuesaxIcon from './VuesaxIcon';

function LandingPage({ onLoginClick, darkMode }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleJoinWaitlist = (e) => {
    e.preventDefault();
    if (email) {
      // In a real app, send to backend here
      console.log("Joined waitlist with:", email);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className={`lp-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="lp-header">
        <button 
          className="lp-logo" 
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={(e) => e.preventDefault()}
        >
          <img src="/Astra%20logo.svg" alt="Astra Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          Astra To-Do
        </button>
        <div className="lp-nav-actions">
          <button className="lp-btn lp-btn-login" onClick={onLoginClick}>
            Login
          </button>
          <a href="#waitlist" className="lp-btn lp-btn-primary">
            Get Early Access
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-badge">Your Smart AI Task Assistant</div>
          <h1 className="lp-title">
            Stop juggling tasks. Start getting things done — <span>effortlessly.</span>
          </h1>
          <p className="lp-subtitle">
            Astra To-Do is an intelligent task manager powered by conversational AI and voice commands. Plan your day, create tasks naturally, and stay focused with a smart dashboard designed to keep you productive — without the stress.
          </p>
          <a href="#waitlist" className="lp-btn lp-btn-primary lp-btn-hero">
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* How it Works / Core Features */}
      <section className="lp-section lp-features-section" style={{ background: darkMode ? '#0a0a0a' : '#fff' }}>
        <h2 className="lp-section-title">Work Smarter. Not Harder.</h2>
        <p className="lp-subtitle" style={{ textAlign: 'center' }}>
          Managing tasks shouldn’t feel like a chore. Astra To-Do helps you organize your life using simple language and natural conversation — just like talking to a personal assistant.
        </p>
        
        <div className="lp-grid" style={{ marginTop: '60px' }}>
          {/* Feature 1 */}
          <div className="lp-card">
            <div className="lp-icon-wrapper">
              <VuesaxIcon name="message-text" variant="Bold" size={24} />
            </div>
            <h3 className="lp-card-title">Natural Language Task Creation</h3>
            <p className="lp-card-text">
              Create tasks the way you speak. Astra understands and schedules everything instantly.
            </p>
            <div className="lp-card-example">
              "Meeting with John tomorrow at 2pm"
            </div>
            <div className="lp-card-example" style={{ marginTop: '10px' }}>
              "Submit assignment by Friday evening"
            </div>
          </div>

          {/* Feature 2 */}
          <div className="lp-card">
            <div className="lp-icon-wrapper">
              <VuesaxIcon name="microphone-2" variant="Bold" size={24} />
            </div>
            <h3 className="lp-card-title">Voice Commands</h3>
            <p className="lp-card-text">
              Create, manage, and review tasks hands-free using voice input — perfect when you’re busy or on the move.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="lp-card">
            <div className="lp-icon-wrapper">
              <VuesaxIcon name="magic-star" variant="Bold" size={24} />
            </div>
            <h3 className="lp-card-title">Conversational AI</h3>
            <p className="lp-card-text">
              Ask Astra about your day, task stats, upcoming deadlines, or simply say hello. Your productivity companion, always available.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="lp-card">
             <div className="lp-icon-wrapper">
              <VuesaxIcon name="category" variant="Bold" size={24} />
            </div>
            <h3 className="lp-card-title">Smart Dashboard</h3>
            <p className="lp-card-text">
              See exactly what matters today. Track progress, priorities, and deadlines in one clean, focused view.
            </p>
          </div>
        </div>
      </section>

      {/* Why Astra List */}
      <section className="lp-why-section">
        <h2 className="lp-title" style={{ color: '#fff', fontSize: '40px' }}>Why Astra To-Do?</h2>
        <ul className="lp-check-list">
          <li className="lp-check-item">Simple & intuitive</li>
          <li className="lp-check-item">AI-powered planning</li>
          <li className="lp-check-item">Lightning-fast task creation</li>
          <li className="lp-check-item">Designed for focus</li>
          <li className="lp-check-item">Clean, modern interface</li>
          <li className="lp-check-item">Works across all devices</li>
        </ul>
        
        <div style={{ marginTop: '80px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>Built For People Who Want More From Their Time</h3>
          <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            Students • Professionals • Entrepreneurs • Creatives • Teams<br/>
            <strong>Anyone tired of messy to-do lists</strong>
          </p>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="lp-cta-section">
        <div className="lp-waitlist-box">
          <div className="lp-icon-wrapper" style={{ margin: '0 auto 20px auto', background: 'rgba(193, 18, 31, 0.1)', width: '64px', height: '64px', borderRadius: '20px' }}>
            <span style={{ fontSize: '32px' }}>🚀</span>
          </div>
          <h2 className="lp-title" style={{ fontSize: '36px', marginBottom: '16px' }}>Early Access Is Coming Soon</h2>
          <p className="lp-subtitle" style={{ fontSize: '16px', marginBottom: '30px' }}>
            We’re currently building something special. Join the waitlist to get early access, receive exclusive feature updates, be the first to try new AI tools, and help shape Astra with feedback.
          </p>
          
          <form onSubmit={handleJoinWaitlist}>
            <div className="lp-input-group">
              <input 
                type="email" 
                className="lp-input" 
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="lp-btn lp-btn-primary lp-btn-submit">
                {submitted ? 'Joined!' : 'Join Waitlist'}
              </button>
            </div>
            <p className="lp-input-hint">No spam. Unsubscribe anytime.</p>
          </form>
        </div>
      </section>

      {/* What Makes It Different / Coming Soon */}
      <section className="lp-section" style={{ textAlign: 'center', maxWidth: '800px', paddingBottom: '100px' }}>
        <h2 className="lp-section-title" style={{ marginBottom: '24px' }}>What Makes Astra Different?</h2>
        <p className="lp-subtitle">
          Unlike traditional task managers, Astra understands context, conversation, and intent — allowing you to interact naturally instead of filling out rigid forms.
          <br/><br/><strong>You focus on what matters. Astra handles the rest.</strong>
        </p>

        <h3 style={{ marginTop: '80px', fontSize: '24px', marginBottom: '30px' }}>Coming Soon Features</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
          {['Smart reminders', 'AI scheduling suggestions', 'Task analytics', 'Calendar integration', 'Team collaboration'].map(feature => (
            <span key={feature} style={{ padding: '10px 20px', background: darkMode ? '#1a1a1a' : '#f0f0f0', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
              {feature}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <p>© {new Date().getFullYear()} Astra To-Do. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
