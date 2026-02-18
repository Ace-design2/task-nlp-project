import { useState, useRef, useEffect } from "react";
import VuesaxIcon from "./VuesaxIcon";
import ReactDOM from "react-dom"; // Import ReactDOM for Portal

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

export default function VoiceInput({ onTextReady, darkMode, className }) {
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  // Visualization State: 5 bars, values 0-100
  const [visualData, setVisualData] = useState([20, 20, 20, 20, 20]); 
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(""); // Stores confirmed text
  const interimTranscriptRef = useRef(""); // Stores latest interim text for onend access
  const animationFrameRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // CHANGED: Keep listening even if user pauses
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      finalTranscriptRef.current = "";
      startFakeVisualizer(); 
    };

    // Trigger animation when sound/speech is detected
    recognition.onsoundstart = () => { isSpeakingRef.current = true; };
    recognition.onspeechstart = () => { isSpeakingRef.current = true; };
    recognition.onspeechend = () => { isSpeakingRef.current = false; };

    recognition.onresult = (event) => {
      isSpeakingRef.current = true;
      
      // Clear any existing silence timer since we got new input
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
      interimTranscriptRef.current = newInterim; // Sync ref
      
      // Debounce the stop of speaking visual
      if (window.speechTimer) clearTimeout(window.speechTimer);
      window.speechTimer = setTimeout(() => {
          isSpeakingRef.current = false;
      }, 500);

      // Set new silence timer to auto-send after 2.5 seconds of no new results
      silenceTimerRef.current = setTimeout(() => {
          console.log("Silence detected, stopping...");
          stopRecognition();
      }, 2500);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Just stop quietly if no speech detected
        stopRecognition();
        return;
      }
      stopRecognition();
      if (event.error === "network") {
        alert("Network error. Check internet connection.");
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied.");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
      stopVisualizer();
      
      // Process final text using the REF, so no dependency needed
      const fullText = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      
      if (fullText) {
        console.log("Auto-sending:", fullText);
        onTextReady(fullText);
      }
      
      // Reset state for next time
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      finalTranscriptRef.current = "";
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopVisualizer();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [onTextReady]); 

  const startFakeVisualizer = () => {
    const update = () => {
      setVisualData(prev => {
          return prev.map(val => {
              if (isSpeakingRef.current) {
                  // Active: deeply fluctuating between 40 and 100
                  const target = Math.random() * 60 + 40;
                  return val + (target - val) * 0.3; // Faster response
              } else {
                  // Idle: gently breathing between 10 and 30
                  const target = Math.random() * 20 + 10;
                  return val + (target - val) * 0.05; // Slow breathing
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

  const stopRecognition = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  const toggleListening = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!recognitionRef.current) return;

    if (listening) {
      stopRecognition();
    } else {
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setListening(false);
      }
    }
  };

  // Portal for Speech Mode Overlay
  const renderOverlay = () => {
    if (!listening) return null;

    return ReactDOM.createPortal(
      <div className="speech-mode-overlay">
        <button className="close-speech-btn" onClick={toggleListening}>
          <VuesaxIcon
            name="close-circle"
            variant="Linear"
            size={32}
            darkMode={darkMode}
            color={darkMode ? "#ffffff" : "#333333"}
          />
        </button>

        <div className="voice-visualizer">
           {visualData.map((height, i) => (
             <div 
                key={i} 
                className="voice-bar" 
                style={{ height: `${height}px` }} 
             />
           ))}
        </div>

        <div className="speech-status-text">Listening...</div>

        <div className="live-transcript">
          {(finalTranscriptRef.current + " " + interimTranscript).trim() || "Start speaking..."}
        </div>
      </div>,
      document.body
    );
  };

  if (!isSupported) {
    return (
        <button
          type="button"
          style={{ ...styles.btn, opacity: 0.5, cursor: "not-allowed" }}
          disabled
          title="Speech recognition is not supported in your browser."
          className={className}
        >
          <VuesaxIcon
            name="microphone-slash"
            variant="Linear"
            darkMode={darkMode}
          />
        </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleListening}
        style={styles.btn}
        className={className}
      >
        <VuesaxIcon
          name="microphone"
          variant="Linear"
          darkMode={darkMode}
          color={darkMode ? "#ffffff" : "#c1121f"}
        />
      </button>
      {renderOverlay()}
    </>
  );
}
