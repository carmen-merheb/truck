import { useState, useCallback, useEffect, useMemo } from 'react'
import type { HTMLAttributes } from 'react'
import { keys } from '../keys'
import { setState, useStore } from '../store'
import type { ActionInputMap, BindableActionName } from '../store'

const inputDisplayNameMap = {
  alt: 'Alt ⌥',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  backspace: 'Backspace ⌫',
  capslock: 'Caps ⇪',
  control: 'Ctrl ⌃',
  enter: 'Enter ↵',
  meta: 'Meta ⌘',
  shift: 'Shift ⇧',
  ' ': 'Space ␣',
  tab: 'Tab ⇥',
} as const

type InputWithDisplayName = keyof typeof inputDisplayNameMap
const isInputWithDisplayName = (v: PropertyKey): v is InputWithDisplayName =>
  Object.hasOwnProperty.call(inputDisplayNameMap, v)

/* Display names + ordering for the action list */
const actionDisplayMap: Record<BindableActionName, { displayName: string; order: number }> = {
  forward: { displayName: 'Throttle', order: 0 },
  backward: { displayName: 'Reverse', order: 1 },
  left: { displayName: 'Steer Left', order: 2 },
  right: { displayName: 'Steer Right', order: 3 },
  brake: { displayName: 'Brake / Drift', order: 4 },
  boost: { displayName: 'Turbo Boost', order: 5 },
  honk: { displayName: 'Horn', order: 6 },
  reset: { displayName: 'Reset Truck', order: 7 },
  editor: { displayName: 'Editor', order: 8 },
  help: { displayName: 'Help', order: 9 },
  leaderboard: { displayName: 'Leaderboards', order: 10 },
  map: { displayName: 'Minimap', order: 11 },
  pickcolor: { displayName: 'Paint / Color', order: 12 },
  sound: { displayName: 'Toggle Mute', order: 13 },
  camera: { displayName: 'Cycle Camera', order: 14 },
}

function Keycap({ label, onClick, removable }: { label: string; onClick?: () => void; removable?: boolean }) {
  return (
    <button className={`keycap ${removable ? 'removable' : ''}`} onClick={onClick} title={removable ? 'Remove binding' : undefined}>
      <span>{label}</span>
      {removable && <i className="keycap-x">×</i>}
    </button>
  )
}

function normalizeKey(e: KeyboardEvent) {
  // Prefer e.key; fall back to e.code mapping like "KeyA" -> "a"
  let k = (e.key || '').toLowerCase()
  if (!k || k === 'unidentified') {
    const c = (e.code || '').toLowerCase()
    if (c.startsWith('key')) k = c.slice(3)
    else if (c.startsWith('arrow')) k = c
  }
  if (k === ' ') k = ' '
  return k
}

function Row({
  actionName,
  inputs,
  onAdd,
  onRemove,
  hasError,
}: {
  actionName: BindableActionName
  inputs: string[]
  onAdd: (actionName: BindableActionName) => void
  onRemove: (actionName: BindableActionName, input: string) => void
  hasError: boolean
}) {
  const title = actionDisplayMap[actionName].displayName
  return (
    <div className={`action-row ${hasError ? 'with-error' : ''}`}>
      <div className="action-title">
        <span className="dot" />
        <span>{title}</span>
      </div>

      <div className="action-bindings">
        {inputs.map((input, i) => (
          <Keycap
            key={`${input}-${i}`}
            removable
            label={isInputWithDisplayName(input) ? inputDisplayNameMap[input] : input.toUpperCase()}
            onClick={() => onRemove(actionName, input)}
          />
        ))}
        <button className="bind-btn" onClick={() => onAdd(actionName)} aria-label={`Add binding for ${title}`}>
          <span>Bind</span>
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function Rows({ onAdd }: { onAdd: (actionName: BindableActionName) => void }) {
  const [actionInputMap] = useStore((s) => [s.actionInputMap])
  const onRemove = useCallback((actionName: BindableActionName, input: string) => {
    setState((s) => ({
      actionInputMap: { ...s.actionInputMap, [actionName]: s.actionInputMap[actionName].filter((v) => v !== input) },
    }))
  }, [])

  const ordered = useMemo(
    () => keys(actionInputMap).sort((a, b) => actionDisplayMap[a].order - actionDisplayMap[b].order),
    [actionInputMap],
  )

  return (
    <>
      {ordered.map((actionName) => (
        <Row
          key={actionName}
          actionName={actionName}
          inputs={actionInputMap[actionName]}
          onRemove={onRemove}
          onAdd={onAdd}
          hasError={!actionInputMap[actionName].length}
        />
      ))}
    </>
  )
}

function KeyCapture({ onKeyup }: { onKeyup: (e: KeyboardEvent) => void }) {
  useEffect(() => {
    window.addEventListener('keyup', onKeyup, { passive: true })
    return () => window.removeEventListener('keyup', onKeyup)
  }, [onKeyup])

  return (
    <div className="keys-capture">
      <div className="keys-capture-inner">
        <div className="pulse" />
        <h4>Press a key</h4>
        <p>Press <strong>Esc</strong> to cancel</p>
      </div>
    </div>
  )
}

type KeysProps = HTMLAttributes<HTMLDivElement> & {
  hideHeader?: boolean
  compact?: boolean
}

export function Keys(props: KeysProps) {
  const [selectedAction, setSelectedAction] = useState<BindableActionName | null>(null)
  const [actions, binding] = useStore((s) => [s.actions, s.binding])
 const { hideHeader = false, compact = false, className, ...rest } = props

  const onAdd = useCallback(
    (action: BindableActionName) => {
      setSelectedAction(action)
      if (!binding) actions.binding()
    },
    [binding, actions],
  )

  const onKeyup = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedAction) return
      const input = normalizeKey(e)
      if (input === 'escape') {
        setSelectedAction(null)
        if (binding) actions.binding()
        return
      }
      if (!input) return

      setState((s) => {
        // prevent duplicate across ALL actions; then add to selected
        const next: ActionInputMap = keys(s.actionInputMap).reduce((o, name) => {
          const filtered = s.actionInputMap[name].filter((v) => v !== input)
          return { ...o, [name]: filtered }
        }, {} as ActionInputMap)

        const current = next[selectedAction]
        // max 4 bindings per action for sanity
        const updated = current.includes(input) ? current : (current.length >= 4 ? current.slice(1).concat(input) : current.concat(input))
        next[selectedAction] = updated
        return { actionInputMap: next }
      })
      setSelectedAction(null)
      if (binding) actions.binding()
    },
    [binding, selectedAction, actions],
  )

  return (
    <div {...rest} className={`keys-panel ${compact ? 'compact' : ''} ${className || ''}`}>
      {!hideHeader && (
        <div className="keys-header">
          <h3>Controls</h3>
          <span className="hint">Click <em>Bind</em>, then press a key</span>
        </div>
      )}
      <div className="keys-list">
        <Rows onAdd={onAdd} />
      </div>
      {selectedAction && <KeyCapture onKeyup={onKeyup} />}
    </div>
  )
}
