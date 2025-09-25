import { useEffect } from 'react'
import { setState, useStore } from '../store'
import { readableTime } from './LeaderBoard'

export function Checkpoint(input: { index: number }) {
  const [bestArr, cpArr] = useStore((s) => [s.bestCheckpoint, s.checkpoint])

  const idx = input.index
  const cpTime = cpArr[idx] ?? 0
  const best   = bestArr[idx]

  const isBetter = best === undefined ? cpTime > 0 : (cpTime > 0 && cpTime < best)
  const diff = best === undefined ? cpTime : (cpTime - best)

  useEffect(() => {
    if (!cpTime) return
    const t = setTimeout(() => {
      if (isBetter) {
        setState((s) => {
          const nextCheckpoint = [...s.checkpoint]
          nextCheckpoint[idx] = 0
          const nextBest = [...s.bestCheckpoint]
          nextBest[idx] = cpTime
          return { checkpoint: nextCheckpoint, bestCheckpoint: nextBest }
        })
      } else {
        setState((s) => {
          const nextCheckpoint = [...s.checkpoint]
          nextCheckpoint[idx] = 0
          return { checkpoint: nextCheckpoint }
        })
      }
    }, 2500)
    return () => clearTimeout(t)
  }, [cpTime, isBetter, idx])

  if (!cpTime) return null

  const color = isBetter ? 'green' : 'red'
  const sign = isBetter ? '−' : '+'
  const delta = readableTime(Math.abs(diff))

  return (
    <div className={`cp-banner ${isBetter ? 'pb' : ''}`}>
      <div className="cp-left">
        <span className="cp-label">Checkpoint {idx}</span>
        <span className="cp-time">{readableTime(cpTime)}</span>
      </div>
      <div className={`cp-right ${color}`}>
        <span className="cp-delta">{sign}{delta}</span>
        <span className="cp-tag">{isBetter ? 'NEW BEST' : 'DELTA'}</span>
      </div>
      <div className="cp-glow" />
    </div>
  )
}
