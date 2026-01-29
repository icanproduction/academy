"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  CheckCircle,
  Download,
  Send,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface Brief {
  id: string;
  requestId: string;
  topic: string;
  keyMessage: string;
  duration: string;
  status: string;
  generatedBrief: string;
  createdAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const briefId = params.briefId as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState(false);

  // Chat refinement
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch brief
  useEffect(() => {
    const fetchBrief = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${clientId}/briefs/${briefId}`);
        if (res.ok) {
          const data = await res.json();
          setBrief(data);
        }
      } catch (error) {
        console.error("Error fetching brief:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrief();
  }, [clientId, briefId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current && showChat) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  const handleCopy = async () => {
    if (!brief?.generatedBrief) return;
    try {
      await navigator.clipboard.writeText(brief.generatedBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await fetch(`/api/clients/${clientId}/briefs/${briefId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });

      if (res.ok && brief) {
        setBrief({ ...brief, status: "Approved" });
      }
    } catch (error) {
      console.error("Error approving brief:", error);
    } finally {
      setApproving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    const userMessage = newMessage.trim();
    setNewMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSendingMessage(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/briefs/${briefId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-fg-muted mb-4">Brief tidak ditemukan</p>
          <Link href={`/dashboard/admin/clients/${clientId}`} className="text-accent hover:underline">
            Kembali ke Client
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/admin/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Client
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{brief.requestId}</h1>
              <p className="text-slate-500">{brief.topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              brief.status === "Approved" ? "bg-green-50 text-green-700" :
              brief.status === "Generated" ? "bg-blue-50 text-blue-700" :
              "bg-slate-100 text-slate-600"
            )}>
              {brief.status}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(brief.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Brief */}
        <div className="col-span-2 space-y-4">
          {/* Brief Content */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Generated Brief
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="prose prose-slate prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-slate-50 p-4 rounded-xl overflow-x-auto">
                {brief.generatedBrief}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {brief.status !== "Approved" && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                {approving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {approving ? "Approving..." : "Approve Brief"}
              </button>
            )}
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                showChat
                  ? "bg-accent text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <MessageSquare className="w-5 h-5" />
              {showChat ? "Hide Chat" : "Request Revision"}
            </button>
          </div>
        </div>

        {/* Sidebar - Chat or Info */}
        <div className="space-y-4">
          {/* Brief Info */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-3 text-sm">Brief Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Key Message</p>
                <p className="font-medium">{brief.keyMessage}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Duration</p>
                <p className="font-medium">{brief.duration}</p>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="glass-card rounded-2xl p-4 animate-fade-in">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                Refinement Chat
              </h3>

              {/* Messages */}
              <div className="h-64 overflow-y-auto space-y-3 mb-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <p>Ketik permintaan revisi</p>
                    <p className="text-xs mt-1">Contoh: "Hook pertama kurang menarik"</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-xl text-sm",
                        msg.role === "user"
                          ? "bg-accent text-white ml-4"
                          : "bg-slate-100 text-slate-700 mr-4"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
                {sendingMessage && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Ketik revisi..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    newMessage.trim() && !sendingMessage
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
