import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
}

export default function Modules() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [catRes, modRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("modules").select("*").order("sort_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (modRes.data) setModules(modRes.data);
    };
    load();
  }, []);

  const filtered = modules.filter(
    (m) => m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getModulesForCategory = (catId: string) =>
    filtered.filter((m) => m.category_id === catId);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Modules</h1>
      <p className="mb-4 text-sm text-muted-foreground">Browse your study courses</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {categories.length === 0 && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No modules yet. An admin will add courses soon.</p>
        </div>
      )}

      {categories.map((cat, i) => {
        const catModules = getModulesForCategory(cat.id);
        if (catModules.length === 0 && search) return null;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="mb-6"
          >
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.name}
            </h2>
            <div className="space-y-2">
              {catModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => navigate(`/modules/${mod.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all hover:shadow-elevated active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <BookOpen className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{mod.title}</p>
                    {mod.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{mod.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {catModules.length === 0 && !search && (
                <p className="py-2 text-xs text-muted-foreground">No courses in this category yet.</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
