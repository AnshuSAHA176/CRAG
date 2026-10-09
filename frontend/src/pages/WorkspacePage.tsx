import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { documentApi, type Document } from '../api/documents';
import { streamChat } from '../api/chat';
import { LogOut, Upload, FileText, Trash2, Send, Database, MessageSquare, Loader2, AlertCircle, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WorkspacePage: React.FC = () => {
  const { logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentApi.list();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setDocsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for document status
  useEffect(() => {
    const needsPolling = documents.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
    if (!needsPolling) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 5000);

    return () => clearInterval(interval);
  }, [documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await documentApi.upload(file.name, file);
      await fetchDocuments();
      setActiveTab('docs');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentApi.delete(id);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    await streamChat(
      userMessage.content,
      (token) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, content: msg.content + token } : msg
        ));
      },
      () => {
        setIsTyping(false);
      },
      (error) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, content: msg.content + `\n\n*[Error: ${error}]*` } : msg
        ));
        setIsTyping(false);
      }
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-sm">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-neutral-800 flex items-center gap-2 font-semibold">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          </div>
          Workspace
        </div>
        
        <div className="p-2 flex-grow overflow-y-auto">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn("w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors", activeTab === 'chat' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50')}
          >
            <MessageSquare className="w-4 h-4" /> Research Chat
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={cn("w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors mt-1", activeTab === 'docs' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50')}
          >
            <Database className="w-4 h-4" /> Knowledge Base
          </button>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button 
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-grow flex flex-col relative h-full">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 backdrop-blur">
          <div className="font-semibold flex items-center gap-2">CRAG</div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('chat')} className={cn("p-2 rounded-md", activeTab === 'chat' ? 'bg-neutral-800' : '')}><MessageSquare className="w-4 h-4" /></button>
            <button onClick={() => setActiveTab('docs')} className={cn("p-2 rounded-md", activeTab === 'docs' ? 'bg-neutral-800' : '')}><Database className="w-4 h-4" /></button>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-background to-background">
            <div className="flex-grow overflow-y-auto p-4 md:p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center mt-32 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-medium">How can I help with your research?</h2>
                    <p className="text-neutral-400 max-w-md">Ask questions based on your uploaded documents. The system will retrieve relevant context, evaluate it, and generate a grounded answer.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mt-1">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed overflow-x-auto",
                        msg.role === 'user' 
                          ? "bg-white text-black font-medium" 
                          : "bg-neutral-900 border border-neutral-800 text-neutral-200 prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800"
                      )}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        )}
                        {msg.role === 'assistant' && msg.content === '' && isTyping && (
                          <div className="flex gap-1 items-center h-5">
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="p-4 bg-background border-t border-neutral-800 shrink-0">
              <div className="max-w-3xl mx-auto relative">
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow shadow-sm">
                  <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about your documents..."
                    className="flex-grow bg-transparent border-none focus:outline-none resize-none py-2.5 px-3 max-h-32 min-h-[44px] text-base"
                    rows={1}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 m-0.5"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-center text-xs text-neutral-500 mt-2">
                  AI can make mistakes. Check important information against sources.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-background p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Knowledge Base</h2>
                  <p className="text-neutral-400 mt-1">Manage documents available for corrective retrieval.</p>
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
                    className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-12 text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="border border-neutral-800 border-dashed rounded-2xl p-12 text-center text-neutral-400 bg-neutral-900/20">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No documents found.</p>
                  <p className="text-sm mt-1">Upload a PDF or text file to begin building your knowledge base.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          doc.status === 'READY' ? "bg-primary/10 text-primary" :
                          doc.status === 'FAILED' ? "bg-red-500/10 text-red-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {doc.status === 'READY' ? <FileText className="w-5 h-5" /> : 
                           doc.status === 'FAILED' ? <AlertCircle className="w-5 h-5" /> :
                           <Loader2 className="w-5 h-5 animate-spin" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-200 truncate max-w-[200px] md:max-w-md" title={doc.title}>{doc.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                            <span className={cn(
                              "font-medium",
                              doc.status === 'READY' ? "text-primary/70" :
                              doc.status === 'FAILED' ? "text-red-400" :
                              "text-yellow-500/70"
                            )}>
                              {doc.status}
                            </span>
                            <span>•</span>
                            <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{new Date(doc.uploaded).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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