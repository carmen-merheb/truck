import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { Keys } from './Keys'

export function Help(): JSX.Element {
  const [set, help, sound, actions] = useStore((s) => [s.set, s.help, s.sound, s.actions])
  const close = () => set({ help: false })
  const open  = () => set({ help: true })

  useEffect(() => {
    if (!help) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey, { capture: true })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true } as any)
      document.body.style.overflow = prev
    }
  }, [help])

  return (
    <>
      <div className={`${sound ? 'sound' : 'nosound'}`} />
      <div className="help">
        {!help && <button className="btn" onClick={open}>Help</button>}
      </div>

      <div className={`help-overlay ${help ? 'open' : ''}`} onClick={close} role="dialog" aria-modal="true">
        <div className="help-content" onClick={(e) => e.stopPropagation()}>
          <div className="help-head">
            <h3>Controls</h3>
            <div className="spacer" />
            <button className="ghost" onClick={() => actions.sound()}>{sound ? 'Sound: On' : 'Sound: Off'}</button>
            <button className="ghost" onClick={close}>Close</button>
          </div>

          {/* compact, no header, fills the card */}
          <Keys className="help-keys" compact hideHeader />
          
          <div className="help-legend">
            <div><b>Esc</b> Close</div>
            <div><b>Enter / Space</b> Start Engine</div>
            <div><b>R</b> Reset Truck</div>
            <div><b>Shift</b> Boost</div>
          </div>
        </div>
      </div>
    </>
  )
}
