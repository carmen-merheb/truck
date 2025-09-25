import { button, folder, useControls } from 'leva'
import { useStore } from '../store'
import {
  booleans,
  dpr as DPR_DEFAULT,
  vehicleConfig as VEH_DEFAULT,
  wheelInfo as WHEEL_DEFAULT,
} from '../store'

/** Leva-shaped defaults (nested to match folders). */
const LEVA_DEFAULTS = {
  Performance: {
    dpr: DPR_DEFAULT,
    shadows: booleans.shadows,
  },
  Vehicle: {
    // from vehicleConfig
    width: VEH_DEFAULT.width,
    height: VEH_DEFAULT.height,
    front: VEH_DEFAULT.front,
    back: VEH_DEFAULT.back,
    steer: VEH_DEFAULT.steer,
    force: VEH_DEFAULT.force,
    maxBrake: VEH_DEFAULT.maxBrake,
    maxSpeed: VEH_DEFAULT.maxSpeed,
    // from wheelInfo (we keep radius here for convenience)
    radius: WHEEL_DEFAULT.radius,
  },
  Suspension: {
    suspensionStiffness: WHEEL_DEFAULT.suspensionStiffness,
    suspensionRestLength: WHEEL_DEFAULT.suspensionRestLength,
    dampingCompression: WHEEL_DEFAULT.dampingCompression,
    dampingRelaxation: WHEEL_DEFAULT.dampingRelaxation,
    frictionSlip: WHEEL_DEFAULT.frictionSlip,
    sideAcceleration: WHEEL_DEFAULT.sideAcceleration,
    useCustomSlidingRotationalSpeed: WHEEL_DEFAULT.useCustomSlidingRotationalSpeed,
    customSlidingRotationalSpeed: WHEEL_DEFAULT.customSlidingRotationalSpeed,
  },
  Debug: {
    debug: booleans.debug,
    stats: booleans.stats,
  },
} as const

