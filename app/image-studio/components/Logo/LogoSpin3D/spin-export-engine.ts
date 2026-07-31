import {
  ACESFilmicToneMapping, Color, DoubleSide, Group, Mesh, MeshStandardMaterial,
  AmbientLight, DirectionalLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from 'three'
import { buildLogoMeshes, disposeLogoMeshes } from './buildLogoMeshes'
import {
  SPIN_BASE_PERIOD_SECONDS, SPIN_CAMERA_FOV, SPIN_LIGHTS, materialParamsFor, rotationForAxisTurns,
  type SpinAxis, type SpinDepthLevel, type SpinMaterial,
} from './spin-3d-params'
import {
  bitrateFor, cameraDistanceFor, exportRevolutions, fitSizeFor, frameCountFor, frameDuration, frameTimestamp,
  frameTurns, tumbleTiltTurns, type ExportFormat,
} from './spin-export-math'

/**
 * Renders the spin frame by frame and encodes it, entirely in the browser.
 *
 * Deliberately NOT a capture of the live preview. `MediaRecorder` over
 * `captureStream` timestamps by wall clock, so a slow machine produces a longer
 * clip than the user asked for and a dropped frame becomes a stutter baked into
 * the file. Here every frame is rendered offscreen at the target resolution and
 * handed to the encoder with a timestamp computed from the frame index, so the
 * output is identical regardless of machine speed or whether the tab was
 * backgrounded mid-encode.
 *
 * Its own renderer and scene, rather than borrowing the preview's: the export
 * resolution differs from the on-screen panel, and the preview should keep
 * spinning while an export runs. The two agree because they share the geometry
 * builder, the material/rotation maths and the light rig — not because they share
 * an object graph.
 */

export interface SpinExportRequest {
  svg: string
  level: SpinDepthLevel
  bevelEnabled: boolean
  material: SpinMaterial
  axis: SpinAxis
  /** Preview spin speed. Quantized to the nearest whole turn count for the clip — see exportRevolutions. */
  speed: number
  /** A CSS colour, or null for a transparent (alpha) export. */
  background: string | null
  format: ExportFormat
  durationSeconds: number
  fps: number
  width: number
  height: number
}

export interface SpinExportResult {
  blob: Blob
  frameCount: number
  durationSeconds: number
}

export class ExportCancelledError extends Error {
  constructor() {
    super('Export cancelled')
    this.name = 'ExportCancelledError'
  }
}

/** Frames between real yields. Often enough to stay responsive, rare enough not to slow the encode. */
const YIELD_EVERY_FRAMES = 4

/**
 * Hand control back to the browser between frames.
 *
 * Visible tab: `setTimeout(0)` — a macrotask boundary lets the browser repaint
 * the progress bar and dispatch a queued Cancel click, which a microtask
 * (`await Promise.resolve()`) does not.
 *
 * Hidden tab: `setTimeout` is throttled to at most once a second — and to
 * roughly once a MINUTE once the page has been hidden a few minutes — which
 * would stretch a 600-frame export's 150 yields from milliseconds to hours.
 * There is nothing to repaint while hidden, but macrotasks must still turn
 * over or the queued visibilitychange/click events could never run when the
 * user comes back; a MessageChannel post is the standard unthrottled macrotask
 * (the same trick React's scheduler uses for exactly this reason).
 */
function yieldToBrowser(): Promise<void> {
  if (typeof MessageChannel === 'undefined' || document.visibilityState === 'visible') {
    return new Promise((resolve) => { setTimeout(resolve, 0) })
  }
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      resolve()
    }
    channel.port2.postMessage(null)
  })
}

/**
 * Codec support has to be known BEFORE a long encode, not discovered at the end.
 *
 * Returns null when the probe itself failed (e.g. the muxer chunk did not load
 * over a flaky connection) — that is NOT the same answer as "this browser has
 * no encoders", and the caller should treat it as retryable rather than locking
 * the panel into "cannot encode video" for the rest of the page session.
 */
