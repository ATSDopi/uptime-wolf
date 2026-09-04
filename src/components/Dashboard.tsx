import { DashboardSummary, Monitor, Incident } from "../types";
import { StatCard } from "./StatCard";
import { UptimeChart } from "./UptimeChart";
import { RefreshCw, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  summary: DashboardSummary | null;
  monitors: Monitor[];
  incidents: Incident[];
  loading: boolean;
  onRefresh: () => void;
}

export function Dashboard({ summary, monitors, incidents, loading, onRefresh }: Props) {
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={32} className="animate-spin text-wolf-500" />
      </div>
    );
  }

  const activeIncidents = incidents.filter((i) => i.status === "active");

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor your services in real-time</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {activeIncidents.length > 0 && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
            <AlertCircle size={18} /> Active Incidents
          </div>
          <div className="space-y-1">
            {activeIncidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{inc.monitorName}</span>
                <span className="text-slate-500">
                  Down since {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Monitors" value={summary.totalMonitors} color="text-wolf-400" />
          <StatCard label="Up" value={summary.upMonitors} color="text-emerald-400" />
          <StatCard label="Down" value={summary.downMonitors} color="text-red-400" />
          <StatCard label="Avg Uptime" value={`${summary.avgUptime.toFixed(2)}%`} color="text-cyan-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monitors.slice(0, 6).map((m) => (
          <UptimeChart key={m.id} monitor={m} />
        ))}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Avg Response Time" value={`${summary.avgResponseTime}ms`} color="text-cyan-400" />
          <StatCard label="Active Incidents" value={summary.activeIncidents} color="text-red-400" />
          <StatCard label="Paused" value={summary.pausedMonitors} color="text-slate-400" />
          <StatCard label="Total Checks" value={summary.totalChecks} color="text-wolf-400" />
        </div>
      )}
    </div>
  );
}
