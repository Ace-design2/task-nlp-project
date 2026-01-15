import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

test("renders chat title", () => {
  render(<App />);
  const titleElement = screen.getAllByText(/Chat/i)[0];
  expect(titleElement).toBeInTheDocument();
});

test("adds task when Enter key is pressed", () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Type your task.../i);

  fireEvent.change(inputElement, { target: { value: "New Test Task" } });
  fireEvent.keyDown(inputElement, {
    key: "Enter",
    code: "Enter",
    charCode: 13,
  });

  const taskElement = screen.getByText("New Test Task");
  expect(taskElement).toBeInTheDocument();
});
