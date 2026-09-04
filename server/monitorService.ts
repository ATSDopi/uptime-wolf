import { Monitor, MonitorCheck, MonitorStatus } from "../src/types.js";
import { Database } from "./db.js";
import { NotificationService } from "./notifications.js";
import { randomUUID } from "crypto";

export class MonitorService {
  private db: Database;
  private notifications: NotificationService;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private failureCounts: Map<string, number> = new Map();

  constructor(db: Database, notifications: NotificationService) {
    this.db = db;
    this.notifications = notifications;
  }

  start(): void {
    const monitors = this.db.getMonitors().filter((m) => m.enabled);
    for (const monitor of monitors) {
      this.scheduleCheck(monitor);
    }
  }

  addMonitor(monitor: Monitor): void {
    if (monitor.enabled) {
      this.scheduleCheck(monitor);
    }
  }

  updateMonitor(monitor: Monitor): void {
    this.removeMonitor(monitor.id);
    if (monitor.enabled) {
      this.scheduleCheck(monitor);
    }
  }

  removeMonitor(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  private scheduleCheck(monitor: Monitor): void {
    const check = async () => {
      await this.runCheck(monitor);
    };
    check();
    const timer = setInterval(check, monitor.interval * 1000);
    this.timers.set(monitor.id, timer);
  }

  private async runCheck(monitor: Monitor): Promise<void> {
    const startTime = Date.now();
    let status: "up" | "down" = "up";
    let statusCode: number | null = null;
    let error: string | null = null;

    try {
      if (monitor.type === "http") {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), monitor.timeout * 1000);
        const response = await fetch(monitor.url, { signal: controller.signal });
        clearTimeout(timeout);
        statusCode = response.status;
        if (monitor.expectedStatusCodes.length > 0 && !monitor.expectedStatusCodes.includes(statusCode)) {
          status = "down";
          error = `Unexpected status code: ${statusCode}`;
        }
      } else if (monitor.type === "tcp") {
        const url = new URL(monitor.url);
        const net = await import("net");
        await new Promise<void>((resolve, reject) => {
          const socket = net.createConnection({ host: url.hostname, port: parseInt(url.port) || 80 });
          socket.setTimeout(monitor.timeout * 1000);
          socket.on("connect", () => { socket.destroy(); resolve(); });
          socket.on("error", (err) => reject(err));
          socket.on("timeout", () => { socket.destroy(); reject(new Error("Connection timeout")); });
        });
      } else if (monitor.type === "ping") {
        const url = new URL(monitor.url);
        const net = await import("net");
        await new Promise<void>((resolve, reject) => {
          const socket = net.createConnection({ host: url.hostname, port: 80 });
          socket.setTimeout(monitor.timeout * 1000);
          socket.on("connect", () => { socket.destroy(); resolve(); });
          socket.on("error", (err) => reject(err));
          socket.on("timeout", () => { socket.destroy(); reject(new Error("Ping timeout")); });
        });
      }
    } catch (err) {
      status = "down";
      error = err instanceof Error ? err.message : "Unknown error";
    }

    const responseTime = Date.now() - startTime;
    const check: MonitorCheck = {
      id: randomUUID(),
      monitorId: monitor.id,
      status,
      responseTime,
      statusCode,
      error,
      checkedAt: new Date().toISOString(),
    };

    this.db.addCheck(check);

    const checks = this.db.getChecks(monitor.id, 100);
    const upChecks = checks.filter((c) => c.status === "up").length;
    const uptimePercentage = checks.length > 0 ? (upChecks / checks.length) * 100 : 100;
    const avgResponseTime = checks.length > 0 ? Math.round(checks.reduce((s, c) => s + c.responseTime, 0) / checks.length) : 0;

    let newStatus: MonitorStatus = status;
    const failures = this.failureCounts.get(monitor.id) || 0;

    if (status === "down") {
      this.failureCounts.set(monitor.id, failures + 1);
      if (failures + 1 >= monitor.retries + 1) {
        newStatus = "down";
        const activeIncident = this.db.getActiveIncidentForMonitor(monitor.id);
        if (!activeIncident) {
          this.db.createIncident(monitor.id, monitor.name, error || "Service is down");
          this.notifications.notifyAll(monitor.name, "down", error || "Service is down");
        }
      }
    } else {
      this.failureCounts.set(monitor.id, 0);
      const activeIncident = this.db.getActiveIncidentForMonitor(monitor.id);
      if (activeIncident) {
        this.db.resolveIncident(activeIncident.id);
        this.notifications.notifyAll(monitor.name, "up", "Service is back up");
      }
      newStatus = "up";
    }

    this.db.updateMonitor(monitor.id, {
      status: newStatus,
      lastChecked: check.checkedAt,
      lastDown: status === "down" ? check.checkedAt : monitor.lastDown,
      uptimePercentage,
      responseTime: avgResponseTime,
    });
  }
}
