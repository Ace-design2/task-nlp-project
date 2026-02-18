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
  const finalTranscriptRef = useRef("");
  
  // Audio API Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

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
      startVisualizer(); // Start the bars
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
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "no-speech") {
        stopVisualizer();
        setListening(false);
        return;
      }

      stopVisualizer();
      setListening(false);
      
      if (event.error === "network") {
        alert("Network error. Check internet connection.");
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied.");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      stopVisualizer(); // Stop bars
      setListening(false);
      
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
      if (recognitionRef.current) recognitionRef.current.abort();
      stopVisualizer();
    };
  }, [onTextReady, interimTranscript]);

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Small size for fewer bars (32 bins)
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // We want 5 nice bars. Let's pick 5 representative indices from the 32 bins.
        // Low freqs are at the start.
        // Indices: 2, 6, 10, 14, 18 (Arbitrary spread)
        const indices = [1, 3, 5, 7, 9]; 
        const newVisuals = indices.map(i => {
             // Scale 0-255 to roughly 10-100% height, but keep a minimum
             let val = dataArray[i];
             // Simple noise gate
             if (val < 10) val = 10; 
             return Math.min(100, (val / 255) * 120 + 10); // Scale up a bit
        });

        setVisualData(newVisuals);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();

    } catch (err) {
      console.error("Error starting visualizer:", err);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    // usage cleanup
    audioContextRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setVisualData([20, 20, 20, 20, 20]); // Reset
  };

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
            darkMode={darkMode}
            color={darkMode ? "#ffffff" : "#333333"}
          />
        </button>

        {/* Music Pulse Visualization */}
        <div className="voice-visualizer">
           {visualData.map((height, i) => (
             <div 
                key={i} 
                className="voice-bar" 
                style={{ 
                    height: `${height}px`,
                    // Optional: Make middle bar tallest if data doesn't naturally do it, 
                    // but real frequency data is better.
                }} 
             />
           ))}
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
