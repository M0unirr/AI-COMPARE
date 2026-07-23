"use client";

import { LoginForm } from "@/components/login";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", background: "linear-gradient(180deg, #F5FAFF, #E8F1FB 40%, #D4E8F7 70%, #C0DBF2)" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ borderRadius: "24px", padding: "40px 32px", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(192,219,242,0.6)", boxShadow: "0 8px 32px rgba(26,58,92,0.08)", marginBottom: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 14px", borderRadius: "99px", background: "rgba(43,127,204,0.1)", color: "#2B7FCC", fontSize: "13px", fontWeight: "500", marginBottom: "12px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2B7FCC" }} />
              Compare AI models
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1A3A5C", margin: "0 0 8px" }}>LLM Compare</h1>
            <p style={{ fontSize: "15px", color: "#5A7A96", margin: 0, lineHeight: "1.5" }}>One question, every answer. See how different AI models respond to the same prompt, side by side.</p>
          </div>

          <LoginForm />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
          {[{ l: "Ask", d: "Type any question once" }, { l: "Compare", d: "See responses side by side" }, { l: "Understand", d: "Get a summary" }].map((s) => (
            <div key={s.l} style={{ borderRadius: "16px", padding: "20px 12px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(192,219,242,0.4)" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2B7FCC", marginBottom: "4px" }}>{s.l}</div>
              <div style={{ fontSize: "12px", color: "#5A7A96" }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
