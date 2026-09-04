import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Database } from "./db.js";
import { MonitorService } from "./monitorService.js";
import { NotificationService } from "./notifications.js";
import { Monitor, NotificationChannel } from "../src/types.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3003", 10);

app.use(cors());
app.use(express.json());

const db = new Database(process.env.DB_PATH || "./data/uptime-wolf.db");
const notificationService = new NotificationService(db);
const monitorService = new MonitorService(db, notificationService);

monitorService.start();

app.get("/api/monitors", (_req, res) => {
  const monitors = db.getMonitors();
  res.json(monitors);
});

app.get("/api/monitors/:id", (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }
  const checks = db.getChecks(req.params.id, 50);
  const incidents = db.getIncidents(req.params.id);
  res.json({ ...monitor, recentChecks: checks, incidents });
});

app.post("/api/monitors", (req, res) => {
  const data = req.body as Partial<Monitor>;
  const monitor = db.createMonitor(data);
  monitorService.addMonitor(monitor);
  res.json(monitor);
});

app.put("/api/monitors/:id", (req, res) => {
  const data = req.body as Partial<Monitor>;
  const monitor = db.updateMonitor(req.params.id, data);
  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }
  monitorService.updateMonitor(monitor);
  res.json(monitor);
});

app.delete("/api/monitors/:id", (req, res) => {
  db.deleteMonitor(req.params.id);
  monitorService.removeMonitor(req.params.id);
  res.json({ ok: true });
});

app.post("/api/monitors/:id/pause", (req, res) => {
  const monitor = db.updateMonitor(req.params.id, { status: "paused", enabled: false });
  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }
  monitorService.updateMonitor(monitor);
  res.json(monitor);
});

app.post("/api/monitors/:id/resume", (req, res) => {
  const monitor = db.updateMonitor(req.params.id, { status: "pending", enabled: true });
  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }
  monitorService.updateMonitor(monitor);
  res.json(monitor);
});

app.get("/api/summary", (_req, res) => {
  const monitors = db.getMonitors();
  const total = monitors.length;
  const up = monitors.filter((m) => m.status === "up").length;
  const down = monitors.filter((m) => m.status === "down").length;
  const paused = monitors.filter((m) => m.status === "paused").length;
  const avgUptime = total > 0 ? monitors.reduce((s, m) => s + m.uptimePercentage, 0) / total : 100;
  const avgResponseTime = total > 0 ? monitors.reduce((s, m) => s + m.responseTime, 0) / total : 0;
  const activeIncidents = db.getActiveIncidents().length;
  const totalChecks = db.getTotalChecks();

  res.json({
    totalMonitors: total,
    upMonitors: up,
    downMonitors: down,
    pausedMonitors: paused,
    avgUptime,
    avgResponseTime: Math.round(avgResponseTime),
    activeIncidents,
    totalChecks,
  });
});

app.get("/api/incidents", (_req, res) => {
  const incidents = db.getAllIncidents();
  res.json(incidents);
});

app.get("/api/channels", (_req, res) => {
  const channels = db.getChannels();
  res.json(channels);
});

app.post("/api/channels", (req, res) => {
  const data = req.body as Partial<NotificationChannel>;
  const channel = db.createChannel(data);
  res.json(channel);
});

app.delete("/api/channels/:id", (req, res) => {
  db.deleteChannel(req.params.id);
  res.json({ ok: true });
});

app.post("/api/channels/:id/test", async (req, res) => {
  const channel = db.getChannel(req.params.id);
  if (!channel) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }
  try {
    await notificationService.send(channel, "Test Notification", "This is a test from UptimeWolf!");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to send test" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`  🐺 UptimeWolf API server running on port ${PORT}`);
});
