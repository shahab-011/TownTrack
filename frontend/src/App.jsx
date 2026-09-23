import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://towntrack-api.onrender.com";

// ============================================================
// CUSTOM CURSOR COMPONENT
// ============================================================
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const ringX = useSpring(cursorX, { duration: 0.3, bounce: 0 });
  const ringY = useSpring(cursorY, { duration: 0.3, bounce: 0 });

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 4);
      cursorY.set(e.clientY - 4);
    };
    const mouseOver = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button')) {
        document.querySelector('.cursor-ring')?.classList.add('hovering');
      } else {
        document.querySelector('.cursor-ring')?.classList.remove('hovering');
      }
    };
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", mouseOver);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", mouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div className="cursor-dot" style={{ x: cursorX, y: cursorY }} />
      <motion.div className="cursor-ring" style={{ x: ringX, y: ringY }} />
    </>
  );
}

// ============================================================
// WEATHER CARD COMPONENT
// ============================================================
function WeatherCard({ content }) {
  const plainContent = content.replace(/\*\*/g, "");
  const temperature = plainContent.match(/Temperature:\s*([-\d.]+)/i)?.[1];
  const feelsLike = plainContent.match(/Feels like:\s*([-\d.]+)/i)?.[1];
  const humidity = plainContent.match(/Humidity:\s*(\d+)/i)?.[1];
  const conditionMatch = plainContent.match(/Condition:\s*([^\n]+)/i);
  const cityMatch = content.match(/weather in\s+([^*.,]+(?:,\s*[^*.,]+)*)/i);
  const condition = conditionMatch ? conditionMatch[1].trim() : "Current conditions";
  const city = cityMatch ? cityMatch[1].trim() : "Current location";

  return (
    <div className="weather-result">
      <div className="weather-result-header">
        <div>
          <span className="result-label">CURRENT WEATHER</span>
          <h2>{city}</h2>
        </div>
        <div className="weather-symbol">🌤️</div>
      </div>
      <div className="weather-main">
        <div className="weather-temperature">
          {temperature ?? "--"}°<span>C</span>
        </div>
        <div className="weather-condition">{condition}</div>
      </div>
      <div className="weather-details">
        <div className="weather-detail">
          <span className="detail-icon">🌡️</span>
          <div>
            <small>Feels like</small>
            <strong>{feelsLike ?? "--"}°C</strong>
          </div>
        </div>
        <div className="weather-detail">
          <span className="detail-icon">💧</span>
          <div>
            <small>Humidity</small>
            <strong>{humidity ?? "--"}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ABOUT PAGE COMPONENT
// ============================================================
function AboutPage() {
  return (
    <div className="about-container">
      <motion.div 
        className="about-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ fontSize: 40 }}>🎓</div>
        <h1>CourseMate AI</h1>
        <p>An advanced AI Agent system built to understand user intent, make decisions, and use external tools to fetch real-time data.</p>
      </motion.div>

      <div className="about-grid">
        <motion.div className="about-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h3>🤖 What is this project?</h3>
          <p>CourseMate AI is a City Intelligence Agent. Instead of just generating text, it acts as a "Brain" that decides when to use tools like Weather and News APIs to fetch live, real-world data and format it into a meaningful response for the user.</p>
        </motion.div>
        <motion.div className="about-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h3>👥 Who is the user?</h3>
          <p>This app is designed for users needing quick, actionable intelligence about their city or general knowledge. It's also a perfect educational tool for developers learning how to build manual agents vs using framework abstractions.</p>
        </motion.div>
        <motion.div className="about-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h3>🎯 Scope & Use Case</h3>
          <p>Imagine planning a date: you need weather, food, a cab, and a movie. CourseMate demonstrates how an AI can understand "Plan my evening", decide the steps, use tools to fetch data, and deliver a final result.</p>
        </motion.div>
      </div>

      <div className="flow-section">
        <h2>How the Agent Works (RAG & Tools Flow)</h2>
        <div className="flow-diagram">
          <motion.div className="flow-node" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            User Query (e.g., "Plan my evening")
          </motion.div>
          <motion.div className="flow-arrow" initial={{ height: 0 }} animate={{ height: 40 }} transition={{ duration: 0.4, delay: 0.2 }} />
          <motion.div className="flow-node brain" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
            🧠 LLM Brain (Analyzes Intent)
          </motion.div>
          <motion.div className="flow-arrow" initial={{ height: 0 }} animate={{ height: 40 }} transition={{ duration: 0.4, delay: 0.6 }} />
          <div className="flow-branches">
            <motion.div className="flow-node tool" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.8 }}>
              🌦️ Weather Tool<br />(OpenWeather)
            </motion.div>
            <motion.div className="flow-node tool" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.8 }}>
              📰 News Tool<br />(Tavily Search)
            </motion.div>
          </div>
          <motion.div className="flow-arrow" initial={{ height: 0 }} animate={{ height: 40 }} transition={{ duration: 0.4, delay: 1 }} />
          <motion.div className="flow-node" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.2 }}>
            🔧 Tool Result passed back to LLM
          </motion.div>
          <motion.div className="flow-arrow" initial={{ height: 0 }} animate={{ height: 40 }} transition={{ duration: 0.4, delay: 1.4 }} />
          <motion.div className="flow-node brain" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.6 }}>
            ✨ Final Formatted Answer
          </motion.div>
        </div>
      </div>

      <div className="flow-section">
        <h2>What I Learned</h2>
        <div className="learn-list">
          {["Text Splitters", "Vector Stores", "Retrievers", "Runnables", "Manual Agent Loops", "LangChain create_agent", "Tool Binding", "Prompt Engineering"].map((tag, i) => (
            <motion.span 
              key={tag} 
              className="learn-tag"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHAT PAGE COMPONENT
// ============================================================
function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "## Welcome to TownTrack 👋\n\nI can answer **general questions** and fetch **live weather or news** when you need current information.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, thread_id: threadId }),
      });

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();

      if (data.thread_id) setThreadId(data.thread_id);

      if (data.status === "approval_required") {
        setApproval({
          tool: data.tool,
          arguments: data.arguments || {},
          description: data.description || "",
          threadId: data.thread_id,
        });
        return;
      }

      if (data.status === "completed") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response || "No response received." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't connect to the TownTrack API. Please check the deployed backend and CORS settings." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (decision) => {
    if (!approval) return;
    const currentApproval = approval;
    setApproval(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: currentApproval.threadId, decision }),
      });

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();

      if (data.thread_id) setThreadId(data.thread_id);

      if (data.status === "approval_required") {
        setApproval({ tool: data.tool, arguments: data.arguments || {}, description: data.description || "", threadId: data.thread_id });
        return;
      }

      if (data.status === "completed") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response || "No response received." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "There was an error while processing the tool request." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const isWeatherResponse = (content) => /current weather in/i.test(content) && /temperature:/i.test(content) && /humidity:/i.test(content);

  const AssistantMessage = ({ content }) => {
    if (isWeatherResponse(content)) return <WeatherCard content={content} />;
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({children}) => <h1 className="md-h1">{children}</h1>, p: ({children}) => <p className="md-p">{children}</p>, strong: ({children}) => <strong className="md-strong">{children}</strong>, code: ({children}) => <code className="md-code">{children}</code> }}>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      <section className="chat" ref={chatRef}>
        <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`message-row ${message.role}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {message.role === "assistant" && <div className="avatar assistant-avatar">✦</div>}
            <div className="message-content">
              {message.role === "assistant" ? <AssistantMessage content={message.content} /> : <div className="message-bubble user-bubble">{message.content}</div>}
            </div>
            {message.role === "user" && <div className="avatar user-avatar">You</div>}
          </motion.div>
        ))}
        </AnimatePresence>

        {loading && !approval && (
          <motion.div className="message-row assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="avatar assistant-avatar">✦</div>
            <div className="thinking">
              Agent is thinking
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
          </motion.div>
        )}
      </section>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything..." rows="1" />
          <button className="send-button" onClick={sendMessage} disabled={!input.trim() || loading}>↑</button>
        </div>
        <p className="input-hint">Press Enter to send</p>
      </div>

      <AnimatePresence>
      {approval && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="approval-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
            <div className="approval-icon">🔐</div>
            <span className="card-label">TOOL APPROVAL REQUIRED</span>
            <h2>Agent wants to use a tool</h2>
            <p className="approval-description">Review the requested tool before allowing execution.</p>
            <div className="tool-box">
              <div className="tool-header"><span>⚙️</span><strong>{approval.tool}</strong></div>
              {Object.entries(approval.arguments).map(([key, value]) => (
                <div className="tool-argument" key={key}>
                  <span>{key}</span>
                  <code>"{String(value)}"</code>
                </div>
              ))}
            </div>
            <div className="approval-actions">
              <button className="deny-button" onClick={() => handleApproval("reject")}>Deny</button>
              <button className="approve-button" onClick={() => handleApproval("approve")}>✓ Approve</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================
function App() {
  const [view, setView] = useState("chat"); // 'chat' or 'about'

  return (
    <div className="app">
      <CustomCursor />
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon" aria-label="TownTrack logo">
            <svg viewBox="0 0 44 44" role="img" aria-hidden="true">
              <path className="logo-route" d="M8 31c5-8 9-13 15-13 5 0 7 4 13 4" />
              <path className="logo-pin" d="M22 7c-5 0-9 4-9 9 0 7 9 16 9 16s9-9 9-16c0-5-4-9-9-9Z" />
              <circle className="logo-core" cx="22" cy="16" r="3.5" />
              <circle className="logo-signal" cx="36" cy="22" r="3" />
            </svg>
          </div>
          <div>
            <h2>TownTrack</h2>
            <span>Agent Assistant</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-title">NAVIGATION</p>
          <div className={`nav-link ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}>
            <span>💬</span> Chat
          </div>
          <div className={`nav-link ${view === 'about' ? 'active' : ''}`} onClick={() => setView('about')}>
            <span>📖</span> About Project
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-title">CAPABILITIES</p>
          <div className="capability">
            <span>🤖</span>
            <div><strong>General AI</strong><small>General questions</small></div>
          </div>
          <div className="capability">
            <span>🌤️</span>
            <div><strong>Weather</strong><small>Live city weather</small></div>
          </div>
          <div className="capability">
            <span>📰</span>
            <div><strong>Latest News</strong><small>Current city news</small></div>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="status">
            <span className="status-dot"></span>
            Agent Online
          </div>
          <small>Powered by LangChain + Groq</small>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>{view === 'chat' ? 'Course Assistant' : 'About CourseMate AI'}</h1>
            <p>{view === 'chat' ? 'General AI + live city information' : 'Understanding RAG, Agents & Tools'}</p>
          </div>
          <div className="header-status">
            <span className="status-dot"></span>
            Online
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 75px)' }}
          >
            {view === 'chat' ? <ChatPage /> : <AboutPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;