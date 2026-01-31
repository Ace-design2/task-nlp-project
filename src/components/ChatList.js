import React from "react";
import VuesaxIcon from "./VuesaxIcon";

const ChatList = ({
  chats = [],
  searchResults = null,
  isSearching = false,
  onSelectChat,
  onDeleteChat,
  darkMode,
  activeChatId,
}) => {
  // Determine if we are in "Search Mode"
  const isFiltered = searchResults !== null;

  // --- RENDER SEARCH RESULTS (Flat List) ---
  if (isFiltered) {
    return (
      <div
        className="chat-list-container"
        style={{ color: darkMode ? "#fff" : "#000" }}
      >
        {isSearching && (
          <div style={{ padding: 20, textAlign: "center", opacity: 0.6 }}>
            Searching messages...
          </div>
        )}

        {!isSearching && searchResults.length === 0 && (
          <div style={{ padding: 20, opacity: 0.5 }}>No matches found.</div>
        )}

        {!isSearching &&
          searchResults.map((match, index) => (
            <div
              key={`${match.id}_${match.messageId}_${index}`}
              className="chat-item-wrapper"
              onClick={() => onSelectChat(match.id)}
            >
              <div className="chat-item-content">
                <div
                  className={`chat-item-card ${darkMode ? "dark" : ""} ${match.id === activeChatId ? "active" : ""}`}
                >
                  {/* Chat Origin Title */}
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: darkMode ? "#aaa" : "#666",
                    }}
                  >
                    {match.chatTitle}
                  </div>

                  {/* Matched Text Snippet */}
                  <div
                    className="chat-item-title"
                    style={{
                      color: darkMode ? "#fff" : "black",
                      fontSize: "14px",
                      whiteSpace: "normal", // Allow wrapping for snippets
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    "{match.text}"
                  </div>

                  {/* Timestamp */}
                  <div className="chat-item-meta">
                    <div
                      className="chat-item-time"
                      style={{ color: darkMode ? "#aaa" : "black" }}
                    >
                      {match.timestamp
                        ? new Date(match.timestamp).toLocaleDateString() +
                          " " +
                          new Date(match.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  // --- RENDER STANDARD CHAT LIST (Grouped by Date) ---

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
      date.getDate(),
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

  const groupedChats = chats.reduce((acc, chat) => {
    const category = getRelativeDateCategory(chat.lastMessageTime);
    if (!acc[category]) acc[category] = [];
    acc[category].push(chat);
    return acc;
  }, {});

  const categoryOrder = ["Today", "Yesterday", "This Week"];

  const sortedCategories = Object.keys(groupedChats).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    const chatA = groupedChats[a][0];
    const chatB = groupedChats[b][0];
    return new Date(chatB.lastMessageTime) - new Date(chatA.lastMessageTime);
  });

  return (
    <div
      className="chat-list-container"
      style={{ color: darkMode ? "#fff" : "#000" }}
    >
      {/* Loading State for initial load if needed, but usually handled by App */}
      {isSearching && (
        <div style={{ padding: 20, textAlign: "center", opacity: 0.6 }}>
          Searching messages...
        </div>
      )}

      {!isSearching && chats.length === 0 && (
        <div style={{ padding: 20, opacity: 0.5 }}>
          No chats yet. Start a new one!
        </div>
      )}

      {!isSearching &&
        sortedCategories.map((category) => (
          <div
            key={category}
            className="chat-category-group"
            style={{ width: "100%" }}
          >
            <div
              className={`chat-category-header ${darkMode ? "dark" : ""}`}
              style={{
                padding: "10px 20px 5px 20px",
                fontSize: "13px",
                fontWeight: 600,
                opacity: 1 /* Increased opacity for visibility */,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#c1121f" /* Red Accent */,
              }}
            >
              {category}
            </div>

            {groupedChats[category].map((chat) => (
              <div
                key={chat.id}
                className="chat-item-wrapper"
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-item-content">
                  <div
                    className={`chat-item-card ${darkMode ? "dark" : ""} ${chat.id === activeChatId ? "active" : ""}`}
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
                              },
                            )
                          : ""}
                      </div>
                    </div>
                  </div>

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
