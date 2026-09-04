import { Monitor } from "../types";
import { pauseMonitor, resumeMonitor, deleteMonitor } from "../api";
import { Plus, Pause, Play, Trash2, Edit, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Props {
  monitors: Monitor[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (monitor: Monitor) => void;
  onRefresh: () => void;
}

export function MonitorList({ monitors, loading, onAdd, onEdit, onRefresh }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await pauseMonitor(id);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    try {
      await resumeMonitor(id);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this monitor?")) return;
    setActionLoading(id);
    try {
      await deleteMonitor(id);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Monitors</h1>
          <p className="text-slate-400 text-sm mt-1">{monitors.length} monitors configured</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={onAdd}>
          <Plus size={18} /> Add Monitor
        </button>
      </header>

      {loading && monitors.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wolf-500" />
        </div>
      ) : monitors.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">No monitors yet. Add your first monitor to start tracking.</p>
          <button className="btn-primary inline-flex items-center gap-2" onClick={onAdd}>
            <Plus size={18} /> Add Monitor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => {
            const statusClass =
              m.status === "up" ? "status-up" :
              m.status === "down" ? "status-down" :
              m.status === "paused" ? "status-paused" : "status-pending";

            return (
              <div key={m.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`status-dot ${statusClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-slate-200 truncate">{m.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{m.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{m.url}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {m.responseTime}ms
                      </span>
                      <span>{m.uptimePercentage.toFixed(1)}% uptime</span>
                      <span>Every {m.interval}s</span>
                      {m.lastChecked && (
                        <span>Last: {formatDistanceToNow(new Date(m.lastChecked), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {m.status === "paused" ? (
                    <button
                      className="btn-secondary p-2"
                      onClick={() => handleResume(m.id)}
                      disabled={actionLoading === m.id}
                      title="Resume"
                    >
                      <Play size={14} />
                    </button>
                  ) : (
                    <button
                      className="btn-secondary p-2"
                      onClick={() => handlePause(m.id)}
                      disabled={actionLoading === m.id}
                      title="Pause"
                    >
                      <Pause size={14} />
                    </button>
                  )}
                  <button
                    className="btn-secondary p-2"
                    onClick={() => onEdit(m)}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn-danger p-2"
                    onClick={() => handleDelete(m.id)}
                    disabled={actionLoading === m.id}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
