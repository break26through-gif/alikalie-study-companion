import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Brain, ArrowRight, Moon, Sun, Sparkles, School, Zap, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const floatingIcons = [
  { icon: "📚", x: "10%", y: "20%", delay: 0, duration: 6 },
  { icon: "🧠", x: "85%", y: "15%", delay: 1, duration: 7 },
  { icon: "💡", x: "75%", y: "65%", delay: 2, duration: 5 },
  { icon: "🎓", x: "15%", y: "70%", delay: 0.5, duration: 8 },
  { icon: "✨", x: "50%", y: "10%", delay: 1.5, duration: 6 },
  { icon: "🌍", x: "90%", y: "45%", delay: 3, duration: 7 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-bold text-foreground">Study Companion</span>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Hero with floating elements */}
      <section className="relative px-4 pb-8 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
        {/* Floating emoji icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-2xl opacity-20 sm:text-3xl"
            style={{ left: item.x, top: item.y }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: item.duration, delay: item.delay, ease: "easeInOut" }}
          >
            {item.icon}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-lg text-center"
        >
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </motion.div>
            <span className="text-xs font-semibold text-primary">AI-Powered Learning Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Learn Smarter with{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                AI Tutoring
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            Your personal AI companion for Computer Science, ICT & B.Tech — with Sierra Leone & African case studies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" onClick={() => navigate("/login")} className="w-full gap-2 sm:w-auto active:scale-95 transition-transform">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login?mode=signup")} className="w-full sm:w-auto active:scale-95 transition-transform">
              Create Account
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Animated Stats */}
      <section className="px-4 pb-10 sm:px-6">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
          {[
            { value: "13+", label: "Courses", icon: BookOpen, delay: 0.7 },
            { value: "AI", label: "Powered", icon: Zap, delay: 0.8 },
            { value: "24/7", label: "Access", icon: Globe, delay: 0.9 },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="group cursor-default rounded-xl border border-border bg-card p-3 text-center shadow-card transition-shadow hover:shadow-elevated"
            >
              <stat.icon className="mx-auto mb-1 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
              <p className="font-display text-lg font-bold text-foreground sm:text-xl">{stat.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-lg">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-5 text-center font-display text-lg font-bold text-foreground sm:text-xl"
          >
            Why Study With Us?
          </motion.h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageCircle, title: "AI Chat", desc: "Personal AI tutor for every course module.", color: "from-blue-500/20 to-blue-600/10" },
              { icon: BookOpen, title: "Rich Courses", desc: "CS, ICT & B.Tech with detailed notes.", color: "from-emerald-500/20 to-emerald-600/10" },
              { icon: School, title: "Classrooms", desc: "Create, join & collaborate with classmates.", color: "from-violet-500/20 to-violet-600/10" },
              { icon: Brain, title: "African Context", desc: "Local case studies that feel relevant.", color: "from-amber-500/20 to-amber-600/10" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className={`rounded-xl border border-border bg-gradient-to-br ${f.color} p-4 shadow-card transition-shadow hover:shadow-elevated`}
              >
                <f.icon className="mb-2 h-6 w-6 text-foreground" />
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="mx-auto max-w-lg rounded-2xl bg-primary p-6 text-center sm:p-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20"
          >
            <Users className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <h2 className="mb-2 font-display text-lg font-bold text-primary-foreground sm:text-xl">
            Ready to start learning?
          </h2>
          <p className="mb-4 text-sm text-primary-foreground/80">
            Join now and get instant access to all courses, classrooms & AI tutoring.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/login?mode=signup")}
            className="w-full gap-2 sm:w-auto active:scale-95 transition-transform"
          >
            Sign Up Free <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:py-6">
        © {new Date().getFullYear()} Alikalie Fofanah Study Companion. All rights reserved.
      </footer>
    </div>
  );
}
