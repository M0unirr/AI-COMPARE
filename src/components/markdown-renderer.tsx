"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 style={{ fontSize: "20px", fontWeight: "700", margin: "16px 0 8px", color: "rgba(255,255,255,0.95)" }}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: "17px", fontWeight: "600", margin: "14px 0 6px", color: "rgba(255,255,255,0.95)" }}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 4px", color: "rgba(255,255,255,0.95)" }}>
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p style={{ margin: "0 0 10px", lineHeight: "1.7" }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: "8px 0", paddingLeft: "20px", lineHeight: "1.7" }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: "8px 0", paddingLeft: "20px", lineHeight: "1.7" }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ margin: "4px 0" }}>{children}</li>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  overflowX: "auto",
                  margin: "8px 0",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", color: "rgba(255,255,255,0.9)" }}>
                  {children}
                </code>
              </pre>
            );
          }
          return (
            <code
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                color: "#e879f9",
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "3px solid rgba(43,127,204,0.6)",
              margin: "8px 0",
              padding: "4px 12px",
              color: "rgba(255,255,255,0.7)",
              background: "rgba(43,127,204,0.05)",
              borderRadius: "0 8px 8px 0",
            }}
          >
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: "600", color: "rgba(255,255,255,0.95)" }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#60a5fa", textDecoration: "underline" }}
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "8px 0" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: "13px",
              }}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{children}</tr>
        ),
        th: ({ children }) => (
          <th
            style={{
              padding: "8px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.85)" }}>{children}</td>
        ),
        hr: () => (
          <hr
            style={{
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              margin: "12px 0",
            }}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
