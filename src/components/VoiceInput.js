import { useState, useRef, useEffect, useCallback } from "react";
import VuesaxIcon from "./VuesaxIcon";
import ReactDOM from "react-dom";
import TaskHistory from "./TaskHistory"; 

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
  const [isSpeaking, setIsSpeaking] = useState(false); // TTS State

  // Sync refs with props/state for access inside closures
  const isTypingRef = useRef(isTyping);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  const onTextReadyRef = useRef(onTextReady);
  useEffect(() => { onTextReadyRef.current = onTextReady; }, [onTextReady]);

  // Sync history ref
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  const listeningRef = useRef(listening);
  useEffect(() => { listeningRef.current = listening; }, [listening]);

  // --- HELPER FUNCTIONS ---

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setVisualData([20, 20, 20, 20, 20]); 
    isSpeakingRef.current = false;
  }, []);

  const startFakeVisualizer = useCallback((isAi = false) => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    const update = () => {
      setVisualData(prev => {
          return prev.map(val => {
              // Activity Trigger: User speaking (ref) OR AI speaking (arg)
              const active = isSpeakingRef.current || isAi; 

              if (active) {
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
  }, []);

  const submitText = useCallback(() => {
      const fullText = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      if (fullText) {
          console.log("Submitting:", fullText);
          if (onTextReadyRef.current) onTextReadyRef.current(fullText);
          
          // Clear buffers
          finalTranscriptRef.current = "";
          interimTranscriptRef.current = "";
          setInterimTranscript("");
      }
  }, []);

  const speak = useCallback((text) => {
      // cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => {
          setIsSpeaking(true);
          startFakeVisualizer(true); // true = ai speaking
      };
      utterance.onend = () => {
          setIsSpeaking(false);
          // Mic will auto-restart via the control loop effect
      };
      utterance.onerror = () => {
          setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
  }, [startFakeVisualizer]);

  // --- EFFECT: TTS (Watch History) ---
  const lastHistoryLengthRef = useRef(history.length);
  useEffect(() => {
     if (history.length > lastHistoryLengthRef.current) {
         const lastMsg = history[history.length - 1];
         // If it's AI, speak it -- BUT ONLY IF LISTENING (Voice Mode Active)
         if (lastMsg.sender === 'ai' && listeningRef.current) {
             speak(lastMsg.text);
         }
     }
     lastHistoryLengthRef.current = history.length;
  }, [history, speak]);


  // --- EFFECT: SETUP RECOGNITION ---
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
      startFakeVisualizer(false); 
    };

    // Enhanced triggers for visualizer
    recognition.onsoundstart = () => {
        isSpeakingRef.current = true;
    };
    recognition.onspeechstart = () => {
        isSpeakingRef.current = true;
    };
    recognition.onsoundend = () => {
        // Don't immediately stop, let debounce handle it
    };
    recognition.onspeechend = () => {
         // Don't immediately stop
    };

    recognition.onresult = (event) => {
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
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopVisualizer();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [startFakeVisualizer, stopVisualizer, submitText]); 


  // --- EFFECT: CONTROL LOOP (Listening vs Typing vs Speaking) ---
  // listeningRef is defined at top
  useEffect(() => { 
      // listeningRef.current is updated at top, but we can update it here too or just rely on top
      // The logic below relies on 'listening' prop/state change
      if (listening) {
          setSessionStartIndex(historyRef.current.length);
          try { recognitionRef.current?.start(); } catch(e) {}
      } else {
          recognitionRef.current?.stop();
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
      }
  }, [listening]);

  useEffect(() => {
      if (!listening) return;

      // If AI is Thinking OR Speaking -> Stop Mic
      if (isTyping || isSpeaking) {
          try { recognitionRef.current?.stop(); } catch(e) {}
          
          if (!isSpeaking) {
             stopVisualizer(); 
          }
      } else {
          // AI finished Interactions -> Start Mic
          console.log("Ready for input, starting mic...");
          stopVisualizer(); // Reset to idle visual

          const timer = setTimeout(() => {
              try {
                  recognitionRef.current?.start();
              } catch(e) { /* ignore */ }
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [listening, isTyping, isSpeaking, stopVisualizer]);


  const toggleListening = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setListening(!listening);
  };

  // --- RENDER ---
  const renderOverlay = () => {
    if (!listening) return null;

    const sessionHistory = history.slice(sessionStartIndex);
    const bg = darkMode ? '#000000' : '#ffffff';
    const fg = darkMode ? '#ffffff' : '#000000';

    return ReactDOM.createPortal(
      <div className="speech-mode-overlay" style={{ background: bg, color: fg }}>
        
        {/* Chat History Area */}
        <div className="speech-history-container" style={{ 
            flex: 1, 
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            overflowY: 'auto', 
            overflowX: 'hidden',
            padding: '10px',
            boxSizing: 'border-box',
            paddingBottom: '220px', 
            maskImage: `linear-gradient(to bottom, transparent, ${bg} 10%, ${bg} 90%, transparent)`,
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
             
            {/* Live Transcript */}
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
        <div className="voice-mode-pill">
            <span className="voice-mode-text">Voice Mode</span>
            <VuesaxIcon name="microphone" variant="Bold" color="#ffffff" size={16} />
        </div>
      </button>
      {renderOverlay()}
    </>
  );
}
