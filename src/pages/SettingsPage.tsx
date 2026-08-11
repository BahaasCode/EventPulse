import { trpc } from "@/providers/trpc";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  User,
  Zap,
  RefreshCw,
  Database,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: health } = trpc.health.check.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const utils = trpc.useUtils();
  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.invalidate();
    },
  });

  const generateEvents = async () => {
    const eventTypes = ["page_view", "click", "scroll", "form_submit", "error", "purchase"];
    const sources = ["web", "mobile", "api", "widget"];
    const sessions = Array.from({ length: 5 }, () => crypto.randomUUID().slice(0, 8));

    let count = 0;
    for (let i = 0; i < 20; i++) {
      try {
        await createEvent.mutateAsync({
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          sessionId: sessions[Math.floor(Math.random() * sessions.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          metadata: {
            path: "/dashboard",
            duration: Math.floor(Math.random() * 5000),
            index: i,
          },
        });
        count++;
      } catch {
        // ignore
      }
    }

    toast.success(`Created ${count} test events successfully.`);
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account and system preferences
          </p>
        </div>

        {/* Profile */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Name</Label>
                <Input
                  value={user?.name || ""}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Email</Label>
                <Input
                  value={user?.email || ""}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-slate-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-400">Role</Label>
              <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize">
                {user?.role || "viewer"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Server Health */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              Server Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500">Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium capitalize">{health?.status || "unknown"}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500">Uptime</p>
                <p className="text-sm font-medium mt-1">
                  {health ? `${Math.floor(health.uptime / 60)}m ${Math.floor(health.uptime % 60)}s` : "--"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500">Memory</p>
                <p className="text-sm font-medium mt-1">
                  {health ? `${health.memory.used}MB / ${health.memory.total}MB` : "--"}
                </p>
              </div>
            </div>
            <Separator className="bg-slate-800" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-400">
                Events in database: {health?.processedEventCount?.toLocaleString() ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Developer Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Generate Test Events</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create 20 random events for testing dashboards
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-900 hover:bg-slate-800"
                onClick={generateEvents}
                disabled={createEvent.isPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${createEvent.isPending ? "animate-spin" : ""}`} />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
