import { Monitor, NotificationChannel, DashboardSummary, MonitorWithChecks, Incident } from "./types";

const API_BASE = "/api";

export async function fetchMonitors(): Promise<Monitor[]> {
  const res = await fetch(`${API_BASE}/monitors`);
  if (!res.ok) throw new Error("Failed to fetch monitors");
  return res.json();
}

export async function fetchMonitor(id: string): Promise<MonitorWithChecks> {
  const res = await fetch(`${API_BASE}/monitors/${id}`);
  if (!res.ok) throw new Error("Failed to fetch monitor");
  return res.json();
}

export async function createMonitor(data: Partial<Monitor>): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/monitors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create monitor");
  return res.json();
}

export async function updateMonitor(id: string, data: Partial<Monitor>): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/monitors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update monitor");
  return res.json();
}

export async function deleteMonitor(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitors/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete monitor");
}

export async function pauseMonitor(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitors/${id}/pause`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to pause monitor");
}

export async function resumeMonitor(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitors/${id}/resume`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to resume monitor");
}

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchChannels(): Promise<NotificationChannel[]> {
  const res = await fetch(`${API_BASE}/channels`);
  if (!res.ok) throw new Error("Failed to fetch channels");
  return res.json();
}

export async function createChannel(data: Partial<NotificationChannel>): Promise<NotificationChannel> {
  const res = await fetch(`${API_BASE}/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create channel");
  return res.json();
}

export async function deleteChannel(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/channels/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete channel");
}

export async function testChannel(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/channels/${id}/test`, { method: "POST" });
  return res.ok;
}
