"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Database, BrainCircuit, FastForward, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Animated Background Mesh & Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
        
        {/* Futuristic Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Glowing Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[150px]" 
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-40">
          {isMounted && [...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: Math.random() * window.innerHeight, 
                x: Math.random() * window.innerWidth 
              }}
              animate={{ 
                y: [null, Math.random() * 1000], 
                opacity: [0, 1, 0]
              }}
              transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-1 h-1 bg-cyan-300 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            />
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400 w-6 h-6" />
          <span className="text-xl font-semibold text-white tracking-tight">Omni<span className="text-slate-400 font-light">OS</span></span>
        </div>
        <Link href="/login" className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all backdrop-blur-md">
          Sign In
        </Link>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Next-Gen Campus OS is Live
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
              The Unified <br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">Campus Brain.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop jumping between five different portals. OmniOS connects to the Library, Cafeteria, and Academic databases in real-time through an advanced decentralized AI protocol.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all">
                Enter Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* The Problem Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The Campus is Fragmented.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Traditional universities run on disconnected legacy systems. Checking your grades, finding a book, and seeing the lunch menu shouldn't require three different logins.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Siloed Databases", desc: "Library, Events, and Academics live on entirely different servers that don't talk to each other.", icon: Database },
                { title: "Slow Interfaces", desc: "Clunky 90s-era web portals that take minutes to load a simple schedule.", icon: FastForward },
                { title: "Zero Personalization", desc: "Systems that treat you like a number and forget your preferences the moment you log out.", icon: BrainCircuit }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-indigo-400 mb-6">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Solution (MCP) Section */}
        <section className="py-32 px-6 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Enter the <span className="text-cyan-400">Model Context Protocol</span>.</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                OmniOS uses a revolutionary decentralized architecture. Instead of scraping data, the AI securely connects directly to 5 independent microservices via Server-Sent Events (SSE). 
              </p>
              
              <ul className="space-y-4">
                {["Library Catalog (Books & Availability)", "Cafeteria Menus (Vegan & Dietary Options)", "Campus Events Hub", "Academic Core (Grades & Schedules)", "Persistent User Memory Storage"].map((feature, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 </div>
                 <div className="space-y-4 font-mono text-sm">
                   <div className="text-slate-400">$ Initializing MCP connections...</div>
                   <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-green-400">[OK] Connected to mcp-library</motion.div>
                   <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-green-400">[OK] Connected to mcp-cafeteria</motion.div>
                   <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-green-400">[OK] Connected to mcp-events</motion.div>
                   <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.4 }} className="text-cyan-400">$ Streaming AI response... 14ms latency</motion.div>
                 </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your campus experience?</h2>
            <p className="text-slate-400 mb-10">Sign in with your student credentials to access the unified dashboard instantly.</p>
            <Link href="/login" className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Login to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 OmniOS. Powered by Model Context Protocol.</p>
      </footer>
    </div>
  );
}
