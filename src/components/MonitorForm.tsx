import { useState } from "react";
import { Monitor, MonitorType } from "../types";
import { createMonitor, updateMonitor } from "../api";
import { X } from "lucide-react";

interface Props {
  monitor: Monitor | null;
  onClose: () => void;
}

export function MonitorForm({ monitor, onClose }: Props) {
  const [name, setName] = useState(monitor?.name || "");
  const [url, setUrl] = useState(monitor?.url || "");
  const [type, setType] = useState<MonitorType>(monitor?.type || "http");
  const [interval, setInterval] = useState(monitor?.interval || 30);
  const [timeout, setTimeout] = useState(monitor?.timeout || 10);
  const [expectedStatusCodes, setExpectedStatusCodes] = useState(
    monitor?.expectedStatusCodes?.join(", ") || "200, 201, 204, 301, 302"
  );
  const [retries, setRetries] = useState(monitor?.retries || 2);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!name || !url) {
      setError("Name and URL are required");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name,
        url,
        type,
        interval,
        timeout,
        retries,
        expectedStatusCodes: expectedStatusCodes
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n)),
      };

      if (monitor) {
        await updateMonitor(monitor.id, data);
      } else {
        await createMonitor(data);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save monitor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          {monitor ? "Edit Monitor" : "Add Monitor"}
        </h1>
        <button className="btn-secondary p-2" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Website"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
          <input
            type="text"
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/health"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value as MonitorType)}
            >
              <option value="http">HTTP</option>
              <option value="tcp">TCP</option>
              <option value="ping">Ping</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Interval (seconds)</label>
            <input
              type="number"
              className="input-field"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 30)}
              min={5}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Timeout (seconds)</label>
            <input
              type="number"
              className="input-field"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 10)}
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Retries</label>
            <input
              type="number"
              className="input-field"
              value={retries}
              onChange={(e) => setRetries(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>

        {type === "http" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Expected Status Codes (comma-separated)
            </label>
            <input
              type="text"
              className="input-field"
              value={expectedStatusCodes}
              onChange={(e) => setExpectedStatusCodes(e.target.value)}
              placeholder="200, 201, 204"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : monitor ? "Update Monitor" : "Create Monitor"}
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
