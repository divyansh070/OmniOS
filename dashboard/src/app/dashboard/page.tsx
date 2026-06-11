"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Bell, Sun, Moon, User as UserIcon, Send, BookOpen, 
  Coffee, Calendar, GraduationCap, Sparkles, 
  CheckCircle2, Clock, MapPin, Search, LogOut, Plus, Trash2, X
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

  // Feature States
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.body.style.userSelect = "auto";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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
      setChatsList(data);
      if (data.length > 0) {
        setActiveChatId(data[0].id);
        setMessages(data[0].messages || []);
      }
    }
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    const updated = chatsList.filter(c => c.id !== id);
    setChatsList(updated);
    if (activeChatId === id) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        setActiveChatId(null);
        setMessages([]);
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
         setChatsList(prev => [newChat, ...prev]);
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

      // Refresh chat list to ensure names are updated
      fetchChats();

    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // --- Theme Classes ---
  const theme = {
    bgApp: isDarkMode ? "bg-slate-950 text-slate-100" : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-100 text-slate-800",
    bgSidebar: isDarkMode ? "bg-slate-900/80 border-slate-800 text-slate-300" : "bg-white/80 border-white text-slate-600",
    bgHeader: isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white/40 border-white/60",
    bgWidget: isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-white",
    bgWidgetInner: isDarkMode ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-slate-100 hover:border-blue-200",
    textHeading: isDarkMode ? "text-slate-100" : "text-slate-800",
    textSub: isDarkMode ? "text-slate-400" : "text-slate-500",
    borderStandard: isDarkMode ? "border-slate-800" : "border-slate-200",
    btnHover: isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${theme.bgApp} ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Left Sidebar */}
      <aside className={`w-64 backdrop-blur-xl border-r shadow-lg flex flex-col hidden md:flex z-10 relative transition-colors duration-300 ${theme.bgSidebar}`}>
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
          <div className="bg-indigo-500/10 text-indigo-500 rounded-xl px-4 py-3 font-medium flex items-center gap-3 text-sm border border-indigo-500/20 shadow-sm">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-500/20">
              <Sparkles className="w-3 h-3" />
            </div>
            Dashboard
          </div>
        </div>

        <div className="mt-8 px-6">
          <h3 className={`text-xs font-semibold tracking-widest uppercase mb-4 ${theme.textSub}`}>System Status</h3>
          <ul className="space-y-4">
            {[
              { icon: GraduationCap, name: "Academics" },
              { icon: BookOpen, name: "Library" },
              { icon: Calendar, name: "Events" },
              { icon: Coffee, name: "Cafeteria" }
            ].map((sys, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-3">
                  <sys.icon className={`w-4 h-4 ${theme.textSub}`} />
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

        <div className={`mt-auto border-t p-4 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer group ${theme.btnHover}`} onClick={() => signOut({ callbackUrl: '/' })}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-indigo-500 font-semibold border border-indigo-500/30 shadow-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${theme.textHeading}`}>{session?.user?.name}</p>
              <p className={`text-xs truncate ${theme.textSub}`}>{(session?.user as any)?.major || "Student"}</p>
            </div>
            <LogOut className={`w-4 h-4 ${theme.textSub} group-hover:text-red-500 transition-colors`} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-0">
        {/* Top Navbar */}
        <header className={`h-16 backdrop-blur-md border-b flex items-center justify-end px-6 shadow-sm z-30 sticky top-0 transition-colors ${theme.bgHeader}`}>
          <div className="flex items-center gap-4 text-slate-500 relative">
            
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative ${theme.btnHover} ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
              </button>
              
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border overflow-hidden z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className={`p-4 border-b font-semibold flex justify-between items-center ${isDarkMode ? 'border-slate-700 text-slate-100' : 'border-slate-100 text-slate-800'}`}>
                    Notifications
                    <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-md">2 New</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    <div className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <p className="text-sm font-medium"><span className="text-pink-500">Event Update:</span> Tech Innovation Summit has been moved to the Main Auditorium.</p>
                      <p className="text-[10px] text-slate-400 mt-1">10 mins ago</p>
                    </div>
                    <div className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <p className="text-sm font-medium"><span className="text-blue-500">Academics:</span> CS 301 Data Structures begins in 15 minutes.</p>
                      <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${theme.btnHover} ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-white/50 text-slate-500 hover:bg-white'}`}
              >
                <UserIcon className="w-4 h-4" />
              </button>

              {showProfile && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <p className={`text-sm font-bold ${theme.textHeading}`}>{session?.user?.name}</p>
                    <p className={`text-xs ${theme.textSub}`}>{(session?.user as any)?.major || "Student"}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => signOut({ callbackUrl: '/' })} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-500 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'} transition-colors`}>
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Asymmetric Layout */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative z-0">
          <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto pb-10">
            
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-6 xl:w-7/12">
              
              {/* Widget: Today's Classes */}
              <div className={`backdrop-blur-xl rounded-3xl border shadow-lg overflow-hidden flex flex-col relative flex-1 min-h-[300px] transition-colors ${theme.bgWidget}`}>
                <div className={`p-5 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent ${isDarkMode ? 'border-slate-700' : 'border-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl shadow-sm"><BookOpen className="w-4 h-4" /></div>
                    <h2 className={`font-semibold ${theme.textHeading}`}>Today's Schedule</h2>
                  </div>
                  <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">Academics</span>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                  <div className="absolute top-6 bottom-6 left-[39px] w-0.5 bg-slate-500/20 rounded-full"></div>
                  {academics?.schedule ? academics.schedule.map((cls: any, i: number) => (
                    <div key={i} className="flex gap-6 mb-6 relative">
                      <div className="w-20 flex flex-col items-center shrink-0 bg-transparent z-10 py-1">
                        <span className={`text-sm font-bold ${theme.textHeading}`}>{cls.time.split(" ")[0]}</span>
                        <span className={`text-xs font-medium ${theme.textSub}`}>{cls.time.split(" ")[1]}</span>
                      </div>
                      <div className={`flex-1 border rounded-2xl p-4 shadow-sm transition-all ${theme.bgWidgetInner}`}>
                        <h4 className={`font-bold text-sm mb-1 ${theme.textHeading}`}>{cls.course}: {cls.name}</h4>
                        <div className={`flex items-center gap-4 text-xs font-medium ${theme.textSub}`}>
                          <span className="flex items-center gap-1 text-blue-500"><BookOpen className="w-3 h-3" /> Lecture</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cls.location}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className={`flex h-full items-center justify-center text-sm ${theme.textSub}`}>Loading academic schedule...</div>
                  )}
                </div>
              </div>

              {/* Widget: Upcoming Events */}
              <div className={`backdrop-blur-xl rounded-3xl border shadow-lg overflow-hidden flex flex-col relative h-[320px] transition-colors ${theme.bgWidget}`}>
                <div className={`p-5 border-b flex items-center justify-between bg-gradient-to-r from-pink-500/10 to-transparent ${isDarkMode ? 'border-slate-700' : 'border-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 text-pink-500 rounded-xl shadow-sm"><Calendar className="w-4 h-4" /></div>
                    <h2 className={`font-semibold ${theme.textHeading}`}>Upcoming Events</h2>
                  </div>
                  <span className="text-xs font-semibold text-pink-500 bg-pink-500/10 px-2 py-1 rounded-md">Events</span>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events ? events.slice(0,4).map((evt: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-4 border rounded-2xl shadow-sm hover:border-pink-500/50 hover:shadow-md transition-all ${theme.bgWidgetInner}`}>
                      <div className="w-12 h-12 shrink-0 bg-pink-500/10 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-pink-500 uppercase">{evt.date.split(" ")[0]}</span>
                        <span className={`text-sm font-bold ${theme.textHeading}`}>{evt.date.split(" ")[1] || "14"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-xs mb-1 line-clamp-2 ${theme.textHeading}`}>{evt.title}</h4>
                        <div className={`flex items-center gap-2 text-[10px] font-medium ${theme.textSub}`}>
                          <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3" /> {evt.location}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className={`col-span-2 flex h-full items-center justify-center text-sm ${theme.textSub}`}>Loading events...</div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6 xl:w-5/12">
              
              {/* Widget: Cafeteria Menu */}
              <div className={`backdrop-blur-xl rounded-3xl border shadow-lg overflow-hidden flex flex-col relative h-[320px] transition-colors ${theme.bgWidget}`}>
                <div className={`p-5 border-b flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent ${isDarkMode ? 'border-slate-700' : 'border-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl shadow-sm"><Coffee className="w-4 h-4" /></div>
                    <h2 className={`font-semibold ${theme.textHeading}`}>Cafeteria Menu</h2>
                  </div>
                  <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">Dining</span>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                  <h3 className="text-[10px] font-bold tracking-widest text-orange-500 uppercase mb-3">Dinner Menu</h3>
                  {cafeteria?.dinner ? cafeteria.dinner.map((item: any, i: number) => (
                    <div key={i} className={`border rounded-2xl p-4 mb-3 shadow-sm transition-all hover:border-orange-500/50 ${theme.bgWidgetInner}`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className={`font-bold text-sm truncate ${theme.textHeading}`}>{item.item}</h4>
                          <div className="flex gap-1 mt-1">
                             {item.tags?.includes("vegan") && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Vegan"></span>}
                             {item.tags?.includes("healthy") && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Healthy"></span>}
                             {item.tags?.includes("vegetarian") && <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Vegetarian"></span>}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20 shadow-sm shrink-0">{item.calories} cal</span>
                      </div>
                    </div>
                  )) : (
                    <div className={`flex h-full items-center justify-center text-sm ${theme.textSub}`}>Loading cafeteria menu...</div>
                  )}
                </div>
              </div>

              {/* Widget: Interdisciplinary Picks */}
              <div className={`backdrop-blur-xl rounded-3xl border shadow-lg overflow-hidden flex flex-col relative flex-1 min-h-[300px] transition-colors ${theme.bgWidget}`}>
                <div className={`p-5 border-b flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-transparent ${isDarkMode ? 'border-slate-700' : 'border-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 text-violet-500 rounded-xl shadow-sm"><BookOpen className="w-4 h-4" /></div>
                    <h2 className={`font-semibold ${theme.textHeading}`}>Library Picks</h2>
                  </div>
                  <span className="text-xs font-semibold text-violet-500 bg-violet-500/10 px-2 py-1 rounded-md">Library</span>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                  {library ? library.slice(0,3).map((book: any, i: number) => (
                    <div key={i} className={`mb-3 border rounded-2xl p-4 shadow-sm hover:border-violet-500/50 transition-all flex gap-3 items-center ${theme.bgWidgetInner}`}>
                      <div className={`w-10 h-14 rounded-md shrink-0 border flex items-center justify-center overflow-hidden relative ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                         <div className="absolute top-0 w-full h-1 bg-violet-400"></div>
                         <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-xs mb-0.5 truncate ${theme.textHeading}`}>{book.title}</h4>
                        <p className={`text-[10px] mb-1.5 truncate ${theme.textSub}`}>{book.author}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">Avail</span>
                          <span className={`flex items-center gap-1 text-[9px] font-medium ${theme.textSub}`}><Sparkles className="w-2.5 h-2.5" /> Pick</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className={`flex h-full items-center justify-center text-sm ${theme.textSub}`}>Loading library picks...</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Assistant & Chat History */}
      <aside 
        style={{ width: sidebarWidth }}
        className={`shrink-0 backdrop-blur-xl border-l flex flex-col z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.04)] hidden lg:flex transition-colors relative overflow-hidden ${theme.bgSidebar}`}
      >
        {/* Resizer Handle */}
        <div 
          onMouseDown={() => setIsResizing(true)}
          className={`absolute left-0 top-0 w-2 h-full cursor-col-resize z-50 flex items-center justify-center hover:bg-indigo-500/10 transition-colors group ${isResizing ? 'bg-indigo-500/20' : ''}`}
        >
          <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
        </div>
        
        {/* Header */}
        <div className={`h-16 border-b flex items-center justify-between px-6 z-30 transition-colors ${theme.bgHeader}`}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 text-white rounded-md shadow-sm shadow-indigo-500/20"><Sparkles className="w-4 h-4" /></div>
            <h2 className={`font-bold tracking-tight ${theme.textHeading}`}>OMNIOS AI</h2>
          </div>
          <div className="flex gap-2">
            <button className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`} onClick={() => { setActiveChatId(null); setMessages([]); }}><Plus className="w-4 h-4" /></button>
            <button className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'} ${showChatHistory ? (isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : ''}`} onClick={() => setShowChatHistory(!showChatHistory)}><Clock className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chat History Panel (Slide Over) */}
        <div className={`absolute top-16 left-0 w-full h-[calc(100%-4rem)] flex flex-col z-40 transition-transform duration-300 ${showChatHistory ? 'translate-x-0' : 'translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
           <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
             <h3 className={`font-bold ${theme.textHeading}`}>Chat History</h3>
             <button onClick={() => setShowChatHistory(false)} className={`p-1 rounded-full ${theme.btnHover} ${theme.textSub}`}><X className="w-4 h-4" /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {chatsList.length === 0 ? (
                <div className={`text-sm text-center mt-10 ${theme.textSub}`}>No previous chats found.</div>
             ) : (
                <div className="space-y-2">
                  {chatsList.map((chat) => (
                    <div key={chat.id} 
                         className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                           activeChatId === chat.id 
                           ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200') 
                           : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-300')
                         }`}
                         onClick={() => { setActiveChatId(chat.id); setMessages(chat.messages || []); setShowChatHistory(false); }}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                         <p className={`text-sm font-semibold truncate ${theme.textHeading}`}>{chat.title || "New Chat"}</p>
                         <p className={`text-xs truncate ${theme.textSub}`}>
                           {new Date(chat.created_at).toLocaleDateString()}
                         </p>
                      </div>
                      <button onClick={(e) => deleteChat(e, chat.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors shrink-0">
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>

        {/* Active Chat View */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar z-20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className={`font-bold mb-2 ${theme.textHeading}`}>How can I help?</h3>
              <p className={`text-sm leading-relaxed font-medium ${theme.textSub}`}>
                I am OmniOS AI. Ask me anything about library books, cafeteria menus, events, or your academic schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-sm shadow-sm border ${
                    msg.role === "user" 
                      ? (isDarkMode ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 font-bold" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 text-indigo-700 font-bold") 
                      : "bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 border-transparent text-white shadow-indigo-500/20"
                  }`}>
                    {msg.role === "user" ? "U" : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? (isDarkMode ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-100 rounded-tr-sm" : "bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tr-sm") 
                      : (isDarkMode ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm")
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
                  <div className={`p-4 rounded-2xl border rounded-tl-sm shadow-sm flex items-center gap-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className={`p-4 border-t backdrop-blur-md z-30 transition-colors ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/50 border-white'}`}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask OmniOS..."
              className={`flex-1 border text-sm rounded-full py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500/50' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400'}`}
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
