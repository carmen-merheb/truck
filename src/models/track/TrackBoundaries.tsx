
import { useMemo } from 'react'
import { useBox } from '@react-three/cannon'
import type { Triplet } from '@react-three/cannon'

/**
 * Simple, fast "guard-rails" made from a chain of thin static boxes.
 * 
 * Each entry in `segments` is [x, z, length, yaw] and creates a
 * box of size [length, height, thickness] centered at (x, z).
 * Tweak the data to fit your track.
 */
type Segment = [x:number, z:number, len:number, yaw:number]

type Props = {
  /** y position of the boxes (should be roughly at road height) */
  y?: number
  /** box thickness in meters */
  thickness?: number
  /** box height in meters */
  height?: number
  /** geometry segments to spawn */
  segments?: Segment[]
}

export function TrackBoundaries({
  y = 0.75,
  thickness = 0.5,
  height = 2.5,
  segments = []
}: Props) {
  const halfH = height / 2

  // build one physics body per segment
  return (
    <group>
      {segments.map(([x, z, len, yaw], i) => {
        const args: Triplet = [len, height, thickness] as unknown as Triplet
        // Centered at (x, y, z), rotated around Y by yaw
        useBox(() => ({
          args,
          type: 'Static',
          userData: { barrier: true },
          position: [x, y + halfH, z],
          rotation: [0, yaw, 0],
        }), undefined, [x, y, z, len, yaw])

        return null
      })}
    </group>
  )
}

export default TrackBoundaries
