import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Footer } from '@pmndrs/branding'
import { useProgress } from '@react-three/drei'
import type { ReactNode } from 'react'

import { useStore } from '../store'
import { setupSession, unAuthenticateUser } from '../data'
import { Keys } from './Keys'
import { Auth } from './Auth'

export function Intro({ children }: { children: ReactNode }): JSX.Element {
  const [clicked, setClicked] = useState(false)
  const [loading, setLoading] = useState(true)
  const { progress, active } = useProgress()
  const [session, set] = useStore((state) => [state.session, state.set])

  const canStart = useMemo(() => !loading && !active, [loading, active])
  const startRef = useRef<HTMLButtonElement | null>(null)

  // Ready -> kick to game
  useEffect(() => {
    if (clicked && canStart) set({ ready: true })
  }, [clicked, canStart, set])

  // Drei loader → toggle loading
  useEffect(() => {
    if (progress >= 100 && !active) setLoading(false)
  }, [progress, active])

  // Session boot
  useEffect(() => {
    setupSession(set)
  }, [set])

  // Keyboard: Enter/Space ⇒ Start
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canStart) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setClicked(true)
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any)
  }, [canStart])

  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>

      {/* Overlay */}
      <div
        className={`intro-screen ${loading ? 'loading' : 'loaded'} ${clicked ? 'clicked' : ''}`}
        aria-hidden={clicked && canStart ? true : false}
      >
        {/* background layers */}
        <div className="intro-bg" />
        <div className="intro-tread" aria-hidden />

        <div className="intro-wrap">
          {/* Left: Title + Progress + Start */}
          <section className="intro-left">
            <h1 className="intro-title">
              <span className="slab">TRUCK</span>
              <span className="neon">RALLY</span>
            </h1>

            <div className="intro-progress">
              <div className="bar">
                <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
              </div>
              <div className="meta">
                <span className="percent">
                  {loading ? `Loading ${progress.toFixed(0)}%` : 'Loaded'}
                </span>
                <span className={`state ${canStart ? 'ready' : 'wait'}`}>
                  {canStart ? 'Ready' : 'Preparing'}
                </span>
              </div>
            </div>

            <button
              ref={startRef}
              className={`intro-start ${canStart ? 'armed' : 'disabled'}`}
              onClick={() => canStart && setClicked(true)}
              disabled={!canStart}
              aria-disabled={!canStart}
            >
              <span className="dot" />
              <span>{canStart ? 'Start Engine' : 'Warming Up…'}</span>
              <kbd>Enter</kbd>
              <kbd>Space</kbd>
            </button>

            {/* Auth / user box */}
            <div className="intro-auth">
              {session?.user?.aud !== 'authenticated' ? (
                <Auth />
              ) : (
                <div className="intro-user">
                  <span>Hello&nbsp;<strong>{session.user.user_metadata.full_name}</strong></span>
                  <button className="ghost" onClick={unAuthenticateUser}>Logout</button>
                </div>
              )}
            </div>
          </section>

          {/* Right: Keys panel */}
          <section className="intro-right">
            <div className="panel">
              <div className="panel-head">
                <h3>Controls</h3>
                <span className="hint">Click <em>Bind</em>, then press a key</span>
              </div>
              <Keys />
            </div>
          </section>
        </div>

        <Footer
          date="25 Sep"
          year={String(new Date().getFullYear())}
          link1={<a href="https://github.com/pmndrs/react-three-fiber" target="_blank" rel="noreferrer">@react-three/fiber</a>}
          link2={<a href="https://github.com/pmndrs/racing-game" target="_blank" rel="noreferrer">/racing-game</a>}
        />
      </div>
    </>
  )
}
