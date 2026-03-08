import { MessageCircle, BookOpen, User, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/chat", label: "Chat", icon: MessageCircle },
  { path: "/modules", label: "Modules", icon: BookOpen },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const items = isAdmin
    ? [...navItems, { path: "/admin", label: "Admin", icon: Shield }]
    : navItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ height: "var(--bottom-nav-height)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-full items-center justify-around px-1">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-all active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium sm:text-[11px]">{item.label}</span>
              {active && (
                <div className="h-0.5 w-4 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
