import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Brain, ArrowRight, Moon, Sun, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import heroTutor from "@/assets/hero-tutor.png";

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
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

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-lg text-center"
        >
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mb-5 w-48 sm:w-56"
          >
            <img
              src={heroTutor}
              alt="AI Study Companion - Student learning with books"
              className="w-full drop-shadow-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-secondary-foreground">AI-Powered Learning</span>
            </div>

            <h1 className="mb-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Alikalie Fofanah<br />
              <span className="text-primary">Study Companion</span>
            </h1>
            <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground sm:mb-8 sm:text-base">
              Your personal AI tutor for Computer Science, ICT & B.Tech — with Sierra Leone & African case studies.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" onClick={() => navigate("/login")} className="w-full gap-2 sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login?mode=signup")} className="w-full sm:w-auto">
              Create Account
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mx-auto grid max-w-lg grid-cols-3 gap-3"
        >
          {[
            { value: "13+", label: "Courses" },
            { value: "AI", label: "Powered" },
            { value: "24/7", label: "Access" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
              <p className="font-display text-lg font-bold text-primary sm:text-xl">{stat.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-center font-display text-lg font-bold text-foreground sm:text-xl">
            Why Study With Us?
          </h2>
          <div className="space-y-3">
            {[
              {
                icon: MessageCircle,
                title: "AI-Powered Chat",
                desc: "Chat with AI about any course. Each module has its own conversation that remembers where you left off.",
              },
              {
                icon: BookOpen,
                title: "Comprehensive Courses",
                desc: "CS, ICT & B.Tech courses with detailed study notes you can read anytime, anywhere.",
              },
              {
                icon: Brain,
                title: "African Context",
                desc: "AI uses Sierra Leone & African case studies so learning feels relevant and practical.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                className="flex gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card sm:gap-4 sm:p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <f.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mx-auto max-w-lg rounded-2xl bg-primary p-6 text-center sm:p-8"
        >
          <h2 className="mb-2 font-display text-lg font-bold text-primary-foreground sm:text-xl">
            Ready to start learning?
          </h2>
          <p className="mb-4 text-sm text-primary-foreground/80">
            Join now and get instant access to all courses and AI tutoring.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/login?mode=signup")}
            className="w-full gap-2 sm:w-auto"
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
