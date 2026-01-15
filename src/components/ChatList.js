import React from "react";
import VuesaxIcon from "./VuesaxIcon"; // Assuming we might swap icons later, but using inline for now as requested

const ChatList = ({
  chats = [],
  onSelectChat,
  onDeleteChat,
  onCreateChat,
  darkMode,
}) => {
  return (
    <div
      className="chat-list-container"
      style={{ color: darkMode ? "#fff" : "#000" }}
    >
      {chats.length === 0 && (
        <div style={{ padding: 20, opacity: 0.5 }}>
          No chats yet. Start a new one!
        </div>
      )}

      {chats.map((chat) => (
        <div
          key={chat.id}
          className="chat-item-wrapper"
          onClick={() => onSelectChat(chat.id)}
        >
          <div className="chat-item-content">
            <div
              className="chat-item-card"
              style={{
                outline: `1px ${darkMode ? "#333" : "black"} solid`,
                background: darkMode ? "#1E1E1E" : "transparent",
              }}
            >
              <div
                className="chat-item-title"
                style={{ color: darkMode ? "#fff" : "black" }}
              >
                {chat.firstPrompt || "New Chat"}
              </div>
              <div className="chat-item-meta">
                <div
                  className="chat-item-time"
                  style={{ color: darkMode ? "#aaa" : "black" }}
                >
                  {chat.lastMessageTime
                    ? new Date(chat.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            </div>

            {/* Delete Icon */}
            <div
              className="delete-icon-wrapper"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <VuesaxIcon
                name="trash"
                variant="Linear"
                darkMode={darkMode}
                style={{ width: 20, height: 20 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
