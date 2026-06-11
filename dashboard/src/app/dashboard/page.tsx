"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Bell, Sun, User as UserIcon, Send, BookOpen, 
  Coffee, Calendar, GraduationCap, Sparkles, 
  CheckCircle2, Clock, MapPin, Search, LogOut, Plus
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Widget Data States
  const [academics, setAcademics] = useState<any>(null);
  const [cafeteria, setCafeteria] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [library, setLibrary] = useState<any>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWidgets();
      fetchChats();
    }
  }, [status]);

  const fetchWidgets = async () => {
    try {
      const [acad, cafe, evts, lib] = await Promise.all([
        fetch("/api/widgets/academics").then(res => res.json()).catch(() => null),
        fetch("/api/widgets/cafeteria").then(res => res.json()).catch(() => null),
        fetch("/api/widgets/events").then(res => res.json()).catch(() => null),
        fetch("/api/widgets/library").then(res => res.json()).catch(() => null)
      ]);
      if (!acad.error) setAcademics(acad);
      if (!cafe.error) setCafeteria(cafe);
      if (!evts.error) setEvents(evts);
      if (!lib.error) setLibrary(lib);
    } catch (e) {
      console.error("Failed to fetch widgets", e);
    }
  };

  const fetchChats = async () => {
    const res = await fetch("/api/chats", { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setActiveChatId(data[0].id);
        setMessages(data[0].messages || []);
      }
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
       }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        if (!reader) break;
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantMessage;
            return updated;
          });
        }
      }

      await fetch(`/api/chats/${currentChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...newMessages, { role: "assistant", content: assistantMessage }] }),
      });

    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-100 overflow-hidden font-sans text-slate-800">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10 shadow-sm">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              O
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 text-transparent bg-clip-text tracking-tight">
              OmniOS
            </span>
          </Link>
        </div>

        <div className="px-4">
          <div className="bg-indigo-50 text-indigo-600 rounded-xl px-4 py-3 font-medium flex items-center gap-3 text-sm border border-indigo-100">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-100">
              <Sparkles className="w-3 h-3" />
            </div>
            Dashboard
          </div>
        </div>

        <div className="mt-8 px-6">
          <h3 className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-4">System Status</h3>
          <ul className="space-y-4">
            {[
              { icon: GraduationCap, name: "Academics" },
              { icon: BookOpen, name: "Library" },
              { icon: Calendar, name: "Events" },
              { icon: Coffee, name: "Cafeteria" }
            ].map((sys, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-3">
                  <sys.icon className="w-4 h-4 text-slate-400" />
                  {sys.name}
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer group" onClick={() => signOut({ callbackUrl: '/' })}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-200">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{(session?.user as any)?.major || "Student"}</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 text-slate-500">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Bell className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Sun className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative z-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl mx-auto pb-10">
            
            {/* Widget: Today's Classes */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[380px]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen className="w-4 h-4" /></div>
                  <h2 className="font-semibold text-slate-800">Today's Classes</h2>
                </div>
                <span className="text-xs font-medium text-slate-400">Live from Academics</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 relative">
                <div className="absolute top-5 bottom-5 left-[31px] w-0.5 bg-slate-100 rounded-full"></div>
                {academics?.schedule ? academics.schedule.map((cls: any, i: number) => (
                  <div key={i} className="flex gap-6 mb-6 relative">
                    <div className="w-16 flex flex-col items-center shrink-0 bg-white z-10 py-1">
                      <span className="text-sm font-bold text-slate-800">{cls.time.split(" ")[0]}</span>
                      <span className="text-xs text-slate-400 font-medium">{cls.time.split(" ")[1]}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm hover:border-slate-200 transition-colors">
                      <h4 className="font-semibold text-slate-800 text-sm mb-1">{cls.course}: {cls.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Lecture</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cls.location}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading academic schedule...</div>
                )}
              </div>
            </div>

            {/* Widget: Cafeteria Menu */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[380px]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Coffee className="w-4 h-4" /></div>
                  <h2 className="font-semibold text-slate-800">Cafeteria Menu</h2>
                </div>
                <span className="text-xs font-medium text-slate-400">Live from Cafeteria</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <h3 className="text-xs font-bold tracking-wider text-blue-500 uppercase mb-4">Dinner Menu</h3>
                {cafeteria?.dinner ? cafeteria.dinner.map((item: any, i: number) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3 shadow-sm hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 text-sm">{item.item}</h4>
                        {item.tags?.includes("vegan") && <span className="w-2 h-2 rounded-full bg-green-500" title="Vegan"></span>}
                      </div>
                      <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{item.calories} cal</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Delicious campus dining option served fresh daily.</p>
                  </div>
                )) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading cafeteria menu...</div>
                )}
              </div>
            </div>

            {/* Widget: Upcoming Events */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[350px]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
                  <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
                </div>
                <span className="text-xs font-medium text-slate-400">Live from Events</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                {events ? events.slice(0,3).map((evt: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 mb-4 bg-slate-50 p-3 border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors">
                    <div className="w-14 h-14 shrink-0 bg-white rounded-lg border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-blue-500 uppercase">{evt.date.split(" ")[0]}</span>
                      <span className="text-lg font-bold text-slate-800">{evt.date.split(" ")[1] || "14"}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-1">{evt.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.location}</span>
                        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {evt.spots} max</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading events...</div>
                )}
              </div>
            </div>

            {/* Widget: Interdisciplinary Picks */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[350px]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><BookOpen className="w-4 h-4" /></div>
                  <h2 className="font-semibold text-slate-800">Interdisciplinary Picks</h2>
                </div>
                <span className="text-xs font-medium text-slate-400">Live from Library</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                {library ? library.slice(0,3).map((book: any, i: number) => (
                  <div key={i} className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm hover:border-slate-200 transition-colors">
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">{book.title}</h4>
                    <p className="text-xs text-slate-500 mb-3">{book.author}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">Available</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><Sparkles className="w-3 h-3" /> Suggested Read</span>
                    </div>
                  </div>
                )) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading library picks...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Right Sidebar: Assistant */}
      <aside className="w-[380px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] hidden lg:flex">
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 text-white rounded-md"><Sparkles className="w-4 h-4" /></div>
            <h2 className="font-semibold text-slate-800 tracking-tight">OMNIOS AI</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"><Plus className="w-4 h-4" onClick={() => { setActiveChatId(null); setMessages([]); }} /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"><Clock className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                I am OmniOS AI. Ask me anything about library books, cafeteria menus, events, or your academic schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-sm shadow-sm border ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-blue-100 to-indigo-100 border-indigo-200 text-indigo-700 font-bold" 
                      : "bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent text-white"
                  }`}>
                    {msg.role === "user" ? "U" : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-50 border border-slate-100 text-slate-700 rounded-tr-sm" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm text-white">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-200 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask OmniOS..."
              className="flex-1 bg-white border border-slate-300 text-slate-800 text-sm rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm placeholder-slate-400 font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-indigo-400 hover:bg-indigo-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Required mock Bot Icon missing from lucide standard imports above */}
      {/* Bot Icon Polyfill since we didn't import it at the top directly */}
    </div>
  );
}

function Bot(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}
