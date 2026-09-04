import { Incident } from "../types";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  incidents: Incident[];
  loading: boolean;
}

export function IncidentsView({ incidents, loading }: Props) {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Incidents</h1>
        <p className="text-slate-400 text-sm mt-1">{incidents.length} incidents recorded</p>
      </header>

      {loading && incidents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wolf-500" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle size={48} className="text-wolf-500 mx-auto mb-3" />
          <p className="text-slate-400">No incidents recorded. Everything is running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`card border-l-4 ${
                inc.status === "active" ? "border-l-red-500" : "border-l-wolf-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {inc.status === "active" ? (
                    <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                  ) : (
                    <CheckCircle size={20} className="text-wolf-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-slate-200">{inc.monitorName}</h3>
                    <p className="text-xs text-slate-500 mt-1">{inc.reason}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>Started: {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                      {inc.resolvedAt && (
                        <span>Resolved: {formatDistanceToNow(new Date(inc.resolvedAt), { addSuffix: true })}</span>
                      )}
                      <span>Duration: {inc.duration}s</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    inc.status === "active"
                      ? "bg-red-900/50 text-red-300"
                      : "bg-wolf-900/50 text-wolf-300"
                  }`}
                >
                  {inc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
