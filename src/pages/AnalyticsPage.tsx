import { useState } from "react";
import { trpc } from "@/providers/trpc";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  PieChartIcon,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("24h");
  const [activeTab, setActiveTab] = useState<"overview" | "types" | "sources">("overview");

  const hoursMap: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24, "7d": 168 };
  const bucketMap: Record<string, "minute" | "hour" | "day"> = {
    "1h": "minute",
    "6h": "hour",
    "24h": "hour",
    "7d": "day",
  };

  const { data: timeSeries, isLoading: tsLoading } = trpc.analytics.timeSeries.useQuery({
    bucket: bucketMap[timeRange],
    hours: hoursMap[timeRange],
  });

  const { data: eventTypeDist } = trpc.analytics.eventTypeDistribution.useQuery();
  const { data: sourceDist } = trpc.analytics.sourceDistribution.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-xs"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Trends
              </TabsTrigger>
              <TabsTrigger
                value="types"
                className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-xs"
              >
                <PieChartIcon className="h-3.5 w-3.5 mr-1.5" />
                Event Types
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Sources
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            {(["1h", "6h", "24h", "7d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className={`h-7 text-[10px] ${
                  timeRange === range
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                }`}
                onClick={() => setTimeRange(range)}
              >
                {range === "1h" && "1H"}
                {range === "6h" && "6H"}
                {range === "24h" && "24H"}
                {range === "7d" && "7D"}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Events", value: summary?.totalEvents ?? 0, color: "text-emerald-400" },
                { label: "Sessions", value: summary?.totalSessions ?? 0, color: "text-blue-400" },
                { label: "Events/Min", value: summary?.eventsPerMinute ?? 0, color: "text-amber-400" },
                { label: "Active Now", value: summary?.activeSessions ?? 0, color: "text-violet-400" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className={`text-xl font-bold mt-1 ${stat.color}`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Trend Chart */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Event Volume ({timeRange.toUpperCase()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {tsLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      Loading...
                    </div>
                  ) : timeSeries && timeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#64748b"
                          fontSize={11}
                          tickFormatter={(v: string) => {
                            const d = new Date(v);
                            if (bucketMap[timeRange] === "day") {
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }
                            return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
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
                      No data for selected time range
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "types" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">
                  Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {eventTypeDist && eventTypeDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventTypeDist}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
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
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">
                  Event Type Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventTypeDist?.map((item, i) => {
                    const total = eventTypeDist.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.value}</span>
                            <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  }) ?? (
                    <div className="text-sm text-slate-500 text-center py-8">No data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sources" && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300">
                Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {sourceDist && sourceDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        fontSize={11}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {sourceDist.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
