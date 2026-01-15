export default function TaskResult({ results }) {
  return (
    <div style={styles.box}>
      <h3>Extracted Tasks</h3>

      {results.map((task, i) => (
        <div key={i} style={styles.item}>
          <p><strong>Task:</strong> {task.task}</p>
          <p><strong>Deadline:</strong> {typeof task.deadline === 'object' ? task.deadline.text : task.deadline || "None detected"}</p>
          <p><strong>Priority:</strong> {task.priority}</p>
          <p><strong>Category:</strong> {task.category}</p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  box: {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  item: {
    background: "#f7f7f7",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
  },
};
