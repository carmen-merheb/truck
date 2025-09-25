import { useEffect, useRef, useState } from 'react'
import { mutation, useStore } from '../store'

function fmt(ms: number) {
  if (!ms || ms < 0) return '00:00.000'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const t = Math.floor(ms % 1000)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(t).padStart(3,'0')}`
}

export function Clock() {
  // start is 0 until you cross the Start goal (actions.onStart sets it)
  const [start, finished] = useStore((s) => [s.start, s.finished])

  const [now, setNow] = useState(() => Date.now())
  const [kmh, setKmh] = useState(0)
  const raf = useRef<number>(0)

  // Keep a simple running flag — only true after Start gate is crossed
  const running = !!start && !finished
  const elapsed = finished ? finished : running ? now - start : 0

  // Smooth updates; only advance timer when running
  useEffect(() => {
    const tick = () => {
      if (running) setNow(Date.now())
      // speed meter can update always (visual feedback before start)
      setKmh(Math.max(0, Math.min(220, Math.round(mutation.speed * 3.6))))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [running])

  // When Start gate is crossed, sync `now` to `start` to avoid any first-frame jump
  useEffect(() => {
    if (start) setNow(start)
  }, [start])

  // When finished is set, pin the display to final time immediately
  useEffect(() => {
    if (finished) setNow(finished)
  }, [finished])

  // speed bar + tiny shake
  const spd = kmh
  const bar = Math.min(100, (spd / 180) * 100)
  const shake = spd > 80 ? Math.min(1, (spd - 80) / 80) : 0

  return (
    <div className="truck-clock hud-card" style={{ transform: `translateZ(0) translateY(${shake * -1.5}px)` }}>
      <div className="clock-top">
        <span className="clock-label">RACE TIME</span>
        <span className={`clock-status ${running ? 'live' : finished ? 'done' : ''}`}>
          {running ? 'LIVE' : finished ? 'FINISHED' : 'READY'}
        </span>
      </div>

      <div className="clock-time">{fmt(elapsed)}</div>

      <div className="clock-strip">
        <svg viewBox="0 0 320 16" className="strip-bg" aria-hidden>
          <defs>
            <linearGradient id="revgrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#12d6ff"/>
              <stop offset="100%" stopColor="#58ff9c"/>
            </linearGradient>
          </defs>
          <rect x="0" y="2" width="320" height="12" rx="6" className="strip-rail"/>
          <rect x="0" y="2" width={(320 * bar) / 100} height="12" rx="6" className="strip-fill"/>
          {Array.from({length: 15}).map((_,i)=>(
            <rect key={i} x={i*21.5} y="0" width="2" height="16" className="strip-tick"/>
          ))}
        </svg>
        <span className="clock-speed">
          {spd}
          <em>km/h</em>
        </span>
      </div>
    </div>
  )
}
