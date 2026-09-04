export type MonitorStatus = "up" | "down" | "paused" | "pending";

export type MonitorType = "http" | "tcp" | "ping";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatusCodes: number[];
  status: MonitorStatus;
  lastChecked: string | null;
  lastDown: string | null;
  uptimePercentage: number;
  responseTime: number;
  enabled: boolean;
  createdAt: string;
  retries: number;
  recentChecks?: MonitorCheck[];
}

export interface MonitorCheck {
  id: string;
  monitorId: string;
  status: "up" | "down";
  responseTime: number;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "webhook" | "slack";
  config: {
    email?: string;
    webhookUrl?: string;
    slackWebhook?: string;
  };
  enabled: boolean;
  createdAt: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  status: "active" | "resolved";
  startedAt: string;
  resolvedAt: string | null;
  reason: string;
  duration: number;
}

export interface DashboardSummary {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  avgUptime: number;
  avgResponseTime: number;
  activeIncidents: number;
  totalChecks: number;
}

export interface MonitorWithChecks extends Monitor {
  recentChecks: MonitorCheck[];
  incidents: Incident[];
}
