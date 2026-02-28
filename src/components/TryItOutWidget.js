import React, { useState, useEffect, useRef } from "react";
import "./TryItOutWidget.css";
import VuesaxIcon from "./VuesaxIcon";
import TaskHistory from "./TaskHistory";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// Simple UUID generator for guest sessions
function generateUUID() {
  return "guest_" + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const TryItOutWidget = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [guestId, setGuestId] = useState(null);
  const [hasOpened, setHasOpened] = useState(false);
  
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Initialize Guest ID from Local Storage
    let storedId = localStorage.getItem("astra_guest_id");
    if (!storedId) {
      storedId = generateUUID();
      localStorage.setItem("astra_guest_id", storedId);
    }
    setGuestId(storedId);
  }, []);

  useEffect(() => {
    if (isOpen && guestId && !hasOpened) {
      setHasOpened(true);
      
      const messagesRef = collection(db, "trial_chats", guestId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ensure accurate chronological sorting as local (pending) writes might not have a createdAt initially
        msgs.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
            const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
            return timeA - timeB;
        });
        
        setMessages(msgs);
        
        // Welcome Message
        if (msgs.length === 0 && !isTyping) {
            addAiMessage("Hi there! I'm Astra. Try asking me to schedule a task or manage your day!");
        }
      });
      
      unsubscribeRef.current = unsubscribe;
    }

    return () => {
        // We let the listener keep running even if closed to track incoming delayed messages
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, guestId, hasOpened]);

  // Clean up listener entirely on full unmount
  useEffect(() => {
      return () => {
          if (unsubscribeRef.current) {
              unsubscribeRef.current();
          }
      };
  }, []);

  useEffect(() => {
    // Scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const addAiMessage = async (text) => {
    if (!guestId) return;
    try {
      await addDoc(collection(db, "trial_chats", guestId, "messages"), {
        text,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding AI message", e);
    }
  };

  const processGeneralConversation = async (text) => {
    const lower = text.toLowerCase();

    // 1. Greetings
    if (lower.match(/^(hello|hi|hey|greetings|good morning|good afternoon|good evening)/)) {
       setTimeout(() => {
           addAiMessage(`Hello there! How can I help you be productive today?`);
           setIsTyping(false);
       }, 800);
       return true;
    }

    // 2. Identity
    if (lower.includes("who are you") || lower.includes("what is your name")) {
       setTimeout(() => {
           addAiMessage("I am **Astra**, your personal academic and productivity assistant.");
           setIsTyping(false);
       }, 800);
       return true;
    }

    // 3. Capabilities / Help
    if (lower.includes("what can you do") || lower.includes("help") || lower.includes("features")) {
       setTimeout(() => {
           addAiMessage("I can help you manage your tasks, create study schedules, and answer questions about your profile.\n\n**Try asking:**\n- 'Create a task to study math'\n- 'Remind me to buy milk tomorrow'\n- 'Build a study schedule for CSC411'\n\n*(Note: Features like calendar sync and profile stats are limited in this guest trial).*");
           setIsTyping(false);
       }, 800);
       return true;
    }

    return false;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !guestId) return;

    const userMsg = inputText.trim();
    setInputText("");
    setIsTyping(true);

    // Add User Message to DB
    try {
      await addDoc(collection(db, "trial_chats", guestId, "messages"), {
        text: userMsg,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding user message", e);
    }

    // Check for General Conversation
    const isGeneral = await processGeneralConversation(userMsg);
    if (isGeneral) return;

    try {
      // Direct NLP API Call
      const response = await fetch("https://madebyace-task-nlp-engine.hf.space/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg }),
      });
      
      const data = await response.json();
      
      setTimeout(async () => {
          let aiResponse = "";
          
          if (data && data.intent) {
            if (data.intent === "create_task" || data.intent === "set_reminder") {
                const p = data.priority ? data.priority.toLowerCase() : "normal";
                aiResponse = `Got it! In the full app, I would create a **${p} priority** task for: "${data.task || userMsg}"`;
                
                if (data.deadline && data.deadline.text) {
                     aiResponse += ` scheduled for **${data.deadline.text}**.`;
                } else {
                     aiResponse += `.`;
                }
            } else if (data.intent === "delete_task") {
                 aiResponse = `Got it! I would find and delete the task matching: "${data.task || userMsg}" in the full app.`;
            } else {
                 aiResponse = `Astra: ${data.task || userMsg}`;
            }
          } else {
             aiResponse = "I didn't quite catch that. Try asking me to remind you about something!";
          }
          
          await addAiMessage(aiResponse);
          setIsTyping(false);
      }, 800);

    } catch (err) {
      console.error("NLP Error", err);
      setIsTyping(false);
      await addAiMessage("Oops! I'm having trouble connecting to my brain right now.");
    }
  };

  return (
    <div className={`try-it-out-container`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`try-it-out-window ${darkMode ? "dark" : ""}`}>
          <div className="try-it-out-header">
            <h3>Try Astra NLP</h3>
            <p>Test out task creation & scheduling</p>
          </div>
          
          <div className="try-it-out-history" style={{ padding: 0 }}>
            <div className="results-container" style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
              <TaskHistory
                history={messages}
                onRestore={(text) => setInputText(text)}
                onDelete={() => {}} 
                darkMode={darkMode}
                isTyping={isTyping}
                userProfile={null}
              />
              
              {messages.length <= 1 && (
                <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', color: darkMode ? '#888' : '#888', margin: '0 0 5px 0' }}>Suggested prompts:</p>
                  {['Remind me to buy milk tomorrow at 5pm', 'Schedule a meeting next Friday', 'Delete the milk task'].map((prompt, i) => (
                    <button 
                      key={i} 
                      style={{ 
                        textAlign: 'left', 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, 
                        background: darkMode ? '#1a1a1a' : '#fff', 
                        color: darkMode ? '#ddd' : '#555',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setInputText(prompt)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#c1121f';
                        e.currentTarget.style.color = '#c1121f';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                        e.currentTarget.style.color = darkMode ? '#ddd' : '#555';
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="try-it-out-input-area" style={{ padding: '10px', background: darkMode ? '#121212' : '#ffffff' }}>
            <form className="astra-float-input-container" onSubmit={handleSend} style={{ position: 'relative', bottom: 0, left: 0, right: 0, padding: 0, background: 'transparent', transform: 'none' }}>
              <div className="astra-input-group" style={{ margin: 0, padding: '5px' }}>
                <div className="astra-input-pill">
                  <textarea
                    className="astra-input-area"
                    placeholder="Ask Astra to create a task..."
                    value={inputText}
                    rows={1}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                        e.target.style.height = "auto";
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    className="astra-send-btn"
                    disabled={!inputText.trim() || isTyping}
                  >
                    <VuesaxIcon name="arrow-up" variant="Bold" color="#ffffff" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className={`try-it-out-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Try it out"
      >
         <VuesaxIcon 
           name={isOpen ? "close-circle" : "message-text"} 
           variant={isOpen ? "Linear" : "Bold"} 
           color="#ffffff" 
           size={28} 
         />
      </button>
    </div>
  );
};

export default TryItOutWidget;
