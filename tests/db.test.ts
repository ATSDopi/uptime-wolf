import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "../server/db";
import { Monitor } from "../src/types";
import fs from "fs";
import path from "path";

let dbPath: string;
let db: Database;

beforeEach(() => {
  dbPath = path.join(process.cwd(), `data/test-${Date.now()}.db`);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(dbPath);
});

afterEach(() => {
  db.close();
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe("Database", () => {
  it("should create and retrieve a monitor", () => {
    const monitor = db.createMonitor({ name: "Test Monitor", url: "https://example.com", type: "http", interval: 30 });
    expect(monitor.name).toBe("Test Monitor");
    expect(monitor.url).toBe("https://example.com");
    expect(monitor.status).toBe("pending");

    const retrieved = db.getMonitor(monitor.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe("Test Monitor");
  });

  it("should list all monitors", () => {
    db.createMonitor({ name: "Monitor 1", url: "https://example1.com" });
    db.createMonitor({ name: "Monitor 2", url: "https://example2.com" });
    const monitors = db.getMonitors();
    expect(monitors).toHaveLength(2);
  });

  it("should update a monitor", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    const updated = db.updateMonitor(monitor.id, { name: "Updated", status: "up" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Updated");
    expect(updated!.status).toBe("up");
  });

  it("should delete a monitor", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    db.deleteMonitor(monitor.id);
    expect(db.getMonitor(monitor.id)).toBeNull();
  });

  it("should add and retrieve checks", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    db.addCheck({
      id: "check-1", monitorId: monitor.id, status: "up", responseTime: 150,
      statusCode: 200, error: null, checkedAt: new Date().toISOString(),
    });
    db.addCheck({
      id: "check-2", monitorId: monitor.id, status: "down", responseTime: 0,
      statusCode: null, error: "Timeout", checkedAt: new Date().toISOString(),
    });
    const checks = db.getChecks(monitor.id, 10);
    expect(checks).toHaveLength(2);
  });

  it("should create and resolve incidents", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    const incident = db.createIncident(monitor.id, monitor.name, "Service down");
    expect(incident.status).toBe("active");

    const active = db.getActiveIncidents();
    expect(active).toHaveLength(1);

    db.resolveIncident(incident.id);
    const resolved = db.getActiveIncidents();
    expect(resolved).toHaveLength(0);
  });

  it("should get active incident for a monitor", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    db.createIncident(monitor.id, monitor.name, "Down");
    const incident = db.getActiveIncidentForMonitor(monitor.id);
    expect(incident).not.toBeNull();
    expect(incident!.monitorId).toBe(monitor.id);
  });

  it("should create and delete notification channels", () => {
    const channel = db.createChannel({ name: "Email", type: "email", config: { email: "test@test.com" } });
    expect(channel.name).toBe("Email");

    const channels = db.getChannels();
    expect(channels).toHaveLength(1);

    db.deleteChannel(channel.id);
    expect(db.getChannels()).toHaveLength(0);
  });

  it("should count total checks", () => {
    const monitor = db.createMonitor({ name: "Test", url: "https://example.com" });
    db.addCheck({ id: "c1", monitorId: monitor.id, status: "up", responseTime: 100, statusCode: 200, error: null, checkedAt: new Date().toISOString() });
    db.addCheck({ id: "c2", monitorId: monitor.id, status: "up", responseTime: 120, statusCode: 200, error: null, checkedAt: new Date().toISOString() });
    expect(db.getTotalChecks()).toBe(2);
  });
});
