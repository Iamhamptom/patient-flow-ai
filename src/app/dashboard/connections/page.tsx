"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlugZap } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  status: string;
  description: string;
  powers: string[];
  breaksWithout: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => setConnections(d.connections ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connected = connections.filter((c) => c.status === "connected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${connected}/${connections.length} integrations connected`}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <PlugZap className="h-3 w-3 mr-1" />
          AIRIA MCP Gateway Ready
        </Badge>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {connections.map((conn) => (
            <Card key={conn.id} className={conn.status === "connected" ? "border-border/50" : "border-border/20 opacity-60"}>
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{conn.name}</span>
                  <Badge
                    variant={conn.status === "connected" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {conn.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{conn.description}</p>
                <div className="flex flex-wrap gap-1">
                  {conn.powers.map((p) => (
                    <span key={p} className="text-[10px] font-mono text-muted-foreground/60 border border-border/30 rounded px-1.5 py-0.5">
                      {p}
                    </span>
                  ))}
                </div>
                {conn.status === "disconnected" && (
                  <p className="text-[10px] text-muted-foreground/40">
                    Without: {conn.breaksWithout}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
