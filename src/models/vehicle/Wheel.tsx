import { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useCompoundBody } from '@react-three/cannon'

import { useStore } from '../../store'

import type { CylinderProps } from '@react-three/cannon'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { GLTF } from 'three-stdlib'

interface WheelGLTF extends GLTF {
  nodes: {
    /* Manually typed meshes names */
    Wheels_Circle007: Group
      wheels_Circle007_1: Mesh
      wheels_Circle007_2: Mesh
      wheels_Circle007_3: Mesh
  }
  materials: {
    /* Manually typed meshes names */
    'tyres.002': MeshStandardMaterial
    'wheel_hub.002': MeshStandardMaterial
      'wheels.002': MeshStandardMaterial
  }
}

interface WheelProps extends CylinderProps {
  leftSide?: boolean
}

export const Wheel = forwardRef<Group, WheelProps>(({ leftSide, ...props }, ref) => {
  const { radius } = useStore((state) => state.wheelInfo)
  const { nodes: n, materials: m } = useGLTF('/models/wheel-draco-og.glb') as WheelGLTF
    // console.log(n, m)
  const scale = radius / 0.30
  useCompoundBody(
    () => ({
      mass: 50,
      type: 'Kinematic',
      material: 'wheel',
      collisionFilterGroup: 0,
      shapes: [{ args: [radius, radius, 0.5, 16], rotation: [0, 0, -Math.PI / 2], type: 'Cylinder' }],
      ...props,
    }),
    ref,
    [radius],
  )
  return (
    <group ref={ref} >
      <group scale={scale}>
        <group scale={leftSide ? -1 : 1}>
            <mesh castShadow geometry={n.wheels_Circle007_1.geometry} material={m['tyres.002']}  ></mesh>
            <mesh castShadow geometry={n.wheels_Circle007_2.geometry} material={m['wheel_hub.002']} ></mesh>
            <mesh castShadow geometry={n.wheels_Circle007_3.geometry} material={m['wheels.002']} ></mesh>
        </group>
      </group>
    </group>
  )
})
