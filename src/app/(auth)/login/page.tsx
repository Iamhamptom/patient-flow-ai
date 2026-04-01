"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/dashboard");
    } else {
      setError(data.error || "Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-lg bg-foreground/5 border border-border/50 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Patient Flow AI</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access FlowBot and your dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@practice.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border/50"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Demo Credentials */}
        <DemoCredentials />

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/50 font-mono">
          patient-flow-ai v0.2.0 — VisioCorp Health Division
        </p>
      </div>
    </div>
  );
}

function DemoCredentials() {
  const [info, setInfo] = useState<{
    demoEmail: string;
    demoPassword: string;
    practiceName: string;
  } | null>(null);

  useState(() => {
    fetch("/api/auth/demo-info")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  });

  if (!info) return null;

  return (
    <Card className="border-border/30 bg-card/50">
      <CardContent className="pt-4 pb-3 space-y-2">
        <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
          Demo Credentials
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Email</span>
            <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
              {info.demoEmail}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Password</span>
            <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
              {info.demoPassword}
            </code>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Practice: {info.practiceName}
        </p>
      </CardContent>
    </Card>
  );
}
