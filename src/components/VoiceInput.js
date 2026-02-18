import { useState, useRef, useEffect } from "react";
import VuesaxIcon from "./VuesaxIcon";
import ReactDOM from "react-dom";
import TaskHistory from "./TaskHistory"; // Import TaskHistory

const styles = {
  container: { position: "relative", display: "flex", alignItems: "center" },
  btn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default function VoiceInput({ 
  onTextReady, 
  darkMode, 
  className,
  history = [],
  isTyping = false,
  userProfile,
  onRestore,
  onDelete
}) {
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [visualData, setVisualData] = useState([20, 20, 20, 20, 20]); 
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(""); 
  const interimTranscriptRef = useRef(""); 
  const animationFrameRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef(null);

  const [sessionStartIndex, setSessionStartIndex] = useState(0);

  // Sync refs with props/state for access inside closures
  const isTypingRef = useRef(isTyping);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  const onTextReadyRef = useRef(onTextReady);
  useEffect(() => { onTextReadyRef.current = onTextReady; }, [onTextReady]);

  // --- 1. SETUP RECOGNITION ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
      startFakeVisualizer(); 
    };

    recognition.onresult = (event) => {
      // Use ref to check current typing state without restarting effect
      if (isTypingRef.current) return;

      isSpeakingRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      let newFinal = "";
      let newInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += transcript;
        } else {
          newInterim += transcript;
        }
      }
      
      if (newFinal) {
        finalTranscriptRef.current += newFinal + " "; 
      }
      
      setInterimTranscript(newInterim);
      interimTranscriptRef.current = newInterim; 
      
      // Debounce speaking visual
      if (window.speechTimer) clearTimeout(window.speechTimer);
      window.speechTimer = setTimeout(() => { isSpeakingRef.current = false; }, 500);

      // Auto-send silence timer
      silenceTimerRef.current = setTimeout(() => {
          submitText();
      }, 2500);
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      stopVisualizer();
      
      // Attempt to restart if we should be listening and not typing
      if (listeningRef.current && !isTypingRef.current) {
          try {
            recognition.start();
          } catch(e) { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopVisualizer();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentional: Only run once

  // Sync history ref
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  const listeningRef = useRef(listening);
  useEffect(() => { 
      listeningRef.current = listening; 
      
      if (listening) {
          // START SESSION
          setSessionStartIndex(historyRef.current.length); // Start showing history from now
          try {
              recognitionRef.current?.start();
          } catch(e) {}
      } else {
          // STOP SESSION
          recognitionRef.current?.stop();
      }
  }, [listening]);

  // Handle Pause/Resume for AI Typing
  useEffect(() => {
      if (!listening) return;

      if (isTyping) {
          recognitionRef.current?.stop();
          stopVisualizer();
      } else {
          try {
              recognitionRef.current?.start();
          } catch (e) {}
      }
  }, [isTyping, listening]);


  const submitText = () => {
      const fullText = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      if (fullText) {
          console.log("Submitting:", fullText);
          if (onTextReadyRef.current) onTextReadyRef.current(fullText);
          
          // Clear buffers
          finalTranscriptRef.current = "";
          interimTranscriptRef.current = "";
          setInterimTranscript("");
      }
  };

  const startFakeVisualizer = () => {
    const update = () => {
      setVisualData(prev => {
          return prev.map(val => {
              if (isSpeakingRef.current) {
                  const target = Math.random() * 60 + 40;
                  return val + (target - val) * 0.3; 
              } else {
                  const target = Math.random() * 20 + 10;
                  return val + (target - val) * 0.05; 
              }
          });
      });
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setVisualData([20, 20, 20, 20, 20]); 
    isSpeakingRef.current = false;
  };

  const toggleListening = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setListening(!listening);
  };

  // --- 3. RENDER ---
  const renderOverlay = () => {
    if (!listening) return null;

    // Filter history to show only current session
    // If sessionStartIndex is 5, slice(5) gives 5, 6, 7...
    const sessionHistory = history.slice(sessionStartIndex);

    const bg = darkMode ? '#000000' : '#ffffff';
    const fg = darkMode ? '#ffffff' : '#000000';

    return ReactDOM.createPortal(
      <div className="speech-mode-overlay" style={{ background: bg, color: fg }}>
        
        {/* Chat History Area */}
        <div className="speech-history-container" style={{ 
            flex: 1, 
            width: '100%',
            maxWidth: '600px', // constrain width on large screens
            margin: '0 auto', // center it
            overflowY: 'auto', 
            overflowX: 'hidden', // Prevent horizontal scroll
            padding: '10px', // Reduced from 20px
            boxSizing: 'border-box',
            paddingBottom: '220px', // More space for controls + transcript
            maskImage: `linear-gradient(to bottom, transparent, ${bg} 10%, ${bg} 90%, transparent)`, // Mask to fade edges
            WebkitMaskImage: `linear-gradient(to bottom, transparent, ${bg} 10%, ${bg} 90%, transparent)`
        }}>
            <TaskHistory 
                history={sessionHistory} 
                onRestore={onRestore} 
                onDelete={onDelete} 
                darkMode={darkMode}
                isTyping={isTyping}
                userProfile={userProfile}
            />
        </div>

        {/* Bottom Controls */}
        <div className="speech-bottom-controls" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: '40px',
            background: `linear-gradient(to top, ${bg} 80%, transparent)`,
            gap: '20px'
        }}>
             
            {/* Live Transcript (Displayed on screen as requested) */}
            <div style={{ 
                minHeight: '24px', 
                padding: '0 20px', 
                textAlign: 'center', 
                opacity: 0.7, 
                fontSize: '16px',
                color: fg 
            }}>
                {(finalTranscriptRef.current + " " + interimTranscript).trim()}
            </div>

            {/* Visualizer */}
            {!isTyping && (
                <div className="voice-visualizer" style={{ marginBottom: 0 }}>
                {visualData.map((height, i) => (
                    <div key={i} className="voice-bar" style={{ height: `${height}px`, background: '#c1121f' }} />
                ))}
                </div>
            )}

            {/* Status Text */}
            <div className="speech-status-text" style={{ fontSize: '18px', fontWeight: 600, color: fg, opacity: 0.8 }}>
                {isTyping ? "Astra is replying..." : "Listening..."}
            </div>

            {/* Stop Voice Button */}
            <button 
                onClick={toggleListening}
                style={{
                    background: '#c1121f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(193, 18, 31, 0.4)'
                }}
            >
                Stop voice
            </button>
        </div>
      </div>,
      document.body
    );
  };

  if (!isSupported) return null;

  return (
    <>
      <button type="button" onClick={toggleListening} style={styles.btn} className={className}>
        <VuesaxIcon name="microphone" variant="Linear" darkMode={darkMode} color={darkMode ? "#ffffff" : "#c1121f"} />
      </button>
      {renderOverlay()}
    </>
  );
}
