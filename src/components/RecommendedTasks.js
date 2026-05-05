import React from 'react';
import './RecommendedTasks.css';
import { motion, AnimatePresence } from 'framer-motion';

const RecommendedTasks = ({ recommendations, onAdd, onDismiss, darkMode }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div 
      className={`recommended-tasks-container ${darkMode ? 'dark-mode' : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="recommended-header">
        <h3 className={`recommended-title ${darkMode ? 'dark-mode' : ''}`}>
          Suggested for you
        </h3>
      </div>
      
      <div className="recommended-list">
        <AnimatePresence>
          {recommendations.map((rec, index) => (
            <motion.div 
              key={rec.title + index}
              className={`recommended-card ${darkMode ? 'dark-mode' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div className="recommended-info">
                <span className={`recommended-task-title ${darkMode ? 'dark-mode' : ''}`}>
                  {rec.title}
                </span>
                <span className={`recommended-task-reason ${darkMode ? 'dark-mode' : ''}`}>
                  {rec.reason}
                </span>
              </div>
              <div className="recommended-actions">
                <button 
                  className={`recommended-btn add-btn ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => onAdd(rec.title)}
                  title="Add Task"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <button 
                  className={`recommended-btn dismiss-btn ${darkMode ? 'dark-mode' : ''}`}
                  onClick={() => onDismiss(rec.title)}
                  title="Dismiss"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RecommendedTasks;
