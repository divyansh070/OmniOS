"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, Plus, Trash2, LogOut, Sparkles, User } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchChats();
    }
  }, [status]);

  const fetchChats = async () => {
    const res = await fetch("/api/chats", { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setChats(data);
    }
  };

  const createNewChat = async () => {
    const res = await fetch("/api/chats", { method: "POST" });
    if (res.ok) {
      const newChat = await res.json();
      setChats([newChat, ...chats]);
      setActiveChatId(newChat.id);
      setMessages([]);
    }
  };

  const switchChat = (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setActiveChatId(id);
      setMessages(chat.messages || []);
    }
  };

  const deleteChat = async (id: string, e: any) => {
    e.stopPropagation();
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    setChats(chats.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let currentChatId = activeChatId;
    if (!currentChatId) {
       const res = await fetch("/api/chats", { method: "POST" });
       if (res.ok) {
         const newChat = await res.json();
         currentChatId = newChat.id;
         setActiveChatId(currentChatId);
         setChats([newChat, ...chats]);
       }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      // Add an empty assistant message that will be updated as the stream comes in
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      let streamedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          streamedText += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const newArr = [...prev];
            newArr[newArr.length - 1] = { role: "assistant", content: streamedText };
            return newArr;
          });
        }
      }

      const finalMessages = [...newMessages, { role: "assistant", content: streamedText }];
      if (currentChatId) {
        await fetch(`/api/chats/${currentChatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: finalMessages })
        });
        fetchChats(); // Refresh to update title if it was generated
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10 flex flex-col min-h-0">
        <header className="flex items-center justify-between py-6 border-b border-white/5 mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <Link href="/" className="text-2xl md:text-3xl font-light tracking-tight text-white flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text font-semibold">Omni</span> 
                OS
              </Link>
              <p className="text-xs md:text-sm text-slate-400 mt-1">Unified Campus Dashboard</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             {status === "authenticated" && (
                <div className="flex items-center gap-3 mr-4 border-r border-white/10 pr-4">
                  {[
                    { name: "Library", icon: "📚", color: "text-blue-400" },
                    { name: "Cafeteria", icon: "🍔", color: "text-orange-400" },
                    { name: "Events", icon: "🎉", color: "text-pink-400" },
                    { name: "Academics", icon: "🎓", color: "text-violet-400" }
                  ].map((sys) => (
                    <div key={sys.name} className="relative group cursor-help">
                      <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm shadow-inner group-hover:bg-white/10 transition-colors ${sys.color}`}>
                        {sys.icon}
                      </div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {sys.name} - Active
                      </div>
                    </div>
                  ))}
                </div>
             )}
             {status === "authenticated" ? (
               <div className="flex items-center gap-4">
                 <div className="text-right">
                   <p className="text-sm font-medium text-white">{session.user?.name}</p>
                   <p className="text-xs text-indigo-300">{(session.user as any)?.major}</p>
                 </div>
                 <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 transition-colors cursor-pointer">
                   Sign Out
                 </button>
               </div>
             ) : (
               <button onClick={() => signIn()} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/25">
                 Student Login
               </button>
             )}
             
             <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300 flex items-center gap-2 backdrop-blur-sm ml-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                Systems Online
             </div>
          </div>
        </header>

        {/* Mobile Sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/95 border-r border-white/10 p-6 flex flex-col gap-6 transform transition-transform duration-300 backdrop-blur-xl lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-cyan-400 w-5 h-5" />
              Omni<span className="text-slate-400 font-light">OS</span>
            </span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10" title="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => { createNewChat(); setIsSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium flex items-center gap-2 justify-center transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Recent Chats</h3>
            {chats.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 italic">No chats yet.</p>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} onClick={() => { switchChat(chat.id); setIsSidebarOpen(false); }} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                   <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-lg opacity-70">💬</span>
                      <span className={`text-sm truncate ${activeChatId === chat.id ? 'text-indigo-200' : 'text-slate-300'}`}>{chat.title}</span>
                   </div>
                   <button onClick={(e) => deleteChat(chat.id, e)} className="text-slate-500 hover:text-red-400 transition-all p-1 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))
            )}
          </div>

          {status === "authenticated" && (
            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{session.user?.name}</p>
                  <p className="text-xs text-indigo-300">{(session.user as any)?.major}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { name: "Library", icon: "📚" },
                  { name: "Cafeteria", icon: "🍔" },
                  { name: "Events", icon: "🎉" },
                  { name: "Academics", icon: "🎓" }
                ].map((sys) => (
                  <div key={sys.name} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
                    <span>{sys.icon}</span>
                    <span>{sys.name}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0 pb-4">
          
          {/* Left Panel: Chat History Sidebar (Desktop only) */}
          <div className="hidden lg:flex flex-col gap-4 col-span-1 bg-white/[0.01] rounded-3xl border border-white/5 p-4 relative overflow-hidden backdrop-blur-sm">
             <button onClick={createNewChat} className="w-full py-3 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium flex items-center gap-2 justify-center transition-all cursor-pointer">
                <Plus className="w-5 h-5" />
                New Chat
             </button>
             
             <div className="flex-1 overflow-y-auto mt-4 space-y-2 custom-scrollbar pr-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Recent Chats</h3>
                {chats.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 italic">No chats yet. Start a new one!</p>
                ) : (
                  chats.map((chat) => (
                    <div key={chat.id} onClick={() => switchChat(chat.id)} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-lg opacity-70">💬</span>
                          <span className={`text-sm truncate ${activeChatId === chat.id ? 'text-indigo-200' : 'text-slate-300 group-hover:text-white'}`}>{chat.title}</span>
                       </div>
                       <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Right Panel: Chat Interface */}
          <div className="lg:col-span-3 flex flex-col bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center px-4">
                  <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                     <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-500 cursor-default">
                        <span className="text-2xl text-white">✨</span>
                     </div>
                     <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">How can I help you today?</h2>
                     <p className="text-slate-400 text-sm mb-10 leading-relaxed">Try asking about what's for lunch, upcoming events, or finding a book in the library. Data is fetched live from independent MCP servers.</p>
                     
                     <div className="flex flex-wrap gap-3 justify-center">
                       {["What's for lunch today?", "Find the book 'Clean Code'", "When is the next Hackathon?"].map((suggestion, i) => (
                         <button 
                           key={suggestion}
                           onClick={() => setInput(suggestion)}
                           className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                           style={{ animationDelay: `${i * 100}ms` }}
                         >
                           {suggestion}
                         </button>
                       ))}
                     </div>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-sm shadow-lg shadow-indigo-900/20' 
                      : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-sm shadow-md backdrop-blur-md'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                         <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-xs">✨</span>
                         </div>
                         <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI Assistant</span>
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-light">
                       {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 relative z-20">
              <form onSubmit={handleSubmit} className="relative flex items-center group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={status === "authenticated" ? "Ask the campus assistant..." : "Please log in to chat..."}
                  disabled={status !== "authenticated" || isLoading}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all relative z-10 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-500 transition-all shadow-md active:scale-95"
                >
                  <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
