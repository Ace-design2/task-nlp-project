import React from "react";

export default function TaskInput({ text, onTextChange, onEnter }) {
  const textareaRef = React.useRef(null);

  // Auto-resize logic
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
      // Reset height after submit (optional, but good practice since text clears)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type your task..."
      rows={1}
      style={styles.input}
    />
  );
}

const styles = {
  input: {
    flexGrow: 1,
    padding: "8px 12px", // Minimized vertical padding
    borderRadius: "20px",
    border: "1px solid #ccc",
    fontSize: "16px",
    fontFamily: '"Inter", sans-serif',
    resize: "none",
    overflow: "hidden",
    minHeight: "14px", // Kept low
    boxSizing: "border-box",
    maxHeight: "150px", // Prevent it from taking over the screen
    lineHeight: "1.4",
  },
};
