import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypewriterText = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef(null);
  const chunksRef = useRef([]);
  const requestRef = useRef(null);

  useEffect(() => {
    // 1. Prepare chunks (split by space to preserve words)
    // We retain delimiters so we can reconstruct the sentence exactly.
    chunksRef.current = text.split(/(\s+)/);
    
    // 2. Initialize State
    setDisplayedText('');
    setIsAnimating(true);
    startTimeRef.current = performance.now();

    // 3. Animation Loop
    const animate = (time) => {
      const elapsed = time - startTimeRef.current;
      const chunksToShow = Math.floor(elapsed / speed);
      
      const allChunks = chunksRef.current;
      
      if (chunksToShow >= allChunks.length) {
        setDisplayedText(text); // Show full text
        setIsAnimating(false);
        return; // Stop loop
      }

      // Slice logic
      const currentString = allChunks.slice(0, chunksToShow).join('');
      setDisplayedText(currentString);
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [text, speed]);

  return (
    <div className="typewriter-text">
       <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {displayedText}
       </ReactMarkdown>
       {isAnimating && (
         <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '14px', 
            backgroundColor: '#c1121f', 
            marginLeft: '4px',
            verticalAlign: 'middle',
            animation: 'blink 1s infinite' 
         }}></span>
       )}
       <style>{`
         @keyframes blink {
           0%, 100% { opacity: 1; }
           50% { opacity: 0; }
         }
       `}</style>
    </div>
  );
};

export default TypewriterText;
