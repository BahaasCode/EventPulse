import { useState, useEffect, useRef } from "react";
import { trpc } from "@/providers/trpc";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pause,
  Play,
  Radio,
  Filter,
  CircleDot,
} from "lucide-react";

type EventItem = {
  id: string;
  eventType: string;
  sessionId: string;
  userId: string | null;
  source: string;
  metadata: Record<string, unknown>;
  processed: number;
  createdAt: Date;
};

export default function LiveFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const { data: eventTypes } = trpc.analytics.eventTypes.useQuery();
  const { data: initialEvents } = trpc.events.getRecent.useQuery(
    { limit: 50 },
    { refetchInterval: isPaused ? false : 3000 }
  );
  const { data: filteredEvents } = trpc.events.list.useQuery(
    {
      eventType: filterType === "all" ? undefined : filterType,
      limit: 100,
      page: 1,
    },
    { refetchInterval: isPaused ? false : 5000, enabled: filterType !== "all" }
  );

  useEffect(() => {
    if (initialEvents && filterType === "all") {
      const mapped = initialEvents.map((e) => ({
        ...e,
        metadata: (e.metadata as Record<string, unknown>) || {},
      }));
      setEvents(mapped);
    }
  }, [initialEvents, filterType]);

  useEffect(() => {
    if (filteredEvents?.items && filterType !== "all") {
      const mapped = filteredEvents.items.map((e) => ({
        ...e,
        metadata: (e.metadata as Record<string, unknown>) || {},
      }));
      setEvents(mapped);
    }
  }, [filteredEvents, filterType]);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isPaused]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
            <span className="text-sm text-slate-400">
              {events.length.toLocaleString()} events
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 h-8 bg-slate-900 border-slate-700 text-xs">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  {eventTypes?.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-700 bg-slate-900 hover:bg-slate-800"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Pause className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>

        {/* Events List */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-blue-400" />
              Event Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea
              className="h-[calc(100vh-280px)]"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                      No events received yet
                    </div>
                  ) : (
                    events.map((event, index) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        isNew={index < 5 && !isPaused}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EventRow({ event, isNew }: { event: EventItem; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-3 transition-all cursor-pointer hover:border-slate-600 ${
        isNew
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-800 bg-slate-900/40"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
            event.processed ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        <Badge
          variant="outline"
          className="text-[10px] h-5 px-1.5 border-slate-700 text-slate-300 shrink-0"
        >
          {event.eventType}
        </Badge>
        <span className="text-xs text-slate-500 truncate max-w-[120px]">
          {event.sessionId.slice(0, 8)}...
        </span>
        <span className="text-xs text-slate-400 truncate flex-1">{event.source}</span>
        <span className="text-[10px] text-slate-500 shrink-0">
          {new Date(event.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">ID:</span>{" "}
              <span className="text-slate-300 font-mono">{event.id}</span>
            </div>
            <div>
              <span className="text-slate-500">Session:</span>{" "}
              <span className="text-slate-300 font-mono">{event.sessionId}</span>
            </div>
            {event.userId && (
              <div>
                <span className="text-slate-500">User:</span>{" "}
                <span className="text-slate-300 font-mono">{event.userId}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Source:</span>{" "}
              <span className="text-slate-300">{event.source}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Metadata:</span>
              <pre className="mt-1 p-2 rounded bg-slate-950 text-slate-300 font-mono text-[10px] overflow-auto">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
