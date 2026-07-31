"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { DoubleSide, type Group } from 'three'
import { TriangleAlert } from 'lucide-react'
import { buildLogoMeshes, disposeLogoMeshes, type LogoMeshBuild } from './buildLogoMeshes'
import {
  SPIN_CAMERA_FOV, SPIN_LIGHTS, materialParamsFor, rotationFor,
  type SpinAxis, type SpinDepthLevel, type SpinMaterial,
} from './spin-3d-params'
import { cameraDistanceFor, fitSizeFor } from './spin-export-math'

/**
 * Pulls the camera back far enough to fit the logo at the current aspect ratio.
 *
 * Shared with the export, which renders at a different aspect (16:9 or square) to
 * this panel's — so without deriving distance from aspect, an export would frame
 * the logo differently from the preview it was approved in. `fitSize` is the
 * rotation-swept extent of the actual solid (see fitSizeFor), so a deep logo
 * tumbling on two axes keeps its corners in frame.
 *
 * Layout effect, not effect: an effect runs after the first r3f commit, which
 * painted one frame at the Canvas default z=5 before snapping to the fitted
 * distance.
 */
function FitCamera({ fitSize }: { fitSize: number }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    // fov itself is set by the Canvas `camera` prop; only the distance depends on
    // the live aspect and the solid's swept extent, so only that is adjusted here.
    camera.position.set(0, 0, cameraDistanceFor(aspect, SPIN_CAMERA_FOV, fitSize))
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height, fitSize])

  return null
}

/**
 * The WebGL half of the 3D spin, loaded on demand.
 *
 * Everything that pulls in three lives in this module (and buildLogoMeshes), so
 * the modal can `next/dynamic` it and the image-studio bundle stays unchanged
 * for users who never open the panel (AC-8).
 *
 * The "no drawable paths" state renders as ordinary DOM here rather than inside
 * the Canvas — an error thrown in the r3f tree would take the whole renderer down
 * instead of showing the user a sentence (AC-9).
 */

export interface LogoSpinSceneProps {
  svg: string
  level: SpinDepthLevel
  bevelEnabled: boolean
  material: SpinMaterial
  axis: SpinAxis
  speed: number
  /** A CSS colour, or null for a transparent canvas. */
  background: string | null
  /** Reports how many meshes the SVG actually produced, so the parent can gate Export instead of failing at click time. */
  onMeshesChange?: (count: number) => void
}

interface SpinningLogoProps {
  build: LogoMeshBuild
  material: SpinMaterial
  axis: SpinAxis
  speed: number
}

function SpinningLogo({ build, material, axis, speed }: SpinningLogoProps) {
  const groupRef = useRef<Group>(null)
  const { roughness, metalness } = materialParamsFor(material)

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    // Derived from elapsed time, not accumulated deltas, so the spin runs at the
    // same rate regardless of frame rate or a dropped frame.
    const rotation = rotationFor(axis, state.clock.elapsedTime, speed)
    group.rotation.set(rotation.x, rotation.y, rotation.z)
  })

  return (
    <group ref={groupRef}>
      {/*
        SVG's Y axis grows downward, so the logo arrives upside down. A 180°
        rotation about X corrects it; a negative Y scale would too, but that
        inverts the winding order and the lighting goes wrong with it. X is
        preserved either way, so nothing is mirrored.
      */}
      <group rotation={[Math.PI, 0, 0]} scale={build.scale}>
        <group position={[-build.center.x, -build.center.y, -build.depth / 2]}>
          {build.meshes.map((mesh, index) => (
            <mesh key={index} geometry={mesh.geometry}>
              <meshStandardMaterial
                color={mesh.color}
                roughness={roughness}
                metalness={metalness}
                side={DoubleSide}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

export default function LogoSpinScene({
  svg, level, bevelEnabled, material, axis, speed, background, onMeshesChange,
}: LogoSpinSceneProps) {
  const build = useMemo(() => buildLogoMeshes(svg, level, bevelEnabled), [svg, level, bevelEnabled])

  // Geometry is rebuilt whenever depth or bevel changes; the superseded buffers
  // have to be released or a few minutes of slider-dragging leaks the GPU.
  const previousBuild = useRef<LogoMeshBuild | null>(null)
  useEffect(() => {
    if (previousBuild.current && previousBuild.current !== build) {
      disposeLogoMeshes(previousBuild.current)
    }
    previousBuild.current = build
  }, [build])
  useEffect(() => () => { disposeLogoMeshes(previousBuild.current) }, [])

  useEffect(() => {
    onMeshesChange?.(build.meshes.length)
  }, [build, onMeshesChange])

  const fitSize = useMemo(() => fitSizeFor(
    axis,
    build.size.x * build.scale,
    build.size.y * build.scale,
    build.depth * build.scale,
  ), [axis, build])

  if (build.meshes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <TriangleAlert className="h-8 w-8 text-red-400" />
        <p className="text-sm text-zinc-300">No 3D shapes could be built from this logo</p>
        <p className="text-xs text-zinc-500">
          Vectorizing produced no solid paths. Logos with flat colours and clear edges convert best.
        </p>
      </div>
    )
  }

  return (
    <Canvas
      camera={{ fov: SPIN_CAMERA_FOV }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: background === null }}
    >
      {/*
        The colour has to be the SCENE's background, not CSS on the element.
        r3f spreads its `style` prop onto the wrapper <div> and gives the <canvas>
        only `display: block`, so with an opaque context (alpha false, which is
        what picking a solid colour selects) three clears to its default black
        every frame and paints straight over any CSS background behind it. That
        rendered every swatch as a black rectangle; only Dark looked right, and
        only because it is nearly black already.
      */}
      {background !== null && <color attach="background" args={[background]} />}

      <FitCamera fitSize={fitSize} />

      {/* Same rig data the export builds imperatively, so the two cannot drift. */}
      {SPIN_LIGHTS.map((light, index) => (
        light.kind === 'ambient'
          ? <ambientLight key={index} intensity={light.intensity} />
          : <directionalLight key={index} intensity={light.intensity} position={light.position ?? [0, 0, 1]} />
      ))}

      <SpinningLogo build={build} material={material} axis={axis} speed={speed} />
    </Canvas>
  )
}
