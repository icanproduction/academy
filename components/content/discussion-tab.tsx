"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Film,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GoogleDriveEmbed, isGoogleDriveUrl } from "./google-drive-embed";

interface Discussion {
  id: string;
  authorName: string;
  message: string;
  type: "comment" | "revision_request" | "approval";
  createdAt: string;
}

interface RevisionPoint {
  id: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

interface DiscussionTabProps {
  contentId: string;
  revisionFeedback?: string | null;
  outputUrl?: string;
}

export function DiscussionTab({ contentId, revisionFeedback, outputUrl }: DiscussionTabProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [revisionPoints, setRevisionPoints] = useState<RevisionPoint[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newRevisionPoint, setNewRevisionPoint] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState("You");
  const [userClientId, setUserClientId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Check if outputUrl is a Google Drive URL
  const hasGoogleDriveOutput = isGoogleDriveUrl(outputUrl || "");

  // Get user info from session
  useEffect(() => {
    const session = localStorage.getItem("ican_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserName(parsed.name || "You");
        setUserClientId(parsed.clientId || null);
      } catch (e) {
        console.error("Error parsing session:", e);
      }
    }
  }, []);

  // Fetch discussions and revision points
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch comments/discussions
        const commentsRes = await fetch(`/api/contents/${contentId}/comments`);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          const comments = data.data || data || [];
          setDiscussions(Array.isArray(comments) ? comments : []);
        }

        // If there's revision feedback, add it as initial revision point
        if (revisionFeedback) {
          setRevisionPoints([
            {
              id: "revision-feedback",
              description: revisionFeedback,
              status: "open",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching discussions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contentId, revisionFeedback]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/contents/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          authorId: userClientId,
          authorName: userName,
          type: "comment",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDiscussions([
          ...discussions,
          {
            id: data.id || `msg-${Date.now()}`,
            authorName: userName,
            message: newMessage,
            type: "comment",
            createdAt: new Date().toISOString(),
          },
        ]);
        setNewMessage("");
      } else {
        console.error("Failed to send message:", data.error);
        alert("Gagal mengirim komentar: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Gagal mengirim komentar");
    } finally {
      setSending(false);
    }
  };

  const handleAddRevisionPoint = () => {
    if (!newRevisionPoint.trim()) return;

    setRevisionPoints([
      ...revisionPoints,
      {
        id: `rp-${Date.now()}`,
        description: newRevisionPoint,
        status: "open",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewRevisionPoint("");
  };

  const toggleRevisionStatus = (id: string) => {
    setRevisionPoints(
      revisionPoints.map((rp) =>
        rp.id === id
          ? { ...rp, status: rp.status === "resolved" ? "open" : "resolved" }
          : rp
      )
    );
  };

  const getStatusIcon = (status: RevisionPoint["status"]) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Output Preview Section - Collapsible */}
      {hasGoogleDriveOutput && outputUrl && (
        <div className="max-w-6xl mx-auto mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 w-full p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mb-2"
          >
            <Film className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-700 flex-1 text-left">
              Preview Output
            </span>
            {showPreview ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {showPreview && (
            <div className="animate-fade-in">
              <GoogleDriveEmbed url={outputUrl} />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {/* Discussion Thread - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Diskusi
          </h3>

          {/* Messages */}
          <div className="space-y-3 md:space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
            {discussions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Belum ada diskusi</p>
              </div>
            ) : (
              discussions.map((disc) => (
                <div
                  key={disc.id}
                  className={cn(
                    "p-4 rounded-lg",
                    disc.type === "revision_request"
                      ? "bg-amber-50 border border-amber-200"
                      : disc.type === "approval"
                      ? "bg-green-50 border border-green-200"
                      : "bg-white border border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{disc.authorName}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(disc.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {disc.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Message Input */}
          <div className="flex gap-2 mt-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tulis komentar atau feedback... (Enter untuk kirim)"
              rows={2}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={cn(
                "px-4 rounded-lg transition-colors flex items-center justify-center",
                newMessage.trim() && !sending
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Revision Points - 1/3 width */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Point Revisi
            </h3>
            <span className="text-xs text-slate-500">
              {revisionPoints.filter((rp) => rp.status === "resolved").length}/{revisionPoints.length} selesai
            </span>
          </div>

          {/* Revision Points List */}
          <div className="space-y-2">
            {revisionPoints.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                <p>Tidak ada point revisi</p>
              </div>
            ) : (
              revisionPoints.map((point) => (
                <div
                  key={point.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    point.status === "resolved"
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-slate-200 hover:border-amber-300"
                  )}
                  onClick={() => toggleRevisionStatus(point.id)}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(point.status)}
                    <p
                      className={cn(
                        "text-sm flex-1",
                        point.status === "resolved" && "line-through text-slate-400"
                      )}
                    >
                      {point.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Revision Point */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newRevisionPoint}
                onChange={(e) => setNewRevisionPoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRevisionPoint()}
                placeholder="Tambah point revisi..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                onClick={handleAddRevisionPoint}
                disabled={!newRevisionPoint.trim()}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  newRevisionPoint.trim()
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
