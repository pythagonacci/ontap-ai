import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Minus, X, Maximize2, Moon, Sun } from "lucide-react";

export default function CommandPalettePrototype() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCmd, setActiveCmd] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) { e.preventDefault(); setOpen(v => !v); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cmds = ["/explain", "/answer", "/rewrite"];

  return (
    <div className={`min-h-[100vh] w-full flex items-start justify-center pt-16 transition-colors duration-300 ${darkMode ? "bg-[linear-gradient(135deg,#0e0e0e_0%,#1a1a1a_100%)]" : "bg-[linear-gradient(135deg,#f7f7f9_0%,#fdfdfd_60%,#ffffff_100%)]"}`}>
      <div className="fixed top-4 right-4 flex gap-2">
        <button onClick={() => setOpen(v => !v)} className="rounded-full border border-gray-200 bg-white/30 backdrop-blur-md px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:shadow transition">Toggle (⌘/Ctrl+K)</button>
        <button onClick={() => setDarkMode(d => !d)} className="rounded-full border border-gray-300 bg-white/30 dark:bg-black/30 backdrop-blur-md p-2 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow transition">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6, clipPath: "inset(70% 55% 15% 70% round 24px)" }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, skewX: 0, clipPath: expanded ? "inset(0% 0% 0% 0% round 20px)" : "inset(0% 0% 0% 0% round 24px)" }}
            exit={{ opacity: 0, scale: 0.48, x: -180, y: 180, rotate: -10, skewX: -6, clipPath: "inset(70% 55% 15% 70% round 24px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.6 }}
            style={{ willChange: "transform, opacity, clip-path", transformOrigin: "bottom left" }}
            className={`transform-gpu ${expanded ? "fixed top-6 right-6 h-[min(90vh,calc(100vh-48px))] w-[min(760px,52vw)]" : "relative h-[min(600px,80vh)] w-[min(420px,85vw)]"} rounded-[24px]
                       border ${darkMode ? "border-white/20 bg-white/5 ring-1 ring-white/10" : "border-white/20 bg-white/20 ring-1 ring-white/30"}
                       backdrop-blur-[28px] saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                       overflow-hidden flex flex-col transition-[background,box-shadow,border-color] duration-300`}
            role="dialog" aria-modal>

            {/* sheen + caustics */}
            <motion.div initial={{ x: -500, y: -80, rotate: -4, opacity: 0 }} animate={{ x: [-500,-250,0,250,500], y: [-80,-40,0,40,80], rotate: [-4,-2,0,2,4], opacity: [0,.25,.4,.25,0] }} transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }} className="pointer-events-none absolute -left-1/3 inset-y-0 w-3/4 -skew-x-12" style={{ willChange:"transform, opacity", background: darkMode?"linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0) 100%)":"linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%)", filter:"blur(22px)" }} />

            <motion.div initial={{opacity:.12}} animate={{opacity:[.12,.2,.12]}} transition={{duration:12,repeat:Infinity,ease:"easeInOut"}} className="pointer-events-none absolute inset-0">
              {[
                { sx:"-10%", sy:"20%", size:160, pathX:[-30,-10,20,0,-20,-30], pathY:[0,8,-6,-10,-4,0] },
                { sx:"60%", sy:"-10%", size:120, pathX:[0,-15,-30,-15,0], pathY:[0,6,12,6,0] },
                { sx:"30%", sy:"70%", size:180, pathX:[0,15,30,15,0,-15], pathY:[0,-6,-12,-6,0,6] },
              ].map((b,i)=>(
                <motion.div key={i} initial={{x:0,y:0,scale:1}} animate={{x:b.pathX,y:b.pathY,scale:[1,1.03,0.97,1.02,1]}} transition={{duration:16+i*4,repeat:Infinity,ease:"easeInOut"}} className="absolute rounded-full" style={{left:b.sx,top:b.sy,width:b.size,height:b.size,filter:"blur(20px)",background:darkMode?"radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0) 70%)":"radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0) 70%)"}} />
              ))}
            </motion.div>

            <motion.div initial={{x:-360,opacity:.1}} animate={{x:360,opacity:[.1,.05,.1]}} transition={{duration:20,ease:"easeInOut",repeat:Infinity,repeatType:"mirror"}} className="pointer-events-none absolute inset-0 -skew-x-6" style={{background:darkMode?"linear-gradient(60deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0) 80%)":"linear-gradient(60deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.14) 30%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0) 90%)"}} />

            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <button aria-label="Close" onClick={()=>setOpen(false)} className="h-4 w-4 rounded-full bg-red-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90"><X className="h-3 w-3" /></button>
                <div className="h-4 w-4 rounded-full bg-amber-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90"><Minus className="h-3 w-3" /></div>
                <button aria-label={expanded?"Restore":"Maximize"} onClick={()=>setExpanded(e=>!e)} className="h-4 w-4 rounded-full bg-emerald-400/80 shadow-inner flex items-center justify-center text-[10px] text-white/90" title={expanded?"Restore size":"Expand to side"}><Maximize2 className="h-3 w-3" /></button>
              </div>
              <div className="ml-3 h-6 w-px bg-white/40" />
              <div className={`text-[13px] ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Command Palette</div>
            </div>

            {/* Body */}
            <div className={`flex-1 ${expanded?"px-6 pb-6 pt-4":"px-5 pb-5 pt-5"} flex flex-col justify-between`}>
              <div className={`flex flex-1 justify-center items-center select-none text-[14px] gap-10 tracking-wider ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                {cmds.map(c=>(
                  <button key={c} onClick={()=>{ setActiveCmd(c); setQuery(`${c}: `); }} className={`bg-transparent p-0 m-0 border-0 cursor-pointer pl-3 underline underline-offset-4 decoration-1 ${darkMode ? "decoration-gray-500 hover:decoration-blue-400" : "decoration-gray-400 hover:decoration-blue-500"} focus:outline-none ${activeCmd===c ? "font-semibold decoration-blue-600" : ""}`}>{c}</button>
                ))}
              </div>

              <div className="relative mt-5">
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask a question or choose a command…" className={`w-full rounded-[999px] border shadow-inner backdrop-blur-2xl px-4 py-3 pr-12 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${darkMode ? "bg-white/10 border-white/20 text-gray-100 placeholder:text-gray-400" : "bg-white/20 border-white/30 text-gray-900 placeholder:text-gray-600"}`} />
                <button aria-label="Submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-black/80 text-white shadow hover:opacity-90"><ArrowUp className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
