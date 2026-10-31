
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../store/AuthContext";
import { documentApi, type Document } from "../api/documents";
import {
  streamChat,
  resumeChat,
  type EmailApproval,
} from "../api/chat";
import {
  LogOut,
  Upload,
  FileText,
  Trash2,
  Send,
  Database,
  MessageSquare,
  Loader2,
  AlertCircle,
  Search,
  MailCheck,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WorkspacePage: React.FC = () => {
  const { logout } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");

  const [pendingApproval, setPendingApproval] =
    useState<EmailApproval | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentApi.list();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDocuments();
  }, []);

  useEffect(() => {
    const needsPolling = documents.some(
      (doc) => doc.status === "PENDING" || doc.status === "PROCESSING",
    );

    if (!needsPolling) return;

    const interval = window.setInterval(() => {
      void fetchDocuments();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, pendingApproval]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      await documentApi.upload(file.name, file);
      await fetchDocuments();
      setActiveTab("docs");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await documentApi.delete(id);
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const appendToAssistantMessage = (
    messageId: string,
    text: string,
  ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: msg.content + text }
          : msg,
      ),
    );
  };

  const handleSendMessage = async (
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
    e?.preventDefault();

    if (!input.trim() || isTyping || isApproving || pendingApproval) {
      return;
    }

    const question = input.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      await streamChat(
        question,
        (text) => {
          appendToAssistantMessage(assistantMessageId, text);
        },
        () => {
          setIsTyping(false);
        },
        (error) => {
          appendToAssistantMessage(
            assistantMessageId,
            `\n\n**Error:** ${error}`,
          );
          setIsTyping(false);
        },
        (approval) => {
          setPendingApproval(approval);
          setIsTyping(false);
        },
      );
    } catch (error) {
      appendToAssistantMessage(
        assistantMessageId,
        `\n\n**Error:** ${
          error instanceof Error ? error.message : "Request failed."
        }`,
      );
      setIsTyping(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!pendingApproval || isApproving) return;

    setIsApproving(true);
    setIsTyping(true);

    const statusMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: statusMessageId,
        role: "assistant",
        content: approved
          ? "Approval received. Sending the email..."
          : "Rejecting the email request...",
      },
    ]);

    try {
      await resumeChat(approved, {
        onToken: (text) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === statusMessageId
                ? {
                    ...msg,
                    content:
                      msg.content +
                      (msg.content.includes("...\n\n") ? "" : "\n\n") +
                      text,
                  }
                : msg,
            ),
          );
        },
        onApproval: (approval) => {
          setPendingApproval(approval);
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === statusMessageId
                ? {
                    ...msg,
                    content: `**Approval error:** ${error}`,
                  }
                : msg,
            ),
          );
        },
      });

      setPendingApproval(null);
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusMessageId
            ? {
                ...msg,
                content: `**Error:** ${
                  error instanceof Error
                    ? error.message
                    : "Could not resume the agent."
                }`,
              }
            : msg,
        ),
      );
    } finally {
      setIsApproving(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-sm">
      <aside className="hidden w-64 flex-col border-r border-neutral-800 bg-neutral-900/50 md:flex">
        <div className="flex items-center gap-2 border-b border-neutral-800 p-4 font-semibold">
          <div className="flex h-5 w-5 items-center justify-center rounded border border-primary/50 bg-primary/20">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          Workspace
        </div>

        <div className="flex-grow overflow-y-auto p-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              activeTab === "chat"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white",
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Research Chat
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              activeTab === "docs"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white",
            )}
          >
            <Database className="h-4 w-4" />
            Knowledge Base
          </button>
        </div>

        <div className="border-t border-neutral-800 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="relative flex h-full flex-grow flex-col">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur md:hidden">
          <div className="font-semibold">CRAG</div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "rounded-md p-2",
                activeTab === "chat" && "bg-neutral-800",
              )}
              aria-label="Research chat"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={cn(
                "rounded-md p-2",
                activeTab === "docs" && "bg-neutral-800",
              )}
              aria-label="Knowledge base"
            >
              <Database className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeTab === "chat" ? (
          <div className="flex h-full flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-background to-background">
            <div className="flex-grow overflow-y-auto p-4 md:p-8">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.length === 0 ? (
                  <div className="mt-32 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-medium">
                      How can I help with your research?
                    </h2>
                    <p className="max-w-md text-neutral-400">
                      Ask questions based on your uploaded documents. The
                      system retrieves relevant context and generates a
                      grounded answer.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-4",
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/20">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] overflow-x-auto rounded-2xl px-5 py-3.5 leading-relaxed",
                          msg.role === "user"
                            ? "bg-white font-medium text-black"
                            : "prose prose-invert border border-neutral-800 bg-neutral-900 text-neutral-200 prose-p:leading-relaxed prose-pre:border prose-pre:border-neutral-800 prose-pre:bg-neutral-950",
                        )}
                      >
                        {msg.role === "user" ? (
                          msg.content
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}

                        {msg.role === "assistant" &&
                          msg.content === "" &&
                          isTyping && (
                            <div className="flex h-5 items-center gap-1">
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0.2s]" />
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0.4s]" />
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-neutral-800 bg-background p-4">
              <div className="relative mx-auto max-w-3xl">
                {pendingApproval && (
                  <section
                    className="mb-4 rounded-xl border border-yellow-600/40 bg-neutral-900 p-5"
                    aria-label="Email approval"
                  >
                    <div className="flex items-center gap-2">
                      <MailCheck className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-base font-semibold text-white">
                        Approval required
                      </h3>
                    </div>

                    <p className="mt-2 text-neutral-300">
                      {pendingApproval.instruction ||
                        "Do you approve sending this email?"}
                    </p>

                    <div className="mt-3 space-y-2 break-words text-sm text-neutral-400">
                      <p>
                        <strong>To:</strong> {pendingApproval.email}
                      </p>
                      <p>
                        <strong>Subject:</strong> {pendingApproval.subject}
                      </p>
                      <p>
                        <strong>Reason:</strong> {pendingApproval.reason}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={() => void handleApproval(true)}
                        className="rounded-lg bg-white px-4 py-2 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isApproving
                          ? "Processing..."
                          : "Approve and send"}
                      </button>

                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={() => void handleApproval(false)}
                        className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </section>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="relative flex items-end gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-primary/50"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Ask about your documents..."
                    disabled={isTyping || isApproving || !!pendingApproval}
                    className="min-h-[44px] max-h-32 flex-grow resize-none border-none bg-transparent px-3 py-2.5 text-base focus:outline-none disabled:opacity-50"
                    rows={1}
                  />

                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      isTyping ||
                      isApproving ||
                      !!pendingApproval
                    }
                    className="m-0.5 shrink-0 rounded-xl bg-primary p-2.5 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>

                <div className="mt-2 text-center text-xs text-neutral-500">
                  AI can make mistakes. Check important information against
                  sources.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-y-auto bg-background p-4 md:p-8">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Knowledge Base
                  </h2>
                  <p className="mt-1 text-neutral-400">
                    Manage documents available for retrieval.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.txt,.md"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </button>
                </div>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-12 text-neutral-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center text-neutral-400">
                  <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  <p>No documents found.</p>
                  <p className="mt-1 text-sm">
                    Upload a PDF or text file to begin building your knowledge
                    base.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="glass-panel group flex items-center justify-between rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            doc.status === "READY"
                              ? "bg-primary/10 text-primary"
                              : doc.status === "FAILED"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-yellow-500/10 text-yellow-500",
                          )}
                        >
                          {doc.status === "READY" ? (
                            <FileText className="h-5 w-5" />
                          ) : doc.status === "FAILED" ? (
                            <AlertCircle className="h-5 w-5" />
                          ) : (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          )}
                        </div>

                        <div>
                          <h3
                            className="max-w-[200px] truncate font-medium text-neutral-200 md:max-w-md"
                            title={doc.title}
                          >
                            {doc.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                            <span
                              className={cn(
                                "font-medium",
                                doc.status === "READY"
                                  ? "text-primary/70"
                                  : doc.status === "FAILED"
                                    ? "text-red-400"
                                    : "text-yellow-500/70",
                              )}
                            >
                              {doc.status}
                            </span>
                            <span>•</span>
                            <span>
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(doc.uploaded).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => void handleDeleteDoc(doc.id)}
                          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Delete"
                          aria-label={`Delete ${doc.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkspacePage;
