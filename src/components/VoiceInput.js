import { useState, useRef, useEffect } from "react";
import VuesaxIcon from "./VuesaxIcon";

const styles = {
  container: { position: "relative", display: "flex", alignItems: "center" },
  btn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  overlay: {
    position: "absolute",
    bottom: "80px", // Position above the form
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  listeningAlert: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "white",
    padding: "10px 20px",
    borderRadius: "20px",
    fontSize: "14px",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
  },
};

export default function VoiceInput({ onTextReady, darkMode, className }) {
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        interimTranscript += transcript;
      }
      console.log("Transcript:", interimTranscript);
      transcriptRef.current = interimTranscript;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);

      if (event.error === "network") {
        alert(
          "Network error. Make sure you have internet connection and microphone is allowed.",
        );
      } else if (event.error === "no-speech") {
        // Ignore no-speech error, just stop listening
      } else if (event.error !== "aborted") {
        alert("Error: " + event.error);
      }
    };

    recognition.onend = () => {
      console.log(
        "Speech recognition ended, transcript:",
        transcriptRef.current,
      );
      setListening(false);

      if (transcriptRef.current && transcriptRef.current.trim()) {
        console.log("Auto-sending:", transcriptRef.current);
        onTextReady(transcriptRef.current);
        transcriptRef.current = "";
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTextReady]);

  const toggleListening = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
    } else {
      transcriptRef.current = "";
      try {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setListening(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      {!isSupported ? (
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
      ) : (
        <button
          type="button"
          onClick={toggleListening}
          style={styles.btn}
          className={className}
        >
          <VuesaxIcon name="microphone" variant="Linear" darkMode={darkMode} />
        </button>
      )}
      {listening && (
        <div style={styles.overlay}>
          <div style={styles.listeningAlert}>
            <VuesaxIcon name="microphone" variant="Bold" darkMode={true} />
            <span style={{ marginLeft: "10px" }}>Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}
