import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Compare",
  description: "Ask one question, get answers from multiple AI models side by side",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" style={{ background: "#000000" }}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#000000" }}>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
