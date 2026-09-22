/**
 * App.jsx
 * Root application component.
 * Currently renders the ChatPage directly.
 * When routing is added later, this is where React Router routes would live.
 */
import "./App.css";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return <ChatPage />;
}
