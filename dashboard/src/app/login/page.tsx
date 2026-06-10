"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      studentId,
      password,
    });

    if (res?.error) {
      setError("Invalid credentials. Hint: use student123 / password");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-500/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-cyan-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 opacity-30">
        {isMounted && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: Math.random() * window.innerHeight, x: Math.random() * window.innerWidth }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight], 
              x: [null, Math.random() * window.innerWidth] 
            }}
            transition={{ duration: Math.random() * 20 + 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ opacity: Math.random() }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            
            <div className="flex items-center gap-2 mb-8 justify-center">
              <Sparkles className="text-cyan-400 w-6 h-6" />
              <span className="text-2xl font-semibold text-white tracking-tight">Omni<span className="text-slate-400 font-light">OS</span></span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="student123"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Dashboard"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Demo Credentials:<br/>
                ID: <span className="text-slate-300">student123</span> / Pass: <span className="text-slate-300">password</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
