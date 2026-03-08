import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-12">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-lg text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold tracking-tight text-foreground">
            Alikalie Fofanah<br />
            <span className="text-primary">Study Companion</span>
          </h1>
          <p className="mb-8 text-base text-muted-foreground leading-relaxed">
            AI-powered learning for Computer Science, ICT & B.Tech courses.
            Study smarter with personalized AI tutoring using Sierra Leone & African case studies.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login?mode=signup")}>
              Create Account
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-lg space-y-4">
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
              className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <f.icon className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alikalie Fofanah Study Companion. All rights reserved.
      </footer>
    </div>
  );
}
