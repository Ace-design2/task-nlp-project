import React from "react";
import VuesaxIcon from "./VuesaxIcon";
import AstraAvatar from "./AstraAvatar";
import "./TaskHistory.css";

export default function TaskHistory({
  history,
  onRestore,
  onDelete,
  onDeleteAll,
  darkMode,
  isTyping,
  userProfile,
}) {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  return (
    <div
      className={`task-history-container ${
        darkMode ? "dark-mode-history" : ""
      }`}
    >
      {history.map((item) => (
        <div
          key={item.id}
          className={`chat-message-wrapper ${
            item.sender === "ai" ? "ai" : "user"
          }`}
          style={{
            display: "flex",
            flexDirection: item.sender === "ai" ? "row" : "row-reverse",
            alignItems: "center", // Changed from flex-end to center per user request
            gap: 8,
          }}
        >
          {/* Icons */}
          {item.sender === "ai" ? (
            <AstraAvatar size={32} />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: darkMode ? "#333" : "#eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Prioritize photoBase64 (from Firestore) or photoURL (from Auth/Firestore) */}
              {userProfile &&
              (userProfile.photoBase64 || userProfile.photoURL) ? (
                <img
                  src={userProfile.photoBase64 || userProfile.photoURL}
                  alt="Me"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                /* Fallback if really no image found. Maybe user hasn't set one yet? */
                <VuesaxIcon
                  name="user"
                  variant="Bold"
                  darkMode={darkMode}
                  style={{ width: 20, height: 20 }}
                />
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: item.sender === "ai" ? "flex-start" : "flex-end",
              maxWidth: "calc(100% - 50px)",
            }}
          >
            <div
              className="chat-bubble"
              onClick={() => item.sender !== "ai" && onRestore(item.text)}
              title={item.sender !== "ai" ? "Tap to edit" : ""}
              style={{ cursor: item.sender === "ai" ? "default" : "pointer" }}
            >
              {item.text}
            </div>

            <div
              className="chat-meta-row"
              style={{
                justifyContent:
                  item.sender === "ai" ? "flex-start" : "flex-end",
              }}
            >
              <span className="chat-timestamp">{item.timestamp}</span>
              {item.sender !== "ai" && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <VuesaxIcon
                    name="trash"
                    darkMode={darkMode}
                    style={{ width: 14, height: 14 }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {history.length > 0 && (
        <div className="delete-all-wrapper">
          <button className="delete-all-btn" onClick={onDeleteAll}>
            Clear Chat
          </button>
        </div>
      )}

      {isTyping && (
        <div
          className="chat-message-wrapper ai"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AstraAvatar size={32} />
          <div className="typing-indicator-bubble">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
