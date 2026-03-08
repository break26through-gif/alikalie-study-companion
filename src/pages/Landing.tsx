import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Brain, ArrowRight, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with theme toggle */}
      <div className="flex items-center justify-end px-4 pt-4">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-6 sm:pb-16 sm:pt-10">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-lg text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero sm:mb-6 sm:h-16 sm:w-16">
            <Brain className="h-7 w-7 text-primary-foreground sm:h-8 sm:w-8" />
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Alikalie Fofanah<br />
            <span className="text-primary">Study Companion</span>
          </h1>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed sm:mb-8 sm:text-base">
            AI-powered learning for Computer Science, ICT & B.Tech courses.
            Study smarter with personalized AI tutoring using Sierra Leone & African case studies.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/login")} className="w-full gap-2 sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login?mode=signup")} className="w-full sm:w-auto">
              Create Account
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="mx-auto max-w-lg space-y-3 sm:space-y-4">
          {[
            {
              icon: MessageCircle,
              title: "AI-Powered Chat",
              desc: "Chat with AI about any course. Each module has its own conversation history.",
            },
            {
              icon: BookOpen,
              title: "Course Modules",
              desc: "Computer Science, ICT & B.Tech courses with comprehensive study notes.",
            },
            {
              icon: Brain,
              title: "Smart Learning",
              desc: "AI references Sierra Leone & African case studies for contextual learning.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:gap-4 sm:p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-10 sm:w-10">
                <f.icon className="h-4 w-4 text-secondary-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:py-6">
        © {new Date().getFullYear()} Alikalie Fofanah Study Companion. All rights reserved.
      </footer>
    </div>
  );
}
