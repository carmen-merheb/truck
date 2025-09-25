import { useEffect, useCallback, useState } from 'react'
import { useStore } from '../store'
import { getScores, insertScore } from '../data'
import { readableTime, Scores } from './LeaderBoard'
import { Auth } from './Auth'
import type { SavedScore } from '../data'

export const Finished = (): JSX.Element => {
  // pull finished time and reset action from store
  const [reset, session, time] = useStore(({ actions: { reset }, finished, session }) => [reset, session, finished])

  // local ui state
  const [scoreId, setScoreId] = useState<SavedScore['id']>('')
  const [scores, setScores] = useState<SavedScore[]>([])
  const [position, setPosition] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const isAuthenticated = session?.user?.aud === 'authenticated'

  const user = session?.user?.user_metadata
  const name = (user?.full_name || 'Racer') as string
  const thumbnail = (user?.avatar_url || '') as string

  // fetch leaderboard
  const updateScores = useCallback(async () => {
    try {
      const list = await getScores()
      setScores(list || [])
    } catch (e) {
      console.error('Failed to fetch scores', e)
      setScores([])
    }
  }, [])

  // recompute position from current scores + scoreId
  const updatePosition = useCallback(
    (list = scores, id = scoreId) => {
      const idx = list.findIndex((s) => s.id === id)
      setPosition(idx >= 0 ? idx + 1 : 0)
    },
    [scores, scoreId],
  )

  // submit score, then refresh list, then compute position – all in order
  const sendScore = useCallback(async () => {
    if (!time || submitting) return
    try {
      setSubmitting(true)
      const inserted = await insertScore({ name, thumbnail, time })
      const id = inserted?.[0]?.id as SavedScore['id']
      if (id) setScoreId(id)

      const list = await getScores()
      setScores(list || [])
      updatePosition(list, id)
    } catch (e) {
      console.error('Failed to submit score', e)
    } finally {
      setSubmitting(false)
    }
  }, [name, thumbnail, time, submitting, updatePosition])

  // initial + whenever time changes, fetch leaderboard
  useEffect(() => {
    updateScores()
  }, [time, updateScores])

  // if either the list or the id changes, recompute position
  useEffect(() => {
    updatePosition()
  }, [scoreId, scores, updatePosition])

  // allow quick restart via Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset])

  // guard: no screen if timer isn't finished yet
  if (!time) return <></>

  return (
    <div className="finished">
      <div className="finished-header">
        {/* readableTime already formats mm:ss.mmm, so no "seconds" suffix */}
        <h1>Finish time: {readableTime(time)}</h1>
      </div>

      <div className="finished-leaderboard">
        <Scores className="leaderboard" scores={scores} />
      </div>

      <div className="finished-auth">
        {isAuthenticated ? (
          <>
            {scoreId ? (
              position ? <h1>Leaderboard position: #{position}</h1> : <h2>Submitting…</h2>
            ) : (
              <>
                <h2>Nice run, {name}! Want to post it?</h2>
                <button
                  onClick={sendScore}
                  disabled={submitting}
                  style={{ margin: '0 auto', width: 'auto' }}
                  className="popup-item-key"
                >
                  {submitting ? 'Adding…' : 'Add my score'}
                </button>
              </>
            )}
          </>
        ) : (
          <Auth />
        )}
      </div>

      <div className="finished-restart">
        <button className="restart-btn" onClick={reset}>
          Restart
        </button>
      </div>
    </div>
  )
}
