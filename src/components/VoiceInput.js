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
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop on silence (auto-send)
    recognition.interimResults = true; // Show text while speaking
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
      console.log("Interim:", interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      // Handle "no-speech" gracefully (just stop listening)
      if (event.error === "no-speech") {
        setListening(false);
        return;
      }

      setListening(false);
      if (event.error === "network") {
        alert("Network error. Check internet connection.");
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied.");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
      
      // Auto-send if we have a final transcript or lingering interim
      const fullText = (finalTranscriptRef.current + " " + interimTranscript).trim();
      
      if (fullText) {
        console.log("Auto-sending:", fullText);
        onTextReady(fullText);
      }
      
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTextReady, interimTranscript]); // Added interimTranscript to deps to ensure latest state is captured if needed, mostly redundant due to ref but safe

  const toggleListening = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
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
            darkMode={darkMode} // Use passed darkMode prop for icon color
            color={darkMode ? "#ffffff" : "#333333"}
          />
        </button>

        <div className="mic-animation-container">
          <div className="mic-pulse-ring"></div>
          <div className="mic-pulse-ring"></div>
          <div className="mic-circle">
            <VuesaxIcon name="microphone" variant="Bold" color="#ffffff" size={40} />
          </div>
        </div>

        <div className="speech-status-text">Listening...</div>

        <div className="live-transcript">
          {interimTranscript || finalTranscriptRef.current || "Start speaking..."}
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
