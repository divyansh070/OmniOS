"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Bell, Sun, User as UserIcon, Send, BookOpen, 
  Coffee, Calendar, GraduationCap, Sparkles, 
  CheckCircle2, Clock, MapPin, Search, LogOut, Plus
} from "lucide-react";
import Link from "next/link";

const MOCK_ACADEMICS = {
  schedule: [
    { course: "CS 301", name: "Data Structures", time: "10:00 AM", location: "Turing Hall 102" },
    { course: "MATH 201", name: "Linear Algebra", time: "01:00 PM", location: "Euler Bldg 204" }
  ]
};

const MOCK_CAFETERIA = {
  dinner: [
    { item: "Grilled Salmon with Asparagus", calories: "450", tags: ["healthy", "gluten-free"] },
    { item: "Vegan Buddha Bowl", calories: "380", tags: ["vegan"] },
    { item: "Margherita Pizza", calories: "600", tags: ["vegetarian"] }
  ]
};

const MOCK_EVENTS = [
  { title: "Tech Innovation Summit 2026", date: "JUN 15", location: "Main Auditorium", spots: "200" },
  { title: "AI/ML Workshop for Beginners", date: "JUN 16", location: "CS Lab 3", spots: "40" },
  { title: "Campus Hackathon Kickoff", date: "JUN 20", location: "Student Center", spots: "150" }
];

