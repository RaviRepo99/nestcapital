import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ServerCog, Send, Sparkles } from 'lucide-react'
import './style.css'

// Replace this value with the live Telegram channel or group URL.
const TELEGRAM_URL = 'https://t.me/Capital_Nest_Nepal'

function StatusBadge() {
  return <div className="status-badge" aria-label="Server status: Updating"><span className="status-dot" aria-hidden="true" /><span>Server status</span><strong>Updating</strong></div>
}

function UpdateMark() {
  return <div className="update-mark" aria-hidden="true">
    <motion.div className="update-orbit update-orbit-one" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
    <motion.div className="update-orbit update-orbit-two" animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />
    <div className="update-icon-shell"><ServerCog size={32} strokeWidth={1.5} /><span className="update-spark"><Sparkles size={13} /></span></div>
  </div>
}

function MaintenanceCard() {
  return <motion.main className="maintenance-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
    <div className="card-header"><span className="eyebrow"><span className="eyebrow-line" /> Planned maintenance</span><StatusBadge /></div>
    <UpdateMark />
    <div className="content-copy"><h1>Server update<br /><em>in progress.</em></h1><p className="intro">We&apos;re tuning the systems behind your experience to make everything faster, steadier, and more reliable.</p></div>
    <div className="notice-panel"><CheckCircle2 size={18} aria-hidden="true" /><p>Please stay tuned while we complete the update. Avoid refreshing or repeatedly attempting to access the website.</p></div>
    <div className="action-block"><p>For further updates, announcements, and server status:</p><a className="telegram-button" href={TELEGRAM_URL} target="_blank" rel="noreferrer"><Send size={17} fill="currentColor" aria-hidden="true" /><span>Join Telegram</span><ArrowUpRight size={16} aria-hidden="true" /></a></div>
    <footer>Thank you for your patience and support.</footer>
  </motion.main>
}

function App() {
  return <AnimatePresence><div className="page-shell"><div className="ambient-grid" aria-hidden="true" /><div className="ambient-glow ambient-glow-one" aria-hidden="true" /><div className="ambient-glow ambient-glow-two" aria-hidden="true" /><div className="brand-stamp" aria-hidden="true">SYS / 04</div><MaintenanceCard /><div className="page-index" aria-hidden="true">01 <span /> maintenance mode</div></div></AnimatePresence>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)