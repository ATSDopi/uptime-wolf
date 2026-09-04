import nodemailer from "nodemailer";
import { NotificationChannel } from "../src/types.js";
import { Database } from "./db.js";

export class NotificationService {
  private db: Database;
  private transporter: nodemailer.Transporter | null = null;

  constructor(db: Database) {
    this.db = db;
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
  }

  async notifyAll(monitorName: string, status: string, reason: string): Promise<void> {
    const channels = this.db.getChannels().filter((c) => c.enabled);
    const subject = `[UptimeWolf] ${monitorName} is ${status.toUpperCase()}`;
    const message = `Monitor "${monitorName}" is now ${status}.\n\nReason: ${reason}\nTime: ${new Date().toISOString()}`;

    for (const channel of channels) {
      try {
        await this.send(channel, subject, message);
      } catch (err) {
        console.error(`Failed to send to channel ${channel.name}:`, err);
      }
    }
  }

  async send(channel: NotificationChannel, subject: string, message: string): Promise<void> {
    if (channel.type === "email") {
      await this.sendEmail(channel.config.email || "", subject, message);
    } else if (channel.type === "webhook") {
      await this.sendWebhook(channel.config.webhookUrl || "", subject, message);
    } else if (channel.type === "slack") {
      await this.sendSlack(channel.config.slackWebhook || "", subject, message);
    }
  }

  private async sendEmail(to: string, subject: string, message: string): Promise<void> {
    if (!this.transporter) {
      console.warn("SMTP not configured, skipping email notification");
      return;
    }
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || "UptimeWolf <alerts@uptimewolf.dev>",
      to,
      subject,
      text: message,
    });
  }

  private async sendWebhook(url: string, subject: string, message: string): Promise<void> {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, timestamp: new Date().toISOString() }),
    });
  }

  private async sendSlack(webhookUrl: string, subject: string, message: string): Promise<void> {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${subject}\n${message}` }),
    });
  }
}
