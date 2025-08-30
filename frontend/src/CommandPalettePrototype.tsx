import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowUp, Minus, X, Maximize2 } from "lucide-react";

/** --- types / helpers --- */
type Action = "explain" | "rephrase" | "answer";
type Msg = { id: string; role: "user" | "assistant"; content: string; ts: number };
const newId = () => Math.random().toString(36).slice(2);

function inferAction(cmd: string | null): Action {
  if (!cmd) return "answer";
  const c = cmd.toLowerCase();
  if (c.startsWith("/explain")) return "explain";
  if (c.startsWith("/rewrite") || c.startsWith("/rephrase")) return "rephrase";
  if (c.startsWith("/answer")) return "answer";
  return "answer";
}

/** --- background bridge --- */
function bgSend<T = any>(msg: any) {
  return new Promise<T>((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError) {
          // @ts-ignore
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        // @ts-ignore
        resolve(resp);
      });
    } catch (e: any) {
      // @ts-ignore
      resolve({ ok: false, error: e?.message || String(e) });
    }
  });
}
async function bgPing() {
  return bgSend<{ ok: boolean; ts?: number; error?: string }>({ type: "PING_BG" });
}
function bgFetch(path: string, init: any) {
  return bgSend<{ ok: boolean; status?: number; body?: string; error?: string }>({
    type: "ONTAPAI_FETCH",
    path,
    method: init?.method || "GET",
    headers: init?.headers || {},
    body: init?.body ?? undefined,
  });
}
async function runCommand(params: { input: string; action: Action; url?: string; tone?: string; messages?: Msg[] }) {
  const resp = await bgFetch("/api/commands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: params,
  });
  if (!resp.ok) throw new Error(resp.error || `API ${resp.status}`);
  return JSON.parse(resp.body || "{}") as { ok: true; output: string; model: string };
}

