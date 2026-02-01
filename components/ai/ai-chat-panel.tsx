"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Loader2, Sparkles, AlertCircle, Mic, FileText, MessageSquare, Target, RefreshCw, Lightbulb } from "lucide-react";
import { ChatMessage, AISuggestion, BriefSection } from "@/types/brief";
import { AIMessage } from "./ai-message";
import { cn } from "@/lib/utils";

// localStorage key helper
const getChatStorageKey = (contentId: string) => `ican_chat_${contentId}`;

interface AIChatPanelProps {
  contentId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  isEditable: boolean;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  revisionFeedback?: string | null;
  briefSections: BriefSection[];
}

export function AIChatPanel({
  contentId,
  messages,
  onMessagesChange,
  isEditable,
  onApplySuggestion,
  revisionFeedback,
  briefSections,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedFromStorage = useRef(false);

  // Load chat history from localStorage on mount (as fallback/merge)
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;

    try {
      const savedChat = localStorage.getItem(getChatStorageKey(contentId));
      if (savedChat) {
        const parsedMessages: ChatMessage[] = JSON.parse(savedChat);
        // Only use localStorage if we have more messages than from API
        // This handles the case where API returns empty but localStorage has data
        if (parsedMessages.length > 0 && messages.length === 0) {
          onMessagesChange(parsedMessages);
        }
      }
    } catch (err) {
      console.error("Error loading chat from localStorage:", err);
    }
  }, [contentId, messages.length, onMessagesChange]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(getChatStorageKey(contentId), JSON.stringify(messages));
      } catch (err) {
        console.error("Error saving chat to localStorage:", err);
      }
    }
  }, [messages, contentId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setInput("");
    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);

    try {
      // Format conversation history for API (only role and content)
      const historyForApi = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`/api/contents/${contentId}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          briefSections,
          conversationHistory: historyForApi,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.message || data.response || "Maaf, ada error.",
        timestamp: new Date().toISOString(),
        suggestions: data.suggestions,
        actions: data.actions,
      };

      onMessagesChange([...updatedMessages, assistantMessage]);

      // If there are actions, apply them automatically
      if (data.actions && data.actions.length > 0) {
        // Actions will be handled by parent component
      }
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action prompts with Lucide icons
  const quickActions = [
    {
      label: "Generate Hook",
      icon: Mic,
      color: "blue",
      prompt: "Buatkan 3 opsi hook yang menarik untuk konten ini. Berikan variasi antara problem hook, curiosity hook, dan benefit hook.",
    },
    {
      label: "Buat Script",
      icon: FileText,
      color: "purple",
      prompt: "Buatkan struktur detail konten ini scene by scene. Mulai dari hook, body content, sampai CTA.",
    },
    {
      label: "Draft Caption",
      icon: MessageSquare,
      color: "orange",
      prompt: "Buatkan draft caption yang engaging untuk konten ini. Include relevant hashtags.",
    },
    {
      label: "Review Brief",
      icon: RefreshCw,
      color: "green",
      prompt: "Tolong review brief saat ini. Apa yang masih kurang atau perlu diperbaiki?",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
    purple: "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
    green: "bg-green-50 border-green-200 text-green-600 hover:bg-green-100",
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">AI Assistant</h2>
          <p className="text-xs text-slate-500">Bantu develop brief kamu</p>
        </div>
      </div>

      {/* Revision Alert */}
      {revisionFeedback && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 text-sm">
                Revision Request
              </h4>
              <p className="text-sm text-amber-700 mt-1 whitespace-pre-wrap">
                {revisionFeedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Scrollable Container */}
      <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-violet-400 mb-3" />
            <h3 className="font-medium text-slate-700 mb-1">
              AI siap membantu!
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Tanyakan apapun tentang brief konten kamu
            </p>

            {/* Quick Actions - Grid Layout with Lucide Icons */}
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => setInput(action.prompt)}
                    className={cn(
                      "flex items-center gap-2 text-xs px-3 py-2.5 border rounded-lg transition-colors duration-150 text-left font-medium",
                      colorClasses[action.color]
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <AIMessage
              key={message.id}
              message={message}
              isEditable={isEditable}
              onApplySuggestion={onApplySuggestion}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2.5 rounded-xl transition-colors shrink-0",
              input.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
