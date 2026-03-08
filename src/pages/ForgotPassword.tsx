import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4">
      <div className="flex items-center pt-4">
        <button onClick={() => navigate("/login")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Mail className="h-7 w-7 text-secondary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {sent ? "Check Your Email" : "Forgot Password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sent
                ? "We sent a password reset link to your email."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <Button variant="outline" className="w-full" size="lg" onClick={() => navigate("/login")}>
              Back to Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
