import { Monitor } from "../types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";

interface Props {
  monitor: Monitor;
}

export function UptimeChart({ monitor }: Props) {
  const data = monitor.recentChecks || [];
  const chartData = data.map((c) => ({
    time: format(parseISO(c.checkedAt), "HH:mm"),
    responseTime: c.responseTime,
    status: c.status,
  }));

  const statusClass =
    monitor.status === "up" ? "status-up" :
    monitor.status === "down" ? "status-down" :
    monitor.status === "paused" ? "status-paused" : "status-pending";

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${statusClass}`} />
          <h3 className="text-sm font-semibold text-slate-200">{monitor.name}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {monitor.responseTime}ms
          </span>
          <span>{monitor.uptimePercentage.toFixed(1)}%</span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} interval="preserveStartEnd" />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
            />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Response Time (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[120px] flex items-center justify-center text-slate-600 text-sm">
          No check data yet
        </div>
      )}

      <div className="flex items-center gap-1 mt-2">
        {data.slice(-30).map((c, i) => (
          <div
            key={i}
            className={`flex-1 h-6 rounded-sm ${
              c.status === "up" ? "bg-wolf-500" : "bg-red-500"
            }`}
            title={`${c.status} - ${c.responseTime}ms`}
          />
        ))}
      </div>
    </div>
  );
}
