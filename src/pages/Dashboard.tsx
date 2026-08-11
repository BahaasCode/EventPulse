// Copyright (c) 2026 Bahaa Elattar. All rights reserved.
// Submitted for evaluation purposes only. Do not reproduce or use without permission.

import { trpc } from "@/providers/trpc";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Users,
  Zap,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: timeSeries } = trpc.analytics.timeSeries.useQuery(
    { bucket: "hour", hours: 24 },
    { refetchInterval: 30000 }
  );
  const { data: eventTypeDist } = trpc.analytics.eventTypeDistribution.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: recentEvents } = trpc.events.getRecent.useQuery({ limit: 10 }, {
    refetchInterval: 5000,
  });

  const stats = [
    {
      title: "Total Events",
      value: summary?.totalEvents ?? 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Active Sessions",
      value: summary?.activeSessions ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Events / Minute",
      value: summary?.eventsPerMinute ?? 0,
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Total Sessions",
      value: summary?.totalSessions ?? 0,
      icon: Layers,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  const processedStats = [
    {
      label: "Processed",
      value: summary?.processedCount ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Pending",
      value: summary?.unprocessedCount ?? 0,
      icon: Clock,
      color: "text-amber-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">{stat.title}</p>
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-20 bg-slate-800" />
                      ) : (
                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Time Series Chart */}
          <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Events Over Time (24h)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {timeSeries && timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${d.getHours()}:00`;
                        }}
                      />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Type Distribution */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Event Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {eventTypeDist && eventTypeDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventTypeDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {eventTypeDist.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No data available yet
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-1.5">
                {eventTypeDist?.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-slate-400 truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-slate-300 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Processing Status */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Processing Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processedStats.map((stat) => {
                const Icon = stat.icon;
                const total = (summary?.processedCount ?? 0) + (summary?.unprocessedCount ?? 0);
                const pct = total > 0 ? Math.round((stat.value / total) * 100) : 0;
                return (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-sm text-slate-400">{stat.label}</span>
                      </div>
                      <span className="text-sm font-medium">{stat.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stat.label === "Processed" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Top Sources */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Top Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.topSources.map((source, i) => (
                  <div key={source.source} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300 truncate">{source.source}</span>
                        <span className="text-xs text-slate-400 ml-2">{source.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${
                              summary.topSources[0]?.count
                                ? (source.count / summary.topSources[0].count) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )) ?? (
                  <div className="text-sm text-slate-500 py-4 text-center">No data yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-52 px-5">
                <div className="space-y-2 py-1">
                  {recentEvents && recentEvents.length > 0 ? (
                    recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0"
                      >
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            event.processed ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate">
                            {event.eventType}
                          </p>
                          <p className="text-[10px] text-slate-500">{event.source}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1 border-slate-700 text-slate-400 shrink-0"
                        >
                          {new Date(event.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 py-4 text-center">No events yet</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
