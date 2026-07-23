"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { MarkdownRenderer } from "@/components/markdown-renderer";

const hoverStyles = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); }
    25% { transform: translateY(-10px) translateX(5px); }
    50% { transform: translateY(-5px) translateX(-5px); }
    75% { transform: translateY(5px) translateX(3px); }
  }
  
  .universe-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000000;
    overflow: hidden;
    z-index: -1;
  }
  
  .star {
    position: absolute;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    animation: twinkle var(--duration) ease-in-out infinite;
  }
  
  .nebula {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;
  }
  
  .response-card {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(20px);
    background: rgba(20, 20, 20, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  
  .response-card:hover {
    transform: scale(1.03) translateY(-5px);
    box-shadow: 0 25px 50px rgba(43, 127, 204, 0.25), 0 0 100px rgba(43, 127, 204, 0.1);
    z-index: 10;
    backdrop-filter: blur(30px);
    background: rgba(30, 30, 30, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
  }
  
  .response-card .card-content {
    max-height: 400px;
    transition: max-height 0.4s ease;
    overflow-y: auto;
    overflow-x: hidden;
    color: rgba(255, 255, 255, 0.9);
    scrollbar-width: thin;
    scrollbar-color: rgba(43, 127, 204, 0.5) transparent;
  }
  
  .response-card .card-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .response-card .card-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .response-card .card-content::-webkit-scrollbar-thumb {
    background: rgba(43, 127, 204, 0.5);
    border-radius: 3px;
  }
  
  .response-card:hover .card-content {
    max-height: 800px;
  }
  
  .response-card .card-header {
    transition: all 0.4s ease;
    background: rgba(30, 30, 30, 0.9) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  .response-card:hover .card-header {
    background: rgba(43, 127, 204, 0.3) !important;
    color: #fff !important;
  }
  
  /* Hide Next.js development indicator */
  nextjs-portal {
    display: none !important;
  }
  
  [data-nextjs-router] {
    display: none !important;
  }
  
  next-route-announcer {
    display: none !important;
  }
  
  nextjs-hot-liver {
    display: none !important;
  }

  .conv-item:hover .conv-delete {
    opacity: 1;
  }

  .conv-item .conv-delete {
    opacity: 0;
    transition: opacity 0.15s;
  }
`;

const MODELS = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", free: true, tags: ["reasoning", "coding", "fast"] },
  { id: "gemma-4-31b", name: "Gemma 4 31B", free: true, tags: ["general", "multilingual", "vision"] },
  { id: "gemma-4-26b", name: "Gemma 4 26B", free: true, tags: ["general", "multilingual", "efficient"] },
  { id: "gpt-oss-120b", name: "GPT-OSS 120B", free: true, tags: ["general", "reasoning", "balanced"] },
  { id: "gpt-oss-20b", name: "GPT-OSS 20B", free: true, tags: ["fast", "lightweight", "general"] },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", free: true, tags: ["chat", "multilingual", "stable"] },
  { id: "nemotron-3-super-120b", name: "Nemotron Super 120B", free: true, tags: ["multi-agent", "tool-calling", "reasoning"] },
  { id: "laguna-m.1", name: "Laguna M.1", free: true, tags: ["coding", "agentic", "software-engineering"] },
];

export default function ChatPage() {
  const [selected, setSelected] = useState<string[]>(["deepseek-v4-flash", "gemma-4-31b", "gpt-oss-20b"]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<Record<string, string>>({});
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [diffs, setDiffs] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string | null; createdAt?: string }[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const groupConversations = (convs: { id: string; title: string | null; createdAt?: string }[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const groups: { label: string; items: typeof convs }[] = [];
    const buckets: Record<string, typeof convs> = { "Today": [], "Yesterday": [], "Previous 7 days": [], "Previous 30 days": [], "Older": [] };

    for (const c of convs) {
      const d = c.createdAt ? new Date(c.createdAt) : new Date();
      if (d >= today) buckets["Today"].push(c);
      else if (d >= yesterday) buckets["Yesterday"].push(c);
      else if (d >= weekAgo) buckets["Previous 7 days"].push(c);
      else if (d >= monthAgo) buckets["Previous 30 days"].push(c);
      else buckets["Older"].push(c);
    }

    for (const [label, items] of Object.entries(buckets)) {
      if (items.length > 0) groups.push({ label, items });
    }
    return groups;
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (convId === id) resetState();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {});
  }, []);

  // Load conversation when clicking on a previous conversation
  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const conv = await res.json();
        setConvId(conv.id);
        setConvMessages(conv.messages || []);
        setStreaming({});
        setLatencies({});
        setSummary("");
        setDiffs("");
        setErrors([]);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const toggleModel = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const resetState = () => {
    setConvId(null);
    setConvMessages([]);
    setStreaming({});
    setLatencies({});
    setSummary("");
    setDiffs("");
    setErrors([]);
    setLoading(false);
    setInput("");
    // Refresh conversation list
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {});
  };

  const sendMessage = async () => {
    if (!input.trim() || selected.length === 0 || loading) return;
    const prompt = input.trim();
    setInput("");
    setLoading(true);
    setStreaming({});
    setLatencies({});
    setSummary("");
    setDiffs("");
    setErrors([]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, modelIds: selected, conversationId: convId }),
    });

    if (!res.ok) {
      setLoading(false);
      setErrors(["Failed to send"]);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let evt = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) evt = line.slice(7);
        else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (evt.startsWith("model:")) {
            setStreaming((p) => ({ ...p, [evt.slice(6)]: (p[evt.slice(6)] || "") + data }));
          } else if (evt.startsWith("latency:")) {
            setLatencies((p) => ({ ...p, [evt.slice(8)]: Number(data) }));
          }           else if (evt === "error") setErrors((p) => [...p, data]);
          else if (evt === "convId") { setConvId(data); }
          else if (evt === "summary") setSummary((p) => p + data);
          else if (evt === "differences") setDiffs((p) => p + data);
          else if (evt === "done") setConvId(data);
        }
      }
    }
    setLoading(false);
    // Refresh conversation list after sending a message
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {});
  };

  const isBusy = Object.keys(streaming).length > 0;

  const S = {
    page: { display: "flex", height: "100vh", overflow: "hidden", background: "#000000" },
    sidebar: { width: "260px", minWidth: "260px", height: "100%", background: "rgba(0, 0, 0, 0.9)", borderRight: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", flexDirection: "column" as const, overflow: "hidden", backdropFilter: "blur(20px)" },
    main: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" },
    header: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "rgba(0, 0, 0, 0.8)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(20px)" },
    modelBar: { display: "flex", flexWrap: "wrap" as const, gap: "8px", padding: "10px 16px", background: "rgba(0, 0, 0, 0.6)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)" },
    responses: { flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column" as const, gap: "20px" },
    inputBar: { padding: "16px", background: "rgba(0, 0, 0, 0.7)", borderTop: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(20px)" },
    inputRow: { display: "flex", gap: "8px", alignItems: "flex-end" },
    textarea: { flex: 1, minHeight: "52px", resize: "none" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.05)", fontSize: "15px", fontFamily: "inherit", color: "rgba(255, 255, 255, 0.9)", outline: "none", backdropFilter: "blur(10px)" },
    sendBtn: { padding: "12px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #2B7FCC 0%, #1a5a9e 100%)", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 15px rgba(43, 127, 204, 0.4)" },
  };

  const stars = useMemo(() => 
    Array.from({ length: 200 }).map((_, i) => ({
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      width: `${(i % 3) + 1}px`,
      height: `${(i % 3) + 1}px`,
      duration: `${(i % 3) + 2}s`,
    })), []
  );

  return (
    <div style={S.page}>
      <style>{hoverStyles}</style>
      <div className="universe-bg">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.width,
              height: star.height,
              '--duration': star.duration,
            } as any}
          />
        ))}
        <div className="nebula" style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(43, 127, 204, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)', top: '10%', left: '10%' }} />
        <div className="nebula" style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)', bottom: '10%', right: '10%', animationDelay: '-10s' }} />
        <div className="nebula" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(43, 127, 204, 0.1) 50%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '-5s' }} />
      </div>
      <aside style={S.sidebar}>
        <div style={{ padding: "16px 12px 8px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button onClick={resetState} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)", background: "transparent", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500", cursor: "pointer", textAlign: "left" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New chat
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "4px 8px" }}>
          {groupConversations(conversations).map((group) => (
            <div key={group.label} style={{ marginBottom: "8px" }}>
              <div style={{ padding: "8px 8px 4px", fontSize: "11px", fontWeight: "600", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {group.label}
              </div>
              {group.items.map((c) => (
                <div
                  key={c.id}
                  onMouseEnter={() => setHoveredConv(c.id)}
                  onMouseLeave={() => setHoveredConv(null)}
                  onClick={() => loadConversation(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: convId === c.id ? "rgba(255, 255, 255, 0.1)" : hoveredConv === c.id ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    transition: "background 0.15s",
                    marginBottom: "1px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {c.title || "New conversation"}
                  </span>
                  {hoveredConv === c.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "6px", border: "none", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", cursor: "pointer", flexShrink: 0, marginLeft: "4px" }}
                      title="Delete conversation"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: "20px 12px", textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.3)" }}>
              No conversations yet
            </div>
          )}
        </div>
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", background: "transparent", color: "rgba(255, 255, 255, 0.5)", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      <main style={S.main}>
        <div style={S.header}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255, 255, 255, 0.95)" }}>LLM Compare</span>
          <span style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "99px", background: "rgba(43,127,204,0.2)", color: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)" }}>{selected.length} model{selected.length !== 1 ? "s" : ""}</span>
        </div>

        <div style={S.modelBar}>
          {MODELS.map((m) => {
            const on = selected.includes(m.id);
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <button onClick={() => toggleModel(m.id)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: "500", cursor: "pointer", border: on ? "1px solid rgba(43, 127, 204, 0.6)" : "1px solid rgba(255, 255, 255, 0.15)", background: on ? "rgba(43, 127, 204, 0.4)" : "rgba(255,255,255,0.03)", color: on ? "#fff" : "rgba(255, 255, 255, 0.7)", boxShadow: on ? "0 2px 12px rgba(43,127,204,0.3)" : "none", backdropFilter: "blur(10px)" }}>
                  {m.name}
                  {m.free && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "99px", background: on ? "rgba(255,255,255,0.25)" : "rgba(34,197,94,0.2)", color: on ? "#fff" : "#22c55e", fontWeight: "700" }}>FREE</span>}
                </button>
                <div style={{ display: "flex", gap: "3px", marginTop: "3px", flexWrap: "wrap" }}>
                  {m.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "4px", background: on ? "rgba(255,255,255,0.15)" : "rgba(43,127,204,0.1)", color: on ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.6)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.responses}>
          {!isBusy && !loading && convMessages.length === 0 && !summary && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: "500", color: "rgba(255, 255, 255, 0.9)", margin: 0 }}>Ask anything</p>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", margin: "4px 0 0" }}>Pick models above, type a question below.</p>
            </div>
          )}

          {convMessages.map((msg: any, i: number) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255, 255, 255, 0.95)", margin: 0 }}>{msg.prompt}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {msg.responses?.map((r: any) => (
                  <div key={r.modelName} className="response-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    <div className="card-header" style={{ padding: "10px 16px", fontSize: "13px", fontWeight: "600" }}>{r.modelName}</div>
                    <div className="card-content" style={{ padding: "14px 16px", fontSize: "14px", lineHeight: "1.7", overflowY: "auto" }}><MarkdownRenderer content={r.content} /></div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isBusy && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255, 255, 255, 0.95)", margin: 0 }}>...</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {Object.entries(streaming).map(([name, content]) => (
                  <div key={name} className="response-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    <div className="card-header" style={{ padding: "10px 16px", fontSize: "13px", fontWeight: "600" }}>
                      {name}{latencies[name] ? ` (${latencies[name]}ms)` : ""}
                    </div>
                    <div className="card-content" style={{ padding: "14px 16px", fontSize: "14px", lineHeight: "1.7", overflowY: "auto" }}>
                      {content ? <MarkdownRenderer content={content} /> : <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>Waiting...</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && summary && (
            <div className="response-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="card-header" style={{ padding: "12px 20px", fontSize: "14px", fontWeight: "600" }}>
                Summary
              </div>
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontSize: "13px", color: "rgba(43, 127, 204, 0.9)", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Consensus</p>
                <p style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255, 255, 255, 0.85)", margin: 0 }}><MarkdownRenderer content={summary} /></p>
                {diffs && (
                  <>
                    <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.1)", margin: "16px 0" }} />
                    <p style={{ fontSize: "13px", color: "rgba(43, 127, 204, 0.9)", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Differences</p>
                    <p style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255, 255, 255, 0.85)", whiteSpace: "pre-wrap", margin: 0 }}><MarkdownRenderer content={diffs} /></p>
                  </>
                )}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "rgba(255, 255, 255, 0.9)", fontSize: "13px", backdropFilter: "blur(10px)" }}>
              {errors.map((e, i) => <p key={i} style={{ margin: 0, color: "#f87171" }}>{e}</p>)}
            </div>
          )}
        </div>

        <div style={S.inputBar}>
          <div style={S.inputRow}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask a question to compare AI models..."
              disabled={loading}
              rows={1}
              style={S.textarea}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || selected.length === 0}
              style={{ ...S.sendBtn, opacity: loading || !input.trim() || selected.length === 0 ? 0.4 : 1, cursor: loading || !input.trim() || selected.length === 0 ? "not-allowed" : "pointer" }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