const MOCK_LIBRARY = [
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", tags: ["classic"] },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", tags: ["textbook"] },
  { title: "Designing Data-Intensive App.", author: "Martin Kleppmann", tags: ["advanced"] }
];

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
        fetch("/api/widgets/academics").then(res => res.json()).catch(() => ({ error: true })),
        fetch("/api/widgets/cafeteria").then(res => res.json()).catch(() => ({ error: true })),
        fetch("/api/widgets/events").then(res => res.json()).catch(() => ({ error: true })),
        fetch("/api/widgets/library").then(res => res.json()).catch(() => ({ error: true }))
      ]);
      setAcademics(acad.error ? MOCK_ACADEMICS : acad);
      setCafeteria(cafe.error ? MOCK_CAFETERIA : cafe);
      setEvents(evts.error ? MOCK_EVENTS : evts);
      setLibrary(lib.error ? MOCK_LIBRARY : lib);
    } catch (e) {
      setAcademics(MOCK_ACADEMICS);
      setCafeteria(MOCK_CAFETERIA);
      setEvents(MOCK_EVENTS);
      setLibrary(MOCK_LIBRARY);
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
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-white shadow-lg flex flex-col hidden md:flex z-10 relative">
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
          <div className="bg-indigo-50 text-indigo-600 rounded-xl px-4 py-3 font-medium flex items-center gap-3 text-sm border border-indigo-100 shadow-sm">
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

        <div className="mt-auto border-t border-slate-100/50 p-4">
          <div className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer group" onClick={() => signOut({ callbackUrl: '/' })}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-200 shadow-sm">
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
      <main className="flex-1 flex flex-col min-w-0 relative z-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/40 backdrop-blur-md border-b border-white/60 flex items-center justify-end px-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-4 text-slate-500">
            <button className="p-2 hover:bg-white/60 rounded-full transition-colors"><Bell className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-white/60 rounded-full transition-colors"><Sun className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 bg-white/50">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dashboard Asymmetric Layout */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative z-0">
          <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto pb-10">
            
            {/* LEFT COLUMN: Wide Widgets (Classes & Events) */}
            <div className="flex flex-col gap-6 xl:w-7/12">
              
              {/* Widget: Today's Classes */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative flex-1 min-h-[300px]">
                <div className="p-5 border-b border-white flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm"><BookOpen className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-slate-800">Today's Schedule</h2>
                  </div>
                  <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">Academics</span>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                  <div className="absolute top-6 bottom-6 left-[39px] w-0.5 bg-slate-200/60 rounded-full"></div>
                  {academics?.schedule ? academics.schedule.map((cls: any, i: number) => (
                    <div key={i} className="flex gap-6 mb-6 relative">
                      <div className="w-20 flex flex-col items-center shrink-0 bg-transparent z-10 py-1">
                        <span className="text-sm font-bold text-slate-800">{cls.time.split(" ")[0]}</span>
                        <span className="text-xs text-slate-500 font-medium">{cls.time.split(" ")[1]}</span>
                      </div>
                      <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{cls.course}: {cls.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-blue-500"><BookOpen className="w-3 h-3" /> Lecture</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cls.location}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading academic schedule...</div>
                  )}
                </div>
              </div>

              {/* Widget: Upcoming Events */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[320px]">
                <div className="p-5 border-b border-white flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 text-pink-600 rounded-xl shadow-sm"><Calendar className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
                  </div>
                  <span className="text-xs font-semibold text-pink-500 bg-pink-50 px-2 py-1 rounded-md">Events</span>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events ? events.slice(0,4).map((evt: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:border-pink-200 hover:shadow-md transition-all">
                      <div className="w-12 h-12 shrink-0 bg-pink-50 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-pink-500 uppercase">{evt.date.split(" ")[0]}</span>
                        <span className="text-sm font-bold text-slate-800">{evt.date.split(" ")[1] || "14"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs mb-1 line-clamp-2">{evt.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3" /> {evt.location}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 flex h-full items-center justify-center text-slate-400 text-sm">Loading events...</div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Vertical Widgets (Cafeteria & Library) */}
            <div className="flex flex-col gap-6 xl:w-5/12">
              
              {/* Widget: Cafeteria Menu */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative h-[320px]">
                <div className="p-5 border-b border-white flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-sm"><Coffee className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-slate-800">Cafeteria Menu</h2>
                  </div>
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Dining</span>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                  <h3 className="text-[10px] font-bold tracking-widest text-orange-400 uppercase mb-3">Dinner Menu</h3>
                  {cafeteria?.dinner ? cafeteria.dinner.map((item: any, i: number) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 mb-3 shadow-sm hover:border-orange-200 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{item.item}</h4>
                          <div className="flex gap-1 mt-1">
                             {item.tags?.includes("vegan") && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Vegan"></span>}
                             {item.tags?.includes("healthy") && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Healthy"></span>}
                             {item.tags?.includes("vegetarian") && <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Vegetarian"></span>}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 shadow-sm shrink-0">{item.calories} cal</span>
                      </div>
                    </div>
                  )) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading cafeteria menu...</div>
                  )}
                </div>
              </div>

              {/* Widget: Interdisciplinary Picks */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col relative flex-1 min-h-[300px]">
                <div className="p-5 border-b border-white flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 text-violet-600 rounded-xl shadow-sm"><BookOpen className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-slate-800">Library Picks</h2>
                  </div>
                  <span className="text-xs font-semibold text-violet-500 bg-violet-50 px-2 py-1 rounded-md">Library</span>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                  {library ? library.slice(0,3).map((book: any, i: number) => (
                    <div key={i} className="mb-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-violet-200 transition-all flex gap-3 items-center">
                      <div className="w-10 h-14 bg-slate-100 rounded-md shrink-0 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                         <div className="absolute top-0 w-full h-1 bg-violet-400"></div>
                         <BookOpen className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs mb-0.5 truncate">{book.title}</h4>
                        <p className="text-[10px] text-slate-500 mb-1.5 truncate">{book.author}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">Avail</span>
                          <span className="flex items-center gap-1 text-[9px] font-medium text-slate-400"><Sparkles className="w-2.5 h-2.5" /> Pick</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading library picks...</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Assistant */}
      <aside className="w-[380px] bg-white/80 backdrop-blur-xl border-l border-white flex flex-col z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.04)] hidden lg:flex">
        <div className="h-16 border-b border-white flex items-center justify-between px-6 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 text-white rounded-md shadow-sm shadow-indigo-500/20"><Sparkles className="w-4 h-4" /></div>
            <h2 className="font-bold text-slate-800 tracking-tight">OMNIOS AI</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Plus className="w-4 h-4" onClick={() => { setActiveChatId(null); setMessages([]); }} /></button>
            <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Clock className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">How can I help?</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                I am OmniOS AI. Ask me anything about library books, cafeteria menus, events, or your academic schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-sm shadow-sm border ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 text-indigo-700 font-bold" 
                      : "bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 border-transparent text-white shadow-indigo-500/20"
                  }`}>
                    {msg.role === "user" ? "U" : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? "bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tr-sm" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-sm text-white">
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

        <div className="p-4 bg-white/50 border-t border-white backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask OmniOS..."
              className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm rounded-full py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm placeholder-slate-400 font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

    </div>
  );
}
