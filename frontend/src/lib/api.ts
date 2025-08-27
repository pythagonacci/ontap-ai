export type Action = "explain" | "rephrase" | "answer";

export async function runCommand(params: {
  input: string;
  action: Action;
  url?: string;
  tone?: string;
}) {
  const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const res = await fetch(`${base}/api/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<{ ok: true; output: string; model: string }>;
}
