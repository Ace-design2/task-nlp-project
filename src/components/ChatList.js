import React from "react";
import VuesaxIcon from "./VuesaxIcon"; // Assuming we might swap icons later, but using inline for now as requested

const ChatList = ({
  chats = [],
  onSelectChat,
  onDeleteChat,
  onCreateChat,
  darkMode,
}) => {
  // Helper to categorize dates
  const getRelativeDateCategory = (dateString) => {
    if (!dateString) return "Older";
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const checkDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (checkDate.getTime() === today.getTime()) {
      return "Today";
    } else if (checkDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else if (checkDate > thisWeekStart) {
      return "This Week";
    } else {
      // Month Year format for older
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  };

  // Group chats
  const groupedChats = chats.reduce((acc, chat) => {
    const category = getRelativeDateCategory(chat.lastMessageTime);
    if (!acc[category]) acc[category] = [];
    acc[category].push(chat);
    return acc;
  }, {});

  // Define Category Order
  const categoryOrder = ["Today", "Yesterday", "This Week"];

  // Logic to sort keys
  const sortedCategories = Object.keys(groupedChats).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Both are "Month Year" or unknown. Sort by recent date of the first chat in that group.
    const chatA = groupedChats[a][0];
    const chatB = groupedChats[b][0];
    return new Date(chatB.lastMessageTime) - new Date(chatA.lastMessageTime);
  });

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

      {sortedCategories.map((category) => (
        <div
          key={category}
          className="chat-category-group"
          style={{ width: "100%" }}
        >
          {/* Category Header */}
          <div
            className="chat-category-header"
            style={{
              padding: "10px 20px 5px 20px",
              fontSize: "13px",
              fontWeight: 600,
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: darkMode ? "#aaa" : "#666",
            }}
          >
            {category}
          </div>

          {/* Chats in this category */}
          {groupedChats[category].map((chat) => (
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
                        ? new Date(chat.lastMessageTime).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
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
      ))}
    </div>
  );
};

export default ChatList;
