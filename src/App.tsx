import { useState, useCallback, useEffect } from 'react'
import { Layers } from 'three'
import { Canvas } from '@react-three/fiber'
import { Physics, Debug } from '@react-three/cannon'
import { Sky, Environment, PerspectiveCamera, OrbitControls, Stats } from '@react-three/drei'
import type { DirectionalLight } from 'three'
import type { CollideBeginEvent } from '@react-three/cannon'

import { HideMouse, Keyboard } from './controls'
import { Cameras } from './effects'
import { BoundingBox, Ramp, Track, Vehicle, Goal, Train, Heightmap } from './models'
import { angularVelocity, getState, levelLayer, position, rotation, useStore } from './store'
import type { Transform } from './store'
import { Checkpoint, Clock, Speed, Minimap, Intro, Help, Editor, LeaderBoard, Finished, PickColor } from './ui'
import { useToggle } from './useToggle'
import SmartCheckpoints from './models/SmartCheckpoints'

const layers = new Layers()
layers.enable(levelLayer)

export const CHECKPOINTS: Transform[] = [
  { position: [-81,  0.65,  207], rotationY:  0.55, index: 0 }, // START
  { position: [107,  0.65,  115], rotationY:  0.55, index: 1 }, // CP1: after ramp takeoff
  { position: [30,  0.65,   -10], rotationY:  0.20, index: 2 }, // CP2: mid straight
  { position: [65,  0.65,   71], rotationY: -0.30, index: 3 }, // CP3: approach to inner section

] 

// Finish is timing only (do NOT make a respawn)
const FINISH_POS: [number, number, number] = [-104, 1, -189]
const FINISH_RY = -1.2
export function App(): JSX.Element {
  const [light, setLight] = useState<DirectionalLight | null>(null)
  const [actions, dpr, editor, shadows, setCheckpoint] = useStore((s) => [
    s.actions,
    s.dpr,
    s.editor,
    s.shadows,
    s.setCheckpoint,
  ])
  const { onCheckpoint, onFinish, onStart } = actions

 useEffect(() => {
  const lc = getState().lastCheckpoint
  const isDefault =
    Array.isArray(lc?.position) &&
    lc.position[0] === position[0] &&
    lc.position[1] === position[1] &&
    lc.position[2] === position[2]
  if (isDefault) setCheckpoint(CHECKPOINTS[0])
}, [setCheckpoint])

const handleStart = useCallback((_: CollideBeginEvent) => {
  setCheckpoint(CHECKPOINTS[0]); onStart()
}, [onStart, setCheckpoint])

const makeCPHandler = (cp: Transform) => (_: CollideBeginEvent) => {
  setCheckpoint(cp); onCheckpoint()
}

const handleFinish = useCallback((_: CollideBeginEvent) => {
  onFinish() // keep finish out of respawn
}, [onFinish])

  const ToggledCheckpoint = useToggle(Checkpoint, 'checkpoint')
  const ToggledDebug = useToggle(Debug, 'debug')
  const ToggledEditor = useToggle(Editor, 'editor')
  const ToggledFinished = useToggle(Finished, 'finished')
  const ToggledMap = useToggle(Minimap, 'map')
  const ToggledOrbitControls = useToggle(OrbitControls, 'editor')
  const ToggledStats = useToggle(Stats, 'stats')

  return (
    <Intro>
      <Canvas key={`${dpr}${shadows}`} dpr={[1, dpr]} shadows={shadows} camera={{ position: [0, 5, 15], fov: 50 }}>
        <fog attach="fog" args={['white', 0, 500]} />
        <Sky sunPosition={[100, 10, 100]} distance={1000} />
        <ambientLight layers={layers} intensity={0.1} />
        <directionalLight
          ref={setLight}
          layers={layers}
          position={[0, 50, 150]}
          intensity={1}
          shadow-bias={-0.001}
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          castShadow
        />
        <PerspectiveCamera makeDefault={editor} fov={75} position={[0, 20, 20]} />

        <Physics
          allowSleep
          broadphase="SAP"
          defaultContactMaterial={{
            friction: 0.2,
            restitution: 0,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 2,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 2,
          }}
        >
          <ToggledDebug scale={1.0001} color="white">
            <Vehicle angularVelocity={[...angularVelocity]} position={[...position]} rotation={[...rotation]}>
              {light && <primitive object={light.target} />}
              <Cameras />
            </Vehicle>

            <Train />
            <Ramp args={[30, 6, 8]} position={[2, -1, 168.55]} rotation={[0, 0.49, Math.PI / 15]} />
            <Heightmap elementSize={0.5085} position={[327 - 66.5, -3.3, -473 + 213]} rotation={[-Math.PI / 2, 0, -Math.PI]} />
{/* <SmartCheckpoints
  checkpoints={CHECKPOINTS}
  finish={{ position: FINISH_POS, rotationY: FINISH_RY }}
  lateralHalfWidth={14}   // widen window if needed
/> */}

 {/* START (fat sensor so it can’t be missed) */}
<Goal args={[8, 8, 14]} onCollideBegin={handleStart}
      rotation={[0, CHECKPOINTS[0].rotationY, 0]}
      position={[-23.60, 0.65, 180.36]} />

{/* ALL MID CHECKPOINTS */}
{CHECKPOINTS.slice(1).map((cp, i) => (
  <Goal key={`cp-${i+1}`} args={[8, 8, 14]} onCollideBegin={makeCPHandler(cp)}
        rotation={[0, cp.rotationY, 0]} position={cp.position} />
))}

{/* FINISH — timing only */}
<Goal args={[8, 6, 10]} onCollideBegin={handleFinish}
      rotation={[0, FINISH_RY, 0]} position={FINISH_POS} />

            <BoundingBox {...{ depth: 512, height: 100, position: [0, 40, 0], width: 512 }} />
          </ToggledDebug>
        </Physics>

        <Track />
        <Environment files="textures/dikhololo_night_1k.hdr" />
        <ToggledMap />
        <ToggledOrbitControls />
      </Canvas>

      <Clock />
      <ToggledEditor />
      <ToggledFinished />
      <Help />
      <Speed />
      <ToggledStats />
      <ToggledCheckpoint />
      <LeaderBoard />
      <PickColor />
      <HideMouse />
      <Keyboard />
    </Intro>
  )
}