export async function probeExportSupport(): Promise<{ mp4: boolean; webm: boolean } | null> {
  try {
    const { canEncodeVideo } = await import('mediabunny')
    const [mp4, webm] = await Promise.all([
      canEncodeVideo('avc', { width: 1920, height: 1080 }).catch(() => false),
      canEncodeVideo('vp9', { width: 1920, height: 1080 }).catch(() => false),
    ])
    return { mp4, webm }
  } catch {
    return null
  }
}

interface BuiltScene {
  scene: Scene
  camera: PerspectiveCamera
  spinGroup: Group
  dispose: () => void
}

function buildScene(request: SpinExportRequest): BuiltScene | null {
  const build = buildLogoMeshes(request.svg, request.level, request.bevelEnabled)
  if (build.meshes.length === 0) return null

  const scene = new Scene()
  if (request.background !== null) scene.background = new Color(request.background)

  for (const light of SPIN_LIGHTS) {
    if (light.kind === 'ambient') {
      scene.add(new AmbientLight(0xffffff, light.intensity))
      continue
    }
    const directional = new DirectionalLight(0xffffff, light.intensity)
    const [x, y, z] = light.position ?? [0, 0, 1]
    directional.position.set(x, y, z)
    scene.add(directional)
  }

  const { roughness, metalness } = materialParamsFor(request.material)
  const materials: MeshStandardMaterial[] = []

  // Same nesting as the preview: rotate, then correct SVG's downward Y with a
  // 180° X rotation (not a negative scale, which would invert the normals), then
  // scale to unit size, then recentre.
  const spinGroup = new Group()
  const flipGroup = new Group()
  flipGroup.rotation.x = Math.PI
  flipGroup.scale.setScalar(build.scale)
  const centerGroup = new Group()
  centerGroup.position.set(-build.center.x, -build.center.y, -build.depth / 2)

  for (const mesh of build.meshes) {
    const material = new MeshStandardMaterial({
      color: new Color(mesh.color),
      roughness,
      metalness,
      side: DoubleSide,
    })
    materials.push(material)
    centerGroup.add(new Mesh(mesh.geometry, material))
  }

  flipGroup.add(centerGroup)
  spinGroup.add(flipGroup)
  scene.add(spinGroup)

  const camera = new PerspectiveCamera(SPIN_CAMERA_FOV, request.width / request.height, 0.1, 100)
  // Fit the ROTATING solid, not a flat unit square: a deep square logo sweeps a
  // 0.75 corner radius under tumble, past the old fixed budget — see fitSizeFor.
  const fitSize = fitSizeFor(
    request.axis,
    build.size.x * build.scale,
    build.size.y * build.scale,
    build.depth * build.scale,
  )
  camera.position.set(0, 0, cameraDistanceFor(request.width / request.height, SPIN_CAMERA_FOV, fitSize))
  camera.lookAt(0, 0, 0)

  return {
    scene,
    camera,
    spinGroup,
    dispose: () => {
      for (const material of materials) material.dispose()
      disposeLogoMeshes(build)
    },
  }
}

/**
 * Encode the spin.
 *
 * `onProgress` is called with 0..1. `signal` aborts between frames — mid-frame
 * cancellation would leave the encoder in an undefined state, and a frame is
 * short enough that waiting for the boundary is imperceptible.
 */