export function Editor(): null {
  const [get, set] = useStore((s) => [s.get, s.set])

  // Build the Leva schema. We also capture the setter to programmatically update the panel.
  const [, setLevaValues] = useControls(() => ({
    Performance: folder({
      dpr: {
        value: get().dpr,
        min: 1,
        max: 2,
        step: 0.5,
        onChange: (val: number) => set({ dpr: val }),
      },
      shadows: {
        value: get().shadows,
        onChange: (val: boolean) => set({ shadows: val }),
      },
    }),

    Vehicle: folder(
      {
        // Wheel radius (kept with vehicle for convenience)
        radius: {
          value: get().wheelInfo.radius,
          min: 0.25,
          max: 1.2,
          step: 0.01,
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, radius: value } }),
        },
        width: {
          value: get().vehicleConfig.width,
          min: 1.2,
          max: 4.0,
          step: 0.01,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, width: value } }),
        },
        height: {
          value: get().vehicleConfig.height,
          min: -1.0,
          max: 1.0,
          step: 0.01,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, height: value } }),
        },
        front: {
          value: get().vehicleConfig.front,
          min: -3.0,
          max: 4.0,
          step: 0.05,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, front: value } }),
        },
        back: {
          value: get().vehicleConfig.back,
          min: -4.0,
          max: 3.0,
          step: 0.05,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, back: value } }),
        },
        steer: {
          value: get().vehicleConfig.steer,
          min: 0.1,
          max: 0.8,
          step: 0.01,
          label: 'Max Steer Angle',
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, steer: value } }),
        },
        force: {
          value: get().vehicleConfig.force,
          min: 500,
          max: 4000,
          step: 10,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, force: value } }),
        },
        maxBrake: {
          value: get().vehicleConfig.maxBrake,
          min: 5,
          max: 200,
          step: 1,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, maxBrake: value } }),
        },
        maxSpeed: {
          value: get().vehicleConfig.maxSpeed,
          min: 40,
          max: 180,
          step: 1,
          onChange: (value: number) => set({ vehicleConfig: { ...get().vehicleConfig, maxSpeed: value } }),
        },
      },
      { collapsed: true },
    ),

    Suspension: folder(
      {
        suspensionStiffness: {
          value: get().wheelInfo.suspensionStiffness,
          min: 10,
          max: 120,
          step: 1,
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, suspensionStiffness: value } }),
        },
        suspensionRestLength: {
          value: get().wheelInfo.suspensionRestLength,
          min: 0.1,
          max: 0.6,
          step: 0.005,
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, suspensionRestLength: value } }),
        },
        dampingCompression: {
          value: get().wheelInfo.dampingCompression,
          min: 1,
          max: 15,
          step: 0.1,
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, dampingCompression: value } }),
        },
        dampingRelaxation: {
          value: get().wheelInfo.dampingRelaxation,
          min: 1,
          max: 20,
          step: 0.1,
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, dampingRelaxation: value } }),
        },
        frictionSlip: {
          value: get().wheelInfo.frictionSlip,
          min: 0.5,
          max: 4.0,
          step: 0.05,
          label: 'Tyre Grip',
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, frictionSlip: value } }),
        },
        sideAcceleration: {
          value: get().wheelInfo.sideAcceleration,
          min: 1.5,
          max: 6.0,
          step: 0.1,
          label: 'Lateral Authority',
          onChange: (value: number) => set({ wheelInfo: { ...get().wheelInfo, sideAcceleration: value } }),
        },
        useCustomSlidingRotationalSpeed: {
          value: get().wheelInfo.useCustomSlidingRotationalSpeed,
          label: 'Custom Slide Rot Speed',
          onChange: (value: boolean) =>
            set({ wheelInfo: { ...get().wheelInfo, useCustomSlidingRotationalSpeed: value } }),
        },
        customSlidingRotationalSpeed: {
          value: get().wheelInfo.customSlidingRotationalSpeed,
          min: -5,
          max: 5,
          step: 0.01,
          onChange: (value: number) =>
            set({ wheelInfo: { ...get().wheelInfo, customSlidingRotationalSpeed: value } }),
        },
      },
      { collapsed: true },
    ),

    Debug: folder(
      {
        debug: {
          value: get().debug,
          onChange: (val: boolean) => set({ debug: val }),
        },
        stats: {
          value: get().stats,
          onChange: (val: boolean) => set({ stats: val }),
        },
      },
      { collapsed: true },
    ),

    Presets: folder(
      {
        'Asphalt Grip': button(() => {
          const nextWheel = {
            ...get().wheelInfo,
            frictionSlip: 3.2,
            sideAcceleration: 5.0,
            dampingCompression: 9.0,
            dampingRelaxation: 12.0,
            suspensionStiffness: 80,
          }
          set({ wheelInfo: nextWheel })
          setLevaValues({
            ...LEVA_DEFAULTS,
            Suspension: {
              ...LEVA_DEFAULTS.Suspension,
              frictionSlip: 3.2,
              sideAcceleration: 5.0,
              dampingCompression: 9.0,
              dampingRelaxation: 12.0,
              suspensionStiffness: 80,
            },
          } as any)
        }),

        'Loose Dirt': button(() => {
          const nextWheel = {
            ...get().wheelInfo,
            frictionSlip: 1.4,
            sideAcceleration: 2.6,
            dampingCompression: 6.0,
            dampingRelaxation: 8.0,
            suspensionStiffness: 55,
          }
          set({ wheelInfo: nextWheel })
          setLevaValues({
            ...LEVA_DEFAULTS,
            Suspension: {
              ...LEVA_DEFAULTS.Suspension,
              frictionSlip: 1.4,
              sideAcceleration: 2.6,
              dampingCompression: 6.0,
              dampingRelaxation: 8.0,
              suspensionStiffness: 55,
            },
          } as any)
        }),
      },
      { collapsed: true },
    ),

    reset: button(() => {
      // 1) Reset the store
      set({
        dpr: DPR_DEFAULT,
        shadows: booleans.shadows,
        debug: booleans.debug,
        stats: booleans.stats,
        vehicleConfig: { ...VEH_DEFAULT },
        wheelInfo: { ...WHEEL_DEFAULT },
      })
      // 2) Reset the Leva panel (nested shape to match folders)
      setLevaValues(LEVA_DEFAULTS as any)
    }),
  }))

  return null
}
