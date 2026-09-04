import { useState, useEffect, useCallback } from "react";
import { Monitor, DashboardSummary, Incident } from "./types";
import { fetchMonitors, fetchSummary, fetchIncidents } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { MonitorList } from "./components/MonitorList";
import { MonitorForm } from "./components/MonitorForm";
import { IncidentsView } from "./components/IncidentsView";
import { Settings } from "./components/Settings";

type View = "dashboard" | "monitors" | "incidents" | "settings";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mons, summ, incs] = await Promise.all([
        fetchMonitors(),
        fetchSummary(),
        fetchIncidents(),
      ]);
      setMonitors(mons);
      setSummary(summ);
      setIncidents(incs);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMonitor(null);
    loadData();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar view={view} onViewChange={setView} summary={summary} />

      <div className="flex-1 overflow-auto">
        {showForm ? (
          <MonitorForm monitor={editingMonitor} onClose={handleFormClose} />
        ) : view === "dashboard" ? (
          <Dashboard summary={summary} monitors={monitors} incidents={incidents} loading={loading} onRefresh={loadData} />
        ) : view === "monitors" ? (
          <MonitorList monitors={monitors} loading={loading} onAdd={() => setShowForm(true)} onEdit={handleEdit} onRefresh={loadData} />
        ) : view === "incidents" ? (
          <IncidentsView incidents={incidents} loading={loading} />
        ) : (
          <Settings />
        )}
      </div>
    </div>
  );
}
