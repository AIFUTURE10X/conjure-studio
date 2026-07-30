"use client"

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { DoubleSide, type Group } from 'three'
import { TriangleAlert } from 'lucide-react'
import { buildLogoMeshes, disposeLogoMeshes, type LogoMeshBuild } from './buildLogoMeshes'
import {
  materialParamsFor, rotationFor,
  type SpinAxis, type SpinDepthLevel, type SpinMaterial,
} from './spin-3d-params'

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
  svg, level, bevelEnabled, material, axis, speed, background,
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
      camera={{ position: [0, 0, 2.4], fov: 45 }}
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

      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.5} />
      {/* Rim light so the extruded sides read against a dark backdrop as the logo turns away. */}
      <directionalLight position={[-4, -2, -3]} intensity={0.6} />
      <SpinningLogo build={build} material={material} axis={axis} speed={speed} />
    </Canvas>
  )
}
