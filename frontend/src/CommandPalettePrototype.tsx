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
async function runCommand(params: { input: string; action: Action; url?: string; tone?: string }) {
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
    // only start drag on primary button
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
      const { output } = await runCommand({ input: cleaned, action, url });
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

  /** ---------- WRAPPER: embedded floats, page untouched ---------- */
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
            /** draggable panel — drag starts only from header */
            drag={!expanded}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.12}
            /** critical for scroll: allow children to overflow */
            className={`pointer-events-auto transform-gpu min-h-0 ${
              expanded
                ? "fixed top-6 right-6 h-[min(90vh,calc(100vh-48px))] w-[min(760px,52vw)]"
                : "relative h-[min(600px,80vh)] w-[min(420px,85vw)]"
            } rounded-[24px]
              border dark:border-white/20 dark:bg-white/5 dark:ring-1 dark:ring-white/10
                     border-white/20 bg-white/20 ring-1 ring-white/30
              backdrop-blur-[28px] saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.10)]
              overflow-hidden flex flex-col transition-[background,box-shadow,border-color] duration-300`}
            role="dialog" aria-modal
            initial={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6, clipPath: "inset(70% 55% 15% 70% round 24px)" }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, skewX: 0, clipPath: expanded ? "inset(0% 0% 0% 0% round 20px)" : "inset(0% 0% 0% 0% round 24px)" }}
            exit={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6, clipPath: "inset(70% 55% 15% 70% round 24px)" }}
            transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.3 }}
            style={{ willChange: "transform, opacity, clipPath", transformOrigin: "bottom left" }}
          >
            {/* LIQUID GLASS layers */}
            <motion.div
              initial={{ x: -500, y: -80, rotate: -4, opacity: 0 }}
              animate={{ x: [-500,-250,0,250,500], y: [-80,-40,0,40,80], rotate: [-4,-2,0,2,4], opacity: [0,.25,.4,.25,0] }}
              transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
              className="pointer-events-none absolute -left-1/3 inset-y-0 w-3/4 -skew-x-12
                         dark:[background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.36)_50%,rgba(255,255,255,0)_100%)]
                         [background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.28)_50%,rgba(255,255,255,0)_100%)]
                         [filter:blur(22px)]"
            />
            <motion.div initial={{opacity:.12}} animate={{opacity:[.12,.2,.12]}} transition={{duration:12,repeat:Infinity,ease:"easeInOut"}} className="pointer-events-none absolute inset-0">
              {[
                { sx:"-10%", sy:"20%", size:160, pathX:[-30,-10,20,0,-20,-30], pathY:[0,8,-6,-10,-4,0] },
                { sx:"60%", sy:"-10%", size:120, pathX:[0,-15,-30,-15,0], pathY:[0,6,12,6,0] },
                { sx:"30%", sy:"70%", size:180, pathX:[0,15,30,15,0,-15], pathY:[0,-6,-12,-6,0,6] },
              ].map((b,i)=>(
                <motion.div key={i}
                  initial={{x:0,y:0,scale:1}}
                  animate={{x:b.pathX,y:b.pathY,scale:[1,1.03,0.97,1.02,1]}}
                  transition={{duration:16+i*4,repeat:Infinity,ease:"easeInOut"}}
                  className="absolute rounded-full [filter:blur(20px)]
                             dark:[background:radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.07)_45%,rgba(255,255,255,0)_70%)]
                             [background:radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.15)_45%,rgba(255,255,255,0)_70%)]"
                  style={{left:b.sx,top:b.sy,width:b.size,height:b.size}}
                />
              ))}
            </motion.div>
            <motion.div
              initial={{x:-360,opacity:.1}}
              animate={{x:360,opacity:[.1,.05,.1]}}
              transition={{duration:20,ease:"easeInOut",repeat:Infinity,repeatType:"mirror"}}
              className="pointer-events-none absolute inset-0 -skew-x-6
                         dark:[background:linear-gradient(60deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0)_80%)]
                         [background:linear-gradient(60deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.14)_30%,rgba(255,255,255,0.06)_60%,rgba(255,255,255,0)_90%)]"
            />

            {/* Header (drag handle + internal controls) */}
            <div
              onPointerDown={startDrag}
              className="sticky top-0 z-30 flex items-center gap-2 px-4 pt-3 pb-2 select-none cursor-grab active:cursor-grabbing
                         bg-transparent backdrop-blur-[1px]"
            >
              <div className="flex items-center gap-2">
                <button aria-label="Close" onClick={()=>setOpen(false)} className="h-4 w-4 rounded-full bg-red-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90"><X className="h-3 w-3" /></button>
                <div className="h-4 w-4 rounded-full bg-amber-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90"><Minus className="h-3 w-3" /></div>
                <button aria-label={expanded?"Restore":"Maximize"} onClick={()=>setExpanded(e=>!e)} className="h-4 w-4 rounded-full bg-emerald-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90" title={expanded?"Restore size":"Expand to side"}><Maximize2 className="h-3 w-3" /></button>
              </div>

              <div className="ml-3 h-6 w-px dark:bg-white/40 bg-white/40" />
              <div className="text-[13px] dark:text-gray-200 text-gray-600">Command Palette</div>

                              <div className="ml-auto flex items-center gap-3">
                  <div className="text-[11px] dark:text-gray-300 text-gray-600 hidden sm:block" title="Keyboard shortcut">
                    ⌘K / Ctrl+K
                  </div>
                </div>
            </div>

                         {/* Body (make sure this column can shrink and the scroller gets space) */}
             <div className={`${expanded?"px-6 pb-6 pt-2":"px-5 pb-5 pt-3"} flex-1 min-h-0 flex flex-col`}>
               {/* Hover commands row – appears over header with heavy opacity */}
               {msgs.length > 0 && (
                 <div className="absolute top-0 left-0 right-0 z-40">
                   <div className="py-3.5 dark:bg-black/90 bg-white/90 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity duration-200">
                     <div className="flex justify-center items-center select-none text-[13px] gap-8 tracking-wider dark:text-gray-200 text-gray-700">
                       {["/explain","/answer","/rewrite"].map(c=>(
                         <button key={c} onClick={()=>{ setActiveCmd(c); setQuery(`${c}: `); }} className="bg-transparent p-0 m-0 border-0 cursor-pointer underline underline-offset-4 decoration-1 dark:decoration-gray-400 hover:decoration-blue-500 focus:outline-none">{c}</button>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

              {/* Messages (the ONLY scroll container) */}
              <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 pr-1">
                {msgs.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center">
                    <div className="flex justify-center items-center select-none text-[14px] gap-10 tracking-wider mb-0 dark:text-gray-100 text-gray-800">
                      {["/explain","/answer","/rewrite"].map(c=>(
                        <button key={c} onClick={()=>{ setActiveCmd(c); setQuery(`${c}: `); }} className="bg-transparent p-0 m-0 border-0 cursor-pointer pl-3 underline underline-offset-4 decoration-1 dark:decoration-gray-500 hover:decoration-blue-500 focus:outline-none">{c}</button>
                      ))}
                    </div>
                    <div className="text-center text-xs font-light dark:text-gray-400 text-gray-500 mt-6">Start by choosing a command or just type your question.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {msgs.map(m => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-6 border backdrop-blur select-text cursor-text ${
                            m.role === "user"
                              ? "dark:bg-gray-600/30 dark:border-gray-500/40 dark:text-gray-100 bg-gray-200/80 border-gray-300/60 text-gray-800"
                              : "dark:bg-white/6 dark:border-white/15 dark:text-gray-100 bg-white/70 border-white/50 text-gray-900"
                          }`}
                          style={{ whiteSpace: "pre-wrap" }}
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
              <div className="relative mt-4 flex-shrink-0">
                <input
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                  placeholder="Ask a question or choose a command…"
                  className="w-full rounded-[999px] border shadow-inner backdrop-blur-2xl px-4 py-3 pr-14 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400/60
                             dark:bg-white/10 dark:border-white/20 dark:text-gray-100 dark:placeholder:text-gray-400
                             bg-white/20 border-white/30 text-gray-900 placeholder:text-gray-600"
                />
                <button
                  aria-label="Submit"
                  onClick={onSubmit}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/80 text-white shadow hover:opacity-90 disabled:opacity-60 flex items-center justify-center"
                >
                  <ArrowUp className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
                </button>
              </div>

                             {/* Footer line */}
               <div className="mt-2 text-xs h-5 flex-shrink-0">
                 {loading && <span className="dark:text-gray-300 text-gray-600">Working…</span>}
                 {error && <span className="text-red-600">{error}</span>}
               </div>

               
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
