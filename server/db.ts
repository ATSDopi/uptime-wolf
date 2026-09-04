import BetterSqlite3 from "better-sqlite3";
import { randomUUID } from "crypto";
import { Monitor, MonitorCheck, Incident, NotificationChannel, MonitorStatus, MonitorType } from "../src/types.js";

export class Database {
  private db: BetterSqlite3.Database;

  constructor(path: string) {
    this.db = new BetterSqlite3(path);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS monitors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'http',
        interval INTEGER NOT NULL DEFAULT 30,
        timeout INTEGER NOT NULL DEFAULT 10,
        expected_status_codes TEXT DEFAULT '200,201,204,301,302',
        status TEXT NOT NULL DEFAULT 'pending',
        last_checked TEXT,
        last_down TEXT,
        uptime_percentage REAL DEFAULT 100.0,
        response_time INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1,
        retries INTEGER DEFAULT 2,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checks (
        id TEXT PRIMARY KEY,
        monitor_id TEXT NOT NULL,
        status TEXT NOT NULL,
        response_time INTEGER DEFAULT 0,
        status_code INTEGER,
        error TEXT,
        checked_at TEXT NOT NULL,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        monitor_id TEXT NOT NULL,
        monitor_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        started_at TEXT NOT NULL,
        resolved_at TEXT,
        reason TEXT,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_checks_monitor ON checks(monitor_id);
      CREATE INDEX IF NOT EXISTS idx_checks_time ON checks(checked_at);
      CREATE INDEX IF NOT EXISTS idx_incidents_monitor ON incidents(monitor_id);
    `);
  }

  getMonitors(): Monitor[] {
    const rows = this.db.prepare("SELECT * FROM monitors ORDER BY created_at DESC").all() as any[];
    return rows.map(this.rowToMonitor);
  }

  getMonitor(id: string): Monitor | null {
    const row = this.db.prepare("SELECT * FROM monitors WHERE id = ?").get(id) as any;
    return row ? this.rowToMonitor(row) : null;
  }

  createMonitor(data: Partial<Monitor>): Monitor {
    const id = randomUUID();
    const now = new Date().toISOString();
    const monitor: Monitor = {
      id,
      name: data.name || "Untitled",
      url: data.url || "",
      type: data.type || "http",
      interval: data.interval || 30,
      timeout: data.timeout || 10,
      expectedStatusCodes: data.expectedStatusCodes || [200, 201, 204, 301, 302],
      status: "pending",
      lastChecked: null,
      lastDown: null,
      uptimePercentage: 100,
      responseTime: 0,
      enabled: true,
      createdAt: now,
      retries: data.retries || 2,
    };

    this.db.prepare(
      `INSERT INTO monitors (id, name, url, type, interval, timeout, expected_status_codes, status, last_checked, last_down, uptime_percentage, response_time, enabled, retries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      monitor.id, monitor.name, monitor.url, monitor.type, monitor.interval,
      monitor.timeout, monitor.expectedStatusCodes.join(","),
      monitor.status, monitor.lastChecked, monitor.lastDown,
      monitor.uptimePercentage, monitor.responseTime, monitor.enabled ? 1 : 0,
      monitor.retries, monitor.createdAt
    );

    return monitor;
  }

  updateMonitor(id: string, data: Partial<Monitor>): Monitor | null {
    const existing = this.getMonitor(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };
    this.db.prepare(
      `UPDATE monitors SET name = ?, url = ?, type = ?, interval = ?, timeout = ?, expected_status_codes = ?, status = ?, last_checked = ?, last_down = ?, uptime_percentage = ?, response_time = ?, enabled = ?, retries = ? WHERE id = ?`
    ).run(
      updated.name, updated.url, updated.type, updated.interval, updated.timeout,
      updated.expectedStatusCodes.join(","), updated.status, updated.lastChecked,
      updated.lastDown, updated.uptimePercentage, updated.responseTime,
      updated.enabled ? 1 : 0, updated.retries, id
    );

    return updated;
  }

  deleteMonitor(id: string): void {
    this.db.prepare("DELETE FROM monitors WHERE id = ?").run(id);
  }

  addCheck(check: MonitorCheck): void {
    this.db.prepare(
      `INSERT INTO checks (id, monitor_id, status, response_time, status_code, error, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(check.id, check.monitorId, check.status, check.responseTime, check.statusCode, check.error, check.checkedAt);
  }

  getChecks(monitorId: string, limit: number): MonitorCheck[] {
    const rows = this.db.prepare(
      "SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?"
    ).all(monitorId, limit) as any[];
    return rows.map((r) => ({
      id: r.id, monitorId: r.monitor_id, status: r.status, responseTime: r.response_time,
      statusCode: r.status_code, error: r.error, checkedAt: r.checked_at,
    }));
  }

  getTotalChecks(): number {
    const row = this.db.prepare("SELECT COUNT(*) as count FROM checks").get() as any;
    return row?.count || 0;
  }

  createIncident(monitorId: string, monitorName: string, reason: string): Incident {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO incidents (id, monitor_id, monitor_name, status, started_at, reason, duration) VALUES (?, ?, ?, 'active', ?, ?, 0)`
    ).run(id, monitorId, monitorName, now, reason);

    return { id, monitorId, monitorName, status: "active", startedAt: now, resolvedAt: null, reason, duration: 0 };
  }

  resolveIncident(id: string): void {
    const now = new Date().toISOString();
    const incident = this.db.prepare("SELECT * FROM incidents WHERE id = ?").get(id) as any;
    if (!incident) return;
    const duration = Math.round((Date.now() - new Date(incident.started_at).getTime()) / 1000);
    this.db.prepare("UPDATE incidents SET status = 'resolved', resolved_at = ?, duration = ? WHERE id = ?").run(now, duration, id);
  }

  getActiveIncidents(): Incident[] {
    const rows = this.db.prepare("SELECT * FROM incidents WHERE status = 'active'").all() as any[];
    return rows.map(this.rowToIncident);
  }

  getIncidents(monitorId: string): Incident[] {
    const rows = this.db.prepare("SELECT * FROM incidents WHERE monitor_id = ? ORDER BY started_at DESC").all(monitorId) as any[];
    return rows.map(this.rowToIncident);
  }

  getAllIncidents(): Incident[] {
    const rows = this.db.prepare("SELECT * FROM incidents ORDER BY started_at DESC LIMIT 100").all() as any[];
    return rows.map(this.rowToIncident);
  }

  getActiveIncidentForMonitor(monitorId: string): Incident | null {
    const row = this.db.prepare("SELECT * FROM incidents WHERE monitor_id = ? AND status = 'active' LIMIT 1").get(monitorId) as any;
    return row ? this.rowToIncident(row) : null;
  }

  getChannels(): NotificationChannel[] {
    const rows = this.db.prepare("SELECT * FROM channels ORDER BY created_at DESC").all() as any[];
    return rows.map((r) => ({
      id: r.id, name: r.name, type: r.type, config: JSON.parse(r.config || "{}"),
      enabled: r.enabled === 1, createdAt: r.created_at,
    }));
  }

  getChannel(id: string): NotificationChannel | null {
    const row = this.db.prepare("SELECT * FROM channels WHERE id = ?").get(id) as any;
    if (!row) return null;
    return {
      id: row.id, name: row.name, type: row.type, config: JSON.parse(row.config || "{}"),
      enabled: row.enabled === 1, createdAt: row.created_at,
    };
  }

  createChannel(data: Partial<NotificationChannel>): NotificationChannel {
    const id = randomUUID();
    const now = new Date().toISOString();
    const channel: NotificationChannel = {
      id,
      name: data.name || "Untitled",
      type: data.type || "email",
      config: data.config || {},
      enabled: true,
      createdAt: now,
    };
    this.db.prepare(
      `INSERT INTO channels (id, name, type, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(channel.id, channel.name, channel.type, JSON.stringify(channel.config), 1, now);
    return channel;
  }

  deleteChannel(id: string): void {
    this.db.prepare("DELETE FROM channels WHERE id = ?").run(id);
  }

  private rowToMonitor = (r: any): Monitor => ({
    id: r.id, name: r.name, url: r.url, type: r.type as MonitorType, interval: r.interval,
    timeout: r.timeout, expectedStatusCodes: r.expected_status_codes?.split(",").map(Number) || [],
    status: r.status as MonitorStatus, lastChecked: r.last_checked, lastDown: r.last_down,
    uptimePercentage: r.uptime_percentage, responseTime: r.response_time,
    enabled: r.enabled === 1, createdAt: r.created_at, retries: r.retries,
  });

  private rowToIncident = (r: any): Incident => ({
    id: r.id, monitorId: r.monitor_id, monitorName: r.monitor_name, status: r.status,
    startedAt: r.started_at, resolvedAt: r.resolved_at, reason: r.reason, duration: r.duration,
  });

  close(): void {
    this.db.close();
  }
}