export default function CommandPalettePrototype({ embedded = true }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCmd, setActiveCmd] = useState<string | null>(null);
  const [darkMode] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** dark mode root so Tailwind `dark:` works inside shadow */
  const themeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = themeRef.current;
    if (!el) return;
    el.classList.toggle("dark", darkMode);
  }, [darkMode]);

  /** drag controls: drag only from header so scroll works everywhere else */
  const dragControls = useDragControls();
  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragControls.start(e);
  };

  /** session + history */
  const sessionId = useMemo(() => {
    const key = "ontapai_session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const s = newId(); sessionStorage.setItem(key, s); return s;
  }, []);
  const storageKey = `ontapai_thread:${sessionId}`;
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]") as Msg[]; }
    catch { return []; }
  });
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(msgs)); }, [msgs, storageKey]);

  // hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) { e.preventDefault(); setOpen(v => !v); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { bgPing(); }, []);

  /** submit */
  async function onSubmit() {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    const cleaned = trimmed.replace(/^\/(explain|answer|rewrite|rephrase)\s*:?\s*/i, "");
    const userMsg: Msg = { id: newId(), role: "user", content: cleaned, ts: Date.now() };
    setMsgs(m => [...m, userMsg]); setQuery(""); setError(null); setLoading(true);
    try {
      const action = inferAction(activeCmd);
      const url = window.location.href;
      const { output } = await runCommand({ input: cleaned, action, url, messages: msgs });
      const botMsg: Msg = { id: newId(), role: "assistant", content: output, ts: Date.now() };
      setMsgs(m => [...m, botMsg]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // auto-scroll
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, open, expanded]);

  /** hover state for command strip */
  const [headerHover, setHeaderHover] = useState(false);
  const [controlsHover, setControlsHover] = useState(false);

  // show strip only when: there are msgs, header hovered, and not over the traffic-light controls
  const showCmdStrip = msgs.length > 0 && headerHover && !controlsHover;

  /** ---------- WRAPPER ---------- */
  return (
    <div
      ref={themeRef}
      className={
        embedded
          ? "pointer-events-none fixed inset-0 flex items-center justify-center"
          : `min-h-[100vh] w-full flex items-start justify-center pt-16 transition-colors duration-300 ${
              darkMode ? "bg-[linear-gradient(135deg,#0e0e0e_0%,#1a1a1a_100%)]" :
                         "bg-[linear-gradient(135deg,#f7f7f9_0%,#fdfdfd_60%,#ffffff_100%)]"}`
      }
    >
      <AnimatePresence>
        {open && (
          <motion.div
            drag={!expanded}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.12}
            className={`pointer-events-auto transform-gpu min-h-0 group font-sans ${
              expanded
                ? "fixed top-6 right-6 h-[min(90vh,calc(100vh-48px))] w-[min(760px,52vw)]"
                : "relative h-[min(600px,80vh)] w-[min(420px,85vw)]"
            } rounded-[24px]
              border dark:border-white/20 dark:bg-white/5 dark:ring-1 dark:ring-white/10
                     border-white/20 bg-white/20 ring-1 ring-white/30
              backdrop-blur-[28px] saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.10)]
              overflow-hidden flex flex-col transition-[background,box-shadow,border-color] duration-300`}
            role="dialog" aria-modal
            initial={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, skewX: 0 }}
            exit={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6 }}
            transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.3 }}
            style={{ willChange: "transform, opacity", transformOrigin: "bottom left" }}
          >
            {/* Header */}
            <div
              onPointerDown={startDrag}
              onMouseEnter={() => setHeaderHover(true)}
              onMouseLeave={() => setHeaderHover(false)}
              className="sticky top-0 z-30 flex items-center gap-2 px-4 pt-3 pb-2 select-none cursor-grab active:cursor-grabbing bg-transparent"
            >
              <div
                onMouseEnter={() => setControlsHover(true)}
                onMouseLeave={() => setControlsHover(false)}
                className="flex items-center gap-2 relative z-50"
              >
                <button onClick={() => setOpen(false)} className="h-4 w-4 rounded-full bg-red-400/80 flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </button>
                <button onClick={() => setOpen(false)} className="h-4 w-4 rounded-full bg-amber-400/80 flex items-center justify-center">
                  <Minus className="h-3 w-3 text-white" />
                </button>
                <button onClick={() => setExpanded(e => !e)} className="h-4 w-4 rounded-full bg-gray-400/80 flex items-center justify-center">
                  <Maximize2 className="h-3 w-3 text-white" />
                </button>
              </div>
              <div className="ml-3 text-[13px] dark:text-gray-200 text-gray-600">Command Palette</div>
            </div>

            {/* Hover strip */}
            {showCmdStrip && (
              <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
                <div className="w-full flex justify-center mt-0">
                  <div
                    className="pointer-events-auto py-2 px-4 rounded-full shadow-sm dark:bg-black/98 bg-white/98 backdrop-blur-md"
                    onMouseEnter={() => setHeaderHover(true)}
                    onMouseLeave={() => setHeaderHover(false)}
                  >
                    <div className="flex justify-center items-center gap-6 text-[13px]">
                      {["/explain", "/answer", "/rewrite"].map(c => (
                        <button
                          key={c}
                          onClick={() => { setActiveCmd(c); setQuery(`${c}: `); }}
                          className="underline underline-offset-4 decoration-1 dark:decoration-gray-400 hover:decoration-blue-500 cursor-pointer"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 font-sans">
              {msgs.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center">
                  <div className="flex gap-8 text-[14px]">
                    {["/explain", "/answer", "/rewrite"].map(c => (
                      <button
                        key={c}
                        onClick={() => { setActiveCmd(c); setQuery(`${c}: `); }}
                        className="underline underline-offset-4 decoration-1 hover:decoration-blue-500"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-6">Start by choosing a command or just type.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {msgs.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-6 border backdrop-blur ${
                          m.role === "user"
                            ? "bg-gray-200/80 dark:bg-gray-600/30"
                            : "bg-white/70 dark:bg-white/6"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="relative mt-4 flex-shrink-0 px-6">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                placeholder="Ask a question or choose a command…"
                className="w-full rounded-[999px] px-4 py-3 pr-12 border-gray-300 dark:border-gray-600 shadow-inner focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 focus:outline-none font-sans"
              />
              <button
                onClick={onSubmit}
                className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/80 text-white"
              >
                <ArrowUp className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
              </button>
            </div>

            {/* Footer area with status line */}
            <div className="mt-2 pb-6 flex-shrink-0 px-6">
              {loading && <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Working…</div>}
              {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
