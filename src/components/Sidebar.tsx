import { DashboardSummary } from "../types";
import { Activity, Eye, AlertTriangle, Settings as SettingsIcon } from "lucide-react";

interface Props {
  view: "dashboard" | "monitors" | "incidents" | "settings";
  onViewChange: (view: "dashboard" | "monitors" | "incidents" | "settings") => void;
  summary: DashboardSummary | null;
}

export function Sidebar({ view, onViewChange, summary }: Props) {
  const navItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: Activity, badge: null },
    { key: "monitors" as const, label: "Monitors", icon: Eye, badge: summary?.totalMonitors ?? null },
    { key: "incidents" as const, label: "Incidents", icon: AlertTriangle, badge: summary?.activeIncidents ?? null, badgeClass: "bg-red-600" },
    { key: "settings" as const, label: "Settings", icon: SettingsIcon, badge: null },
  ];

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wolf-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-100">UptimeWolf</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                view === item.key
                  ? "bg-wolf-600/20 text-wolf-300"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
              onClick={() => onViewChange(item.key)}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} /> {item.label}
              </span>
              {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                <span className={`text-xs px-1.5 rounded ${item.badgeClass || "bg-slate-800"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {summary && (
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex justify-between mb-1">
            <span>Up</span>
            <span className="text-wolf-400">{summary.upMonitors}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Down</span>
            <span className="text-red-400">{summary.downMonitors}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Uptime</span>
            <span className="text-slate-300">{summary.avgUptime.toFixed(2)}%</span>
          </div>
        </div>
      )}
    </aside>
  );
}
