import { useState, useEffect } from "react";
import { NotificationChannel } from "../types";
import { fetchChannels, createChannel, deleteChannel, testChannel } from "../api";
import { Plus, Trash2, Send, Mail, Webhook, Slack } from "lucide-react";

export function Settings() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"email" | "webhook" | "slack">("email");
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchChannels();
      setChannels(data);
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      await createChannel({
        name,
        type,
        config: { email, webhookUrl, slackWebhook },
        enabled: true,
      });
      setShowForm(false);
      setName("");
      setEmail("");
      setWebhookUrl("");
      setSlackWebhook("");
      load();
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification channel?")) return;
    try {
      await deleteChannel(id);
      load();
    } catch (err) {
      console.error("Failed to delete channel:", err);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await testChannel(id);
    } finally {
      setTesting(null);
    }
  };

  const icons: Record<string, any> = { email: Mail, webhook: Webhook, slack: Slack };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure notification channels</p>
      </div>

      {channels.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Notification Channels</h3>
          <div className="space-y-2">
            {channels.map((ch) => {
              const Icon = icons[ch.type] || Mail;
              return (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{ch.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{ch.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary p-2"
                      onClick={() => handleTest(ch.id)}
                      disabled={testing === ch.id}
                      title="Send test notification"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      className="btn-danger p-2"
                      onClick={() => handleDelete(ch.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Add Notification Channel</h3>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <select className="input-field" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
              <option value="slack">Slack</option>
            </select>
          </div>

          {type === "email" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alerts@example.com" />
            </div>
          )}

          {type === "webhook" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Webhook URL</label>
              <input className="input-field" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" />
            </div>
          )}

          {type === "slack" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Slack Webhook URL</label>
              <input className="input-field" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={handleCreate}>Create Channel</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add Notification Channel
        </button>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">📧 Email Notifications</p>
        <p>Configure SMTP settings in your .env file to enable email notifications.</p>
      </div>
    </div>
  );
}