export async function exportSpinVideo(
  request: SpinExportRequest,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<SpinExportResult> {
  const {
    Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource,
  } = await import('mediabunny')

  let built: BuiltScene | null = null
  let renderer: WebGLRenderer | null = null
  let output: InstanceType<typeof Output> | null = null

  try {
    // Geometry building is synchronous and can take a while on a complex logo, so
    // give the abort a chance to land and the Cancel button a chance to paint
    // before committing to it — otherwise Cancel is on screen but inert.
    await yieldToBrowser()
    if (signal.aborted) throw new ExportCancelledError()

    built = buildScene(request)
    if (!built) throw new Error('This logo produced no 3D shapes to export.')
    if (signal.aborted) throw new ExportCancelledError()

    const canvas = document.createElement('canvas')
    canvas.width = request.width
    canvas.height = request.height

    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      // Alpha only for a transparent export; an opaque one clears to the scene background.
      alpha: request.background === null,
      // Straight alpha: this canvas is never composited into the page, and the
      // VideoFrames the encoder reads from it should carry unpremultiplied RGBA
      // so VP9's alpha channel doesn't pick up dark fringes at soft edges.
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })
    // r3f gives the preview ACES filmic tone mapping and sRGB output by default;
    // a bare WebGLRenderer defaults to NoToneMapping, which clips the highlights
    // the preview rolls off — the one renderer setting that made exports come
    // out brighter and more contrasty than the spin the user approved.
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setSize(request.width, request.height, false)
    renderer.setPixelRatio(1)
    if (request.background === null) renderer.setClearAlpha(0)

    const isWebm = request.format === 'webm'
    const target = new BufferTarget()
    output = new Output({
      format: isWebm ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target,
    })

    const source = new CanvasSource(canvas, {
      codec: isWebm ? 'vp9' : 'avc',
      bitrate: bitrateFor(request.width, request.height, request.fps),
      // VP9 emits alpha as packet side data, which WebM carries; H.264 cannot.
      alpha: isWebm && request.background === null ? 'keep' : 'discard',
      keyFrameInterval: 1,
    })
    output.addVideoTrack(source, { frameRate: request.fps })

    const frameCount = frameCountFor(request.durationSeconds, request.fps)
    const step = frameDuration(request.fps)
    // Whole turns nearest the preview's rate — exact speed cannot survive the
    // loop-closure requirement at a fixed duration; see exportRevolutions.
    const revolutions = exportRevolutions(request.durationSeconds, request.speed, SPIN_BASE_PERIOD_SECONDS)
    // Tumble tilts a second axis, which has to land on a whole turn too or the seam
    // snaps — see tumbleTiltTurns.
    const tiltTurns = tumbleTiltTurns(revolutions)

    await output.start()

    for (let index = 0; index < frameCount; index += 1) {
      if (signal.aborted) throw new ExportCancelledError()

      const spin = frameTurns(index, frameCount, revolutions)
      const tilt = frameTurns(index, frameCount, tiltTurns)
      const rotation = rotationForAxisTurns(request.axis, spin, tilt)
      built.spinGroup.rotation.set(rotation.x, rotation.y, rotation.z)
      renderer.render(built.scene, built.camera)

      // Awaited for encoder and writer backpressure.
      await source.add(frameTimestamp(index, request.fps), step)
      onProgress((index + 1) / frameCount)

      // `source.add` usually resolves as a microtask, which does NOT return control
      // to the browser — without this the whole loop runs as one synchronous burst,
      // so the progress bar never paints and a Cancel click is never processed.
      if ((index + 1) % YIELD_EVERY_FRAMES === 0) await yieldToBrowser()
    }

    await output.finalize()
    const buffer = target.buffer
    if (!buffer) throw new Error('The encoder produced no output')

    return {
      blob: new Blob([buffer], { type: isWebm ? 'video/webm' : 'video/mp4' }),
      frameCount,
      durationSeconds: frameCount * step,
    }
  } catch (error) {
    // Discard the partial file rather than leaving a truncated video behind.
    // try/catch rather than .catch(): cancelling an output that already
    // finalized (the no-buffer path above) can throw synchronously, which
    // would replace the real failure with a state error.
    try { await output?.cancel() } catch {}
    throw error
  } finally {
    built?.dispose()
    if (renderer) {
      // dispose() alone does NOT release the WebGL context — a known three.js
      // gotcha. Browsers cap live contexts (~16) and evict the OLDEST when the cap
      // is hit, which would be the panel's own preview canvas, blanking it
      // mid-export. Every export must hand its context back.
      renderer.forceContextLoss()
      renderer.dispose()
    }
  }
}
