import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { getState, useStore } from '../store'
import type { Transform } from '../store'

type Finish = { position: [number, number, number]; rotationY: number }

type Props = {
  checkpoints: Transform[]          // Start + mids (respawn points)
  finish?: Finish                   // optional timing-only finish
  lateralHalfWidth?: number         // plane half-width in meters
}

export default function SmartCheckpoints({
  checkpoints,
  finish,
  lateralHalfWidth = 12,            // tweak width as needed
}: Props) {
  const actions = useStore((s) => s.actions)
  const setCheckpoint = useStore((s) => s.setCheckpoint)

  // authoritative truck position
  const pos = useRef(new Vector3())
  const prevDist = useRef<number | null>(null)  // signed distance to current gate
  const gateIndex = useRef(0)                   // which gate we’re heading to (0 = START plane)

  // subscribe to physics position (authoritative)
  useEffect(() => {
    const api = getState().api
    if (!api) return
    const unsub = api.position.subscribe(([x, y, z]) => pos.current.set(x, y, z))
    return () => { unsub() }
  }, [])

  // seed lastCheckpoint to START on mount (once)
  useEffect(() => {
    if (checkpoints.length > 0) setCheckpoint(checkpoints[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // plane-crossing test each animation frame via r3f's internal loop
  useEffect(() => {
    let raf = 0
    const right = new Vector3(1,0,0)
    const up    = new Vector3(0,1,0)

    const tick = () => {
      const i = gateIndex.current
      // choose the *next* gate to reach (keep finish separate)
      const isFinalGate = i >= checkpoints.length
      const gate = isFinalGate ? null : checkpoints[i]

      // helper to test crossing against a gate plane
      const testGate = (gp: Transform, onHit: () => void) => {
        const gpPos = new Vector3().fromArray(gp.position)
        const fwd   = new Vector3(0,0,-1).applyAxisAngle(up, gp.rotationY)    // track forward
        const left  = right.clone().applyAxisAngle(up, gp.rotationY)          // world-left for lateral bounds

        const rel   = pos.current.clone().sub(gpPos)
        const dist  = rel.dot(fwd)                                            // signed distance to plane
        const side  = Math.abs(rel.dot(left))                                  // lateral offset from center

        // init prevDist on first run for this gate
        if (prevDist.current === null) prevDist.current = dist

        // cross plane from "behind" -> "ahead" (negative -> positive), inside lateral bounds
        if (prevDist.current <= 0 && dist > 0 && side <= lateralHalfWidth) {
          onHit()
          // advance to next gate, reset prevDist for it
          gateIndex.current = i + 1
          prevDist.current = null
          return
        }
        prevDist.current = dist
      }

      if (gate) {
        // Start gate behaves like a normal plane for laps; use onStart only once if you want
        testGate(gate, () => {
          // Record respawn to this gate
          setCheckpoint(gate)
          // Fire checkpoint timing if not the very first Start seed
          if (i === 0) actions.onStart()
          else actions.onCheckpoint()
        })
      } else if (finish) {
        // After the last checkpoint, look for finish plane; DO NOT set respawn here
        testGate({ position: finish.position, rotationY: finish.rotationY, index: -1 }, () => {
          actions.onFinish()
          // Prepare next lap: go back to the first gate (index 0)
          gateIndex.current = 0
          prevDist.current = null
          // Optional: seed respawn back to START for the next lap
          setCheckpoint(checkpoints[0])
        })
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoints, finish, lateralHalfWidth])

  return null
}
