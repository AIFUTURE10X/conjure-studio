/**
 * Guide tab content — the in-app manual. Pure data; rendered by
 * components/Guide. Each article has a summary (paragraphs/steps/tips/
 * settings) plus an optional `more` array of deep-dive blocks revealed by
 * the "Show the in-depth guide" expander. Keep in sync with real behavior.
 */

export interface GuideSettingRow {
  name: string
  values: string
  description: string
}

export interface GuideDetailBlock {
  heading?: string
  paragraphs?: string[]
  steps?: string[]
  tips?: string[]
  settings?: GuideSettingRow[]
}

export interface GuideArticle {
  title: string
  paragraphs?: string[]
  steps?: string[]
  tips?: string[]
  settings?: GuideSettingRow[]
  /** Expandable deep dive shown behind "Show the in-depth guide". */
  more?: GuideDetailBlock[]
}

export interface GuideSection {
  id: string
  emoji: string
  title: string
  tagline: string
  articles: GuideArticle[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'quick-start',
    emoji: '🚀',
    title: 'Quick Start',
    tagline: 'From idea to finished video in one flow',
    articles: [
      {
        title: 'The 60-second image → video flow',
        steps: [
          'Open the Image tab, type a prompt (or tap a Quick Recipe in the settings rail) and press Generate.',
          'On the image you like, press the gold "Animate" button — it becomes the video Start frame and you land in the Video tab.',
          'The AI automatically writes a motion prompt from your image (you can edit it, tap camera-move chips, or press "Suggest motion" to re-roll).',
          'Optional: press "End Frame" on a second image, upload one, or use "Generate from start frame" to AI-create a matching closing frame.',
          'Pick a model (draft on Seedance Fast, final on Seedance 2.0 / Kling / Veo), set duration and resolution, press Generate Video.',
          'The clip appears in the Videos list in ~1–5 minutes. From there: Extend it, Lip Sync it, Enhance it, or heart it.',
        ],
        tips: [
          'Draft cheap, finish expensive: iterate motion ideas on Seedance Fast, then re-run the winner on a FINAL-tier model.',
          'Generation keeps running if you switch tabs or refresh — jobs resume automatically.',
        ],
        more: [
          {
            heading: 'Worked example: a product ad clip, start to finish',
            steps: [
              'Image tab → tap the "Product on White" Quick Recipe → replace "your subject" with "a matte-black wireless earbud case" → set Images to 4 → Generate.',
              'Four options land in the grid. Press "More Like This" on the closest one if none is perfect.',
              'Press "Animate" on the winner. You arrive in the Video tab with the image locked in as the Start frame, and within a few seconds the motion prompt box fills itself with something like "slow push-in as soft studio light sweeps across the case".',
              'Tap the "Orbit" camera chip to swap the move, or leave it. Keep Seedance Fast, 5s, 1080p for the draft (15 credits) and press Generate Video.',
              'Happy with the motion? Switch the model to Seedance 2.0 or Veo 3.1, turn Audio on if you want ambient sound, and generate the final. Then press Enhance → 4K on the finished clip if you need delivery resolution.',
            ],
          },
          {
            heading: 'What "draft then final" saves you',
            paragraphs: [
              'A 5-second draft on Seedance Fast costs 15 credits. The same 5 seconds on Veo 3.1 with audio costs 100. Testing three motion ideas as drafts then finishing one on Veo costs 145 credits; testing all three directly on Veo costs 300. The draft model exists exactly for this.',
            ],
          },
        ],
      },
      {
        title: 'Where everything lives',
        paragraphs: [
          'Top bar: mode tabs (Image, Video, Logo, Thumbnail, Translate, Mockups, BG Remover, Analytics, Guide) plus History, Favorites, and Collections.',
          'Left panel: the AI Helper chat — an image/logo assistant in those modes, and a video director in Video mode.',
          'Center: the canvas for the current mode. Bottom (Image/Logo): the prompt dock with Generate.',
          'Right rail (Image mode): all generation settings, Quick Recipes, and Presets.',
        ],
        more: [
          {
            heading: 'Panel behavior worth knowing',
            paragraphs: [
              'The three desktop panels (helper / canvas / settings) are resizable — drag the handles between them. The helper panel can collapse entirely; the settings rail collapses from its header button and remembers your choice.',
              'Mode state survives switching: pending video jobs keep polling from any tab, your image grid stays put, and Story Mode plans persist until you clear them. Only a full page close resets unsaved working state — history, favorites, collections, prompts, and presets are already saved server-side.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'image',
    emoji: '🖼️',
    title: 'Image Generator',
    tagline: 'Prompts, settings, recipes, and per-image actions',
    articles: [
      {
        title: 'Generating images',
        paragraphs: [
          'Type your prompt in the dock at the bottom and press Generate. The Images row (1 / 2 / 4 / 6 / 10) sets how many you get — bigger batches run as parallel requests and land in the grid progressively.',
          'The "Negative" button opens a second box for things to avoid. "Save to…" auto-files new images into a collection. "Library" opens your saved prompts. "Improve with AI" hands your idea to the helper for a polished rewrite.',
        ],
        settings: [
          { name: 'AI Model', values: 'ChatGPT Images 2.0', description: 'The primary image model. 4 credits per image at any size.' },
          { name: 'Image Size', values: '1K / 2K / 4K', description: 'Output resolution tier.' },
          { name: 'Aspect Ratio', values: '1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9…', description: 'Canvas shape. 9:16 for reels/shorts, 16:9 for YouTube.' },
          { name: 'Style Preset', values: 'Realistic, PhotoReal, Pixar, Anime, Watercolor, 3D Render, Comic Book, Studio Ghibli + more', description: 'The overall look. Thumbnails preview each style.' },
          { name: 'Style Strength', values: 'subtle / moderate / strong', description: 'How hard the style preset is pushed.' },
          { name: 'Camera Angle', values: 'Eye-level, Low-angle, High-angle, Aerial, Dutch, POV…', description: 'Framing direction added to the prompt.' },
          { name: 'Camera Lens', values: '14mm ultra-wide → 200mm telephoto, Macro', description: 'Lens character (depth, compression, distortion).' },
          { name: 'Creative Direction', values: 'popover groups', description: 'Mood, lighting, palette, decorative elements — stackable art direction.' },
          { name: 'Seed', values: 'number / random', description: 'Fix the seed to reproduce a composition across runs.' },
          { name: 'Reference Image', values: 'upload', description: 'Guide generation with an image (replicate or inspire modes).' },
          { name: 'Background Removal', values: 'fal · BiRefNet (default) / PhotoRoom / Off', description: 'Which engine the "Remove BG" action uses on results.' },
        ],
        more: [
          {
            heading: 'Anatomy of a prompt that works',
            paragraphs: [
              'Structure beats length: SUBJECT (who/what, with 2–3 concrete details) + SETTING (where, time of day) + LIGHT (the single biggest quality lever) + STYLE words. The rail settings append the style/camera phrasing for you, so the prompt box only needs the scene.',
              'Weak: "a nice coffee shop". Strong: "a sunlit corner coffee shop with worn leather armchairs, steam rising from a ceramic cup on a marble table, late-afternoon golden light through tall windows".',
            ],
            tips: [
              'Negative prompt is for recurring problems, not wishes — "blurry, extra fingers, watermark, text artifacts" earns its place; "bad quality" does nothing.',
              'One change at a time when iterating. Change the lighting OR the angle, regenerate, compare.',
            ],
          },
          {
            heading: 'How batching actually runs',
            paragraphs: [
              'Counts above 4 split into balanced parallel requests (10 → 4+3+3) and each chunk lands in the grid the moment it finishes — you can start judging the first four while the rest render. If one chunk fails, the others still deliver and the error tells you how many were affected.',
            ],
          },
          {
            heading: 'Seed workflows',
            steps: [
              'Generate until you find a composition you love.',
              'Press "Restore" on that card — it loads the exact settings including the seed.',
              'Now change ONE thing (palette word, camera angle, style strength) and regenerate: same bones, new variation.',
              'Clear the seed back to random when you want fresh compositions again.',
            ],
          },
        ],
      },
      {
        title: 'Quick Recipes (one-tap looks)',
        paragraphs: [
          'The Quick Recipes section at the top of the settings rail holds 10 templates. Tapping one wraps your current prompt as the subject inside a proven scaffold AND sets the matching style, ratio, camera, and negative-prompt settings. If your prompt box is empty, the template inserts "your subject" for you to replace.',
        ],
        more: [
          {
            heading: 'Every recipe and what it sets',
            settings: [
              { name: '📦 Product on White', values: '1:1 · Realistic · strong', description: 'Seamless white sweep, studio softbox light, subtle shadow. Blocks clutter/color-cast in the negative. E-commerce hero shots.' },
              { name: '📱 UGC Phone Photo', values: '9:16 · Realistic · moderate', description: 'Deliberately imperfect phone-camera look for social ads. Blocks "studio/staged/polished" so it reads authentic.' },
              { name: '🎬 Cinematic Still', values: '16:9 · PhotoReal · strong · 85mm portrait', description: 'Anamorphic movie-frame look, teal-orange grade, shallow depth.' },
              { name: '📸 Vintage Polaroid', values: '1:1 · Realistic · strong', description: 'Faded instant-film colors, light leaks, white border, 1970s nostalgia.' },
              { name: '💡 Studio Portrait', values: '3:4 · Realistic · strong · 85mm portrait', description: 'Rembrandt lighting on a dark backdrop, eyes tack-sharp.' },
              { name: '🧊 Isometric 3D', values: '1:1 · 3D Render · strong', description: 'Soft rounded 3D forms, pastel palette — app-icon energy.' },
              { name: '🎨 Flat Illustration', values: '4:3 · Cartoon Style · strong', description: 'Bold vector shapes, limited palette. Blocks photorealism/3D/texture.' },
              { name: '🌃 Neon Cyberpunk', values: '16:9 · PhotoReal · strong', description: 'Rain-slick streets, magenta/cyan signage, atmospheric haze.' },
              { name: '🖌️ Watercolor', values: '4:3 · Watercolor · strong', description: 'Translucent washes, paper texture, color bleeding. Blocks photo look.' },
              { name: '🍽️ Food Photography', values: '4:3 · Realistic · strong · high-angle', description: 'Overhead editorial styling, window light, styled props.' },
            ],
          },
          {
            heading: 'Recipe tactics',
            tips: [
              'Type your subject FIRST, then tap the recipe — it wraps what is in the box. Tapping on an empty box inserts "your subject" as a placeholder to replace.',
              'Recipes are starting points, not cages: after applying, edit any phrase in the prompt or flip any setting the recipe chose.',
              'Applying a second recipe replaces the scaffold rather than nesting them.',
            ],
          },
        ],
      },
      {
        title: 'Buttons on every generated image',
        paragraphs: [
          'Heart — save to Favorites. Download — save the PNG. Restore — load the exact settings that made this image back into the rail.',
          'Remove BG — cut the background with your selected engine. Upscale — enlarge to 4K. Edit / Edit in Chat — AI-edit with instructions or a conversation. Annotate — draw boxes and notes on the image to direct the next edit.',
          'More Like This — generates a sibling variation. Animate — makes this image the video Start frame. End Frame — makes it the closing frame the video moves toward.',
        ],
        more: [
          {
            heading: 'The three ways to edit, and when to use each',
            settings: [
              { name: 'Edit', values: 'one instruction', description: 'Single-shot AI edit: "make the background sunset orange". Fastest for one clear change. 2 credits.' },
              { name: 'Edit in Chat', values: 'conversation', description: 'The helper panel becomes an edit session on this image — iterate with follow-ups ("a bit less", "now the left side") and keep or discard each result.' },
              { name: 'Annotate', values: 'draw on the image', description: 'Draw boxes, arrows, and text labels directly on the image; the next generation treats your marks as instructions — box an area and write "remove this", arrow to where something should move.' },
            ],
          },
          {
            heading: 'More Like This — what it actually does',
            paragraphs: [
              'It re-runs generation using this image as an "inspire" reference with its original prompt, instructed to keep the subject, style, palette, and composition language while varying details, pose, or arrangement. The result appends to the grid and saves to history. Use it when an image is 80% right — it explores near the winner instead of rolling fresh dice.',
            ],
          },
          {
            heading: 'Remove BG and Upscale, precisely',
            paragraphs: [
              'Remove BG sends the image to the engine chosen in the rail: fal · BiRefNet (default — best edges on hair/fur, pay-per-use) or PhotoRoom. The cutout replaces the image in the grid; download gives you a transparent PNG. 1 credit.',
              'Upscale enlarges to 4K and swaps the result into the same grid slot — do it after you have picked the final image, not on every candidate. 2 credits.',
            ],
          },
        ],
      },
      {
        title: 'Image references (uploads)',
        paragraphs: [
          'The upload section takes Subject images (people, products, objects to include), a Scene/Background image, and a Style reference. Each is auto-analyzed and the findings feed your prompt — the style analysis can even auto-select a matching style preset and camera settings.',
        ],
        more: [
          {
            heading: 'The three slots do different jobs',
            settings: [
              { name: 'Subjects', values: 'up to several images', description: 'WHO/WHAT must appear: your product, a person, a mascot. Analysis extracts identifying details so the generation includes them.' },
              { name: 'Scene / Background', values: 'one image', description: 'WHERE it happens. Analysis reads the environment, and can auto-set aspect ratio, camera angle, and lens to match.' },
              { name: 'Style Reference', values: 'one image', description: 'HOW it should look — palette, finish, mood. Analysis can auto-select the closest style preset.' },
            ],
          },
          {
            heading: 'Replicate vs Inspire (the rail reference)',
            paragraphs: [
              'The rail’s single Reference Image slot has two modes: "replicate" hews closely to the reference (layout, framing — good for making the SAME thing again with one change), "inspire" borrows the vibe while letting composition drift (good for "in the style of this").',
              'Fast vs Quality analysis mode (rail toggle) trades analysis depth for speed — Quality reads references more carefully before generating.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'video',
    emoji: '🎬',
    title: 'Video Generator',
    tagline: 'Models, frames, motion prompts, and post-production',
    articles: [
      {
        title: 'The four models',
        settings: [
          { name: 'Seedance Fast (DRAFT)', values: '5–12s · up to 1080p · no audio · no end frame', description: 'Cheap and quick — perfect for testing motion ideas. 3 credits/second.' },
          { name: 'Seedance 2.0 (FINAL)', values: '5–15s · up to 4K · audio · end frames', description: 'Top quality with native audio. 6–8 credits/second.' },
          { name: 'Kling 3.0 Pro (FINAL)', values: '5–15s · 1080p · audio · end frames', description: 'Cinematic motion quality. 8–10 credits/second.' },
          { name: 'Veo 3.1 (FINAL)', values: '4/6/8s · up to 4K · audio · end frames', description: 'Best realism and synced dialogue. Native Extend (+7s per pass). 12–20 credits/second.' },
        ],
        tips: [
          'The credit readout under the settings updates live as you change duration, resolution, and audio. 4K doubles the cost.',
          'Controls a model can’t use gray themselves out automatically.',
        ],
        more: [
          {
            heading: 'Which model for which job',
            settings: [
              { name: 'Testing a motion idea', values: 'Seedance Fast', description: 'A 5s draft is 15 credits — iterate freely, then re-run the keeper on a final model.' },
              { name: 'Product / brand clips', values: 'Seedance 2.0', description: 'Best quality-per-credit at the final tier; 4K available; end frames for controlled reveals.' },
              { name: 'Cinematic mood, dramatic motion', values: 'Kling 3.0 Pro', description: 'Strong camera language and physicality. Resolution is model-managed at 1080p.' },
              { name: 'People talking, realism, sound design', values: 'Veo 3.1', description: 'Synced dialogue and native audio; also the only model that extends the SAME file (+7s per pass, to ~2 minutes).' },
              { name: 'Longest single clip', values: 'Seedance 2.0 / Kling (15s)', description: 'The longest one-pass durations. Beyond that, use Extend to chain.' },
            ],
          },
          {
            heading: 'Cost math, worked out',
            paragraphs: [
              'Cost = credits/second × seconds, doubled at 4K. A 5s clip: Seedance Fast 15 · Seedance 2.0 30 (40 with audio) · Kling 40 (50 with audio) · Veo 60 (100 with audio). The same Veo clip at 4K with audio: 200. The live readout under the settings always shows the exact number before you press Generate.',
            ],
          },
        ],
      },
      {
        title: 'Start & end frames — three ways to set them',
        steps: [
          'From generated images: press "Animate" (start) or "End Frame" (end) on any image card.',
          'Upload directly: click Upload in either frame slot, or drag & drop an image onto it (10MB max).',
          'AI-generate the ending: with only a start frame set, the empty end slot offers "Generate from start frame" — describe how the scene should end and it creates a matching closing frame.',
        ],
        paragraphs: [
          'With both frames set, the video morphs from one to the other. End frames work on Seedance 2.0, Kling 3.0 Pro, and Veo 3.1 (not Seedance Fast). Leave both slots empty for pure text-to-video.',
        ],
        more: [
          {
            heading: 'What makes a good start/end pair',
            paragraphs: [
              'The model interpolates between the two frames, so pairs that share a scene but differ in ONE clear dimension work best: same room lights-off → lights-on, product closed → open, logo scattered → assembled, character looking down → looking at camera. Pairs that change everything at once (different scene, subject, AND style) produce mushy morphs.',
              '"Generate from start frame" exists exactly for this: it generates the end frame FROM your start frame as a reference, so scene, framing, and style stay locked while your described change happens. Good end-prompts describe the final state: "same scene, the logo fully assembled and glowing", "same portrait, now smiling with eyes open".',
            ],
          },
          {
            heading: 'Slot mechanics',
            tips: [
              'Removing the start frame while an end frame is set: the end frame is ignored at submit (end frames require a start).',
              'Uploaded files are converted and uploaded to secure storage at submit time; anything over 10MB is rejected with a message.',
              'Pressing Animate on an image that was the end frame clears it from the end slot — one image can’t be both.',
            ],
          },
        ],
      },
      {
        title: 'Writing the motion prompt',
        paragraphs: [
          'With a start frame set, describe MOTION only — the model already sees the scene. Without frames, describe the scene AND the motion.',
          'Automation on tap: pressing Animate auto-writes a motion prompt from your image (only if the box is empty — it never overwrites your typing). "Suggest motion from start frame" re-rolls it on demand.',
          'Camera move chips toggle professional phrasing in and out of your prompt. "Improve with AI" opens the video director chat.',
        ],
        more: [
          {
            heading: 'The motion formula + examples by genre',
            paragraphs: [
              'Formula: ONE camera move + ONE subject/environment action, under ~45 words. Two moves fight each other; a paragraph of adjectives dilutes the motion.',
            ],
            settings: [
              { name: 'Product', values: 'orbit / push-in', description: '"camera orbits smoothly around the earbud case as studio light sweeps across its surface"' },
              { name: 'Portrait', values: 'push-in / static', description: '"slow push-in as she turns toward the window, hair moving in a light breeze"' },
              { name: 'Landscape', values: 'crane / FPV', description: '"camera cranes upward over the valley as clouds drift and their shadows slide across the hills"' },
              { name: 'Logo sting', values: 'push-in / crash zoom', description: '"the scattered particles swirl inward and assemble into the glowing logo as the camera pushes in"' },
              { name: 'Food', values: 'overhead push / tracking', description: '"slow overhead push-in as steam rises and a hand drizzles sauce across the plate"' },
            ],
          },
          {
            heading: 'The twelve camera chips',
            paragraphs: [
              'Push In · Pull Back · Orbit · Crane Up · Crane Down · Crash Zoom · Tracking · FPV Drone · Handheld · Whip Pan · Tilt Up · Static. Each toggles a professionally-phrased fragment in and out of your prompt — tap again to remove it cleanly. Static is exclusive: selecting it clears the other moves (a locked-off camera can’t also orbit), and picking any move clears Static.',
            ],
          },
        ],
      },
      {
        title: 'After a clip finishes',
        paragraphs: [
          'Heart — favorite the clip. Download — save the MP4.',
          'Extend — make it longer. Veo appends ~7 seconds to the same file (repeatable to ~2 minutes); other models capture the last frame and continue as a new chained clip.',
          'Lip Sync (mic button) — make a person in the clip speak, from typed text (46 AI voices) or an uploaded MP3/WAV.',
          'Enhance (wand button) — AI-upscale the clip to 1080p, 1440p, or 4K. Failed jobs refund their credits automatically.',
        ],
        more: [
          {
            heading: 'Extend, precisely',
            paragraphs: [
              'Veo 3.1 extends natively: the SAME file grows by ~7 seconds per pass (720p/1080p), repeatable up to about 2 minutes — seamless, no cut.',
              'Seedance and Kling chain instead: the app captures the clip’s last frame and starts a NEW clip from it with your continuation prompt. You get two files with a natural cut point — describe continuous motion ("the camera keeps orbiting as…") to hide the seam, or embrace it as a shot change.',
            ],
          },
          {
            heading: 'Lip Sync — full walkthrough',
            steps: [
              'Press the mic button on a finished clip with a clearly visible face (720p/1080p source — 4K clips must be regenerated at 1080p first).',
              'Text mode: type up to 120 characters and pick a voice — 21 English voices (narrators, UK accents, commercial reads, cartoon characters) and 25 Chinese voices (dialects, character voices) grouped in the dropdown.',
              'Audio mode: upload your own MP3/WAV (2–60 seconds, max 5MB) — your recorded voiceover, cloned voice, or music with vocals.',
              'Generate. The result appears as a new clip in the list (10 credits); the original is untouched.',
            ],
            tips: [
              'Match clip length to speech: 120 characters is roughly 8–10 seconds of speech — a 5s clip will cut it off.',
              'Audio mode with a source clip works best when the video is 2–10 seconds.',
            ],
          },
          {
            heading: 'Enhance — when each target makes sense',
            paragraphs: [
              'SeedVR2 upscaling improves detail while enlarging: 1080p to clean up a draft, 1440p for crisp social delivery, 4K (2160p) for client delivery or TV. It creates a new clip (15 credits) and works on any finished clip, including lip-synced and extended ones.',
            ],
          },
        ],
      },
      {
        title: 'Video presets',
        paragraphs: [
          '"Save preset" in the Video Generator header stores your current prompt + model + clip settings. Load or rename presets in Settings → Presets — loading one restores everything and switches you to the Video tab. Presets sync to your account across devices.',
        ],
      },
    ],
  },
  {
    id: 'story',
    emoji: '📖',
    title: 'Story Mode',
    tagline: 'Idea or script → shot plan → frames → clips',
    articles: [
      {
        title: 'How the pipeline works',
        steps: [
          'Expand the Story Mode card at the top of the Video tab.',
          'Type a story idea — or paste a full script — pick 3–6 shots, and press "Write script".',
          'The AI returns a titled shot plan. Each shot has a frame prompt (the shot’s first image), a motion prompt, and a duration.',
          'Edit anything inline. "Redo frame" regenerates a single frame. Remove shots you don’t want.',
          'Press "Generate frames" — start images for all shots generate in parallel.',
          'Press "Animate all" — every shot with a frame is queued as a clip using the Video Generator’s current model/resolution/audio settings.',
        ],
        tips: [
          'Clips land in the Videos list labeled "Shot 1/4", "Shot 2/4"… Use Extend on any of them to stretch a moment.',
          'Shot durations snap to what the selected video model supports.',
        ],
        more: [
          {
            heading: 'Worked example: what a plan looks like',
            paragraphs: [
              'Idea typed: "A lighthouse keeper finds a glowing bottle washed up in a storm." A 4-shot plan comes back something like —',
              'Shot 1 "The Storm Arrives" · frame: "a weathered lighthouse keeper in a yellow raincoat, cinematic photoreal style, standing on rain-lashed rocks at night, lighthouse beam cutting through the storm" · motion: "handheld camera pushes toward him as waves crash and rain streaks the lens" · 5s.',
              'Shot 2 "The Discovery" · frame: same descriptors ("a weathered lighthouse keeper in a yellow raincoat, cinematic photoreal style…") kneeling over a glowing blue bottle in wet sand · motion: "slow push-in as he lifts the bottle and its glow brightens his face" · 5s… and so on to the resolution.',
              'Notice the repetition: "a weathered lighthouse keeper in a yellow raincoat, cinematic photoreal style" appears word-for-word in every frame prompt. That repetition IS the character-consistency mechanism — separately-generated images only match if their descriptors match.',
            ],
          },
          {
            heading: 'Editing tactics',
            tips: [
              'Change what happens in a shot freely, but keep the repeated character/style phrases intact — edit them in EVERY shot or in none.',
              'Redo one frame at a time until it matches its neighbors before animating anything.',
              'Durations: give establishing shots and reveals 6–8s, reactions and inserts 4–5s.',
              'The frames also make a storyboard: generate frames, screenshot the card, and you have a pitch board before spending a single video credit.',
            ],
          },
          {
            heading: 'Finishing the film',
            paragraphs: [
              'Animate All queues each shot as its own clip. Download them and cut together in any editor (CapCut, Premiere, Resolve) — or Extend individual shots first where you need more air. Add music in the editor; or generate key shots with Audio on (Seedance 2.0 / Kling / Veo) for diegetic sound.',
            ],
          },
        ],
      },
      {
        title: 'Refine with AI (conversational script editing)',
        paragraphs: [
          'Press "Refine with AI" on the plan header and the whole plan is handed to the video director chat. Talk to it — then press "Apply revised plan".',
          'Applying is smart: shots whose frame prompt didn’t change keep their already-generated frames, so revisions don’t waste credits.',
        ],
        more: [
          {
            heading: 'Revision requests that work well',
            tips: [
              '"Make shot 3 a night scene and raise the tension" — targeted single-shot change.',
              '"The pacing drags in the middle — merge shots 2 and 3" — structural edit.',
              '"Give it a twist ending where the bottle is empty" — rewrite the finale while keeping the setup.',
              '"Rewrite all frame prompts in a watercolor style, keep the story identical" — global style pass (this regenerates all frames since every frame prompt changes).',
              '"Add a fifth shot between 2 and 3 showing the storm building" — the director returns the complete renumbered plan.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'helpers',
    emoji: '✨',
    title: 'AI Helpers',
    tagline: 'Chat assistants that fill in prompts and settings for you',
    articles: [
      {
        title: 'Image & logo helper (left panel)',
        paragraphs: [
          'In Image and Logo modes, the AI Helper chat crafts polished prompts from rough ideas, critiques your latest output, compares results to your reference image, and remembers your preferences across the session.',
          'Its suggestions arrive with action buttons — Apply to Generator, Apply and Generate, Generate 3 Variations — and preview as amber diffs in the settings rail before you commit.',
        ],
        more: [
          {
            heading: 'Ten things worth saying to it',
            tips: [
              '"Create a prompt for a cozy autumn cabin scene" — from-scratch prompt.',
              '"Critique the latest image against my prompt" — it diagnoses what missed and returns a corrected prompt.',
              '"Compare the latest output to my reference" — exact mismatch list (typography, palette, layout…).',
              '"Make a variation keeping what works" — next-iteration prompt from the last output.',
              '"Change only the background to white, keep everything else" — single-change edits are honored as locked-element requests.',
              '"What background remover is this using?" — answers operational questions from your actual settings without burning a generation.',
              '"Generate 3 variations" / "apply and generate it" — it can pull the trigger, not just suggest.',
              '"What do you remember?" — shows its memory: last prompts, your preferences, active brief.',
              '"Match the reference font more closely" — typography-priority rewrite.',
              '"Switch to logo mode and design a wordmark for BREW & CO" — it can change modes and configure the logo tools.',
            ],
          },
          {
            heading: 'The rail preview (amber diffs)',
            paragraphs: [
              'When the helper proposes settings, they don’t apply silently — the settings rail shows amber diff chips (current → suggested) so you see exactly what would change. Apply from the suggestion banner, or ignore it and the diff clears on your next manual change.',
            ],
          },
        ],
      },
      {
        title: 'Video director (left panel, Video mode)',
        paragraphs: [
          'Switch to the Video tab and the helper becomes a video director that knows every model’s capabilities and how Story Mode, Extend, Lip Sync, and Enhance work.',
          'When it proposes something concrete, Apply buttons appear: Apply prompt, Apply settings, and Apply revised plan.',
        ],
        more: [
          {
            heading: 'Three example conversations',
            paragraphs: [
              '"Which model should I use for a talking-head intro with sound?" → it recommends Veo 3.1 with audio on, explains the cost, and offers an Apply settings button that sets model, duration, and audio in one click.',
              '"Write me a motion prompt for this start frame — something dramatic" → a crafted prompt arrives in a gold box with Apply prompt; press it and the video prompt box fills.',
              '"Plan a 4-shot story about a paper airplane’s journey across a city" → a full shot plan arrives with Apply revised plan, which loads it straight into Story Mode.',
            ],
          },
          {
            heading: 'What it knows about your session',
            paragraphs: [
              'Every message carries your live context: the current prompt, whether start/end frames are set, and your model/duration/resolution/audio settings — so "is this too long for this model?" and "what will this cost?" get grounded answers, and its settings suggestions are validated against what each model actually supports before the Apply button appears.',
            ],
          },
        ],
      },
      {
        title: 'The Improve with AI buttons',
        paragraphs: [
          'Image/Logo dock → sends your typed idea to the helper for a full prompt + settings treatment. Video panel → seeds the video director with your current prompt and context. Both open the conversation so you can keep refining instead of accepting the first answer.',
        ],
      },
      {
        title: 'Automatic prompt writing',
        paragraphs: [
          'Pressing Animate on an image triggers a vision model that looks at the picture and writes the motion prompt for you. The "Generate from start frame" end-frame flow and per-image "Edit in Chat" are the same idea: AI doing the describing so you do the directing.',
        ],
      },
    ],
  },
  {
    id: 'organization',
    emoji: '🗂️',
    title: 'History, Favorites & Library',
    tagline: 'Everything you make is saved, searchable, and reusable',
    articles: [
      {
        title: 'History',
        paragraphs: [
          'Every image generation saves to your account history (prompt, settings, and output). The History button opens the parameter history panel — press restore on any entry to load its exact settings back into the rail.',
          'Video history keeps every clip with its status; pending jobs resume polling even after a refresh. Logo history is separate and lives in the Logo tab.',
        ],
      },
      {
        title: 'Favorites',
        paragraphs: [
          'Heart any image (card or lightbox) and it saves to the Favorites modal in the top bar. Videos have their own heart on each finished clip. Logos can be favorited inside logo history. All favorites are stored in your account, not just this browser.',
        ],
      },
      {
        title: 'Collections',
        paragraphs: [
          'Collections are named boards for your work. The killer feature is pre-assignment: open "Save to…" next to Generate, pick or create a collection, and every new generation auto-files into it.',
          'Browse everything via the Collections button in the top bar.',
        ],
        more: [
          {
            heading: 'A working-session pattern',
            steps: [
              'Starting a client project? Open "Save to…" → New collection → name it after the project.',
              'Generate freely — every image files itself into the collection as it lands, including More Like This variations.',
              'Open Collections in the top bar to review the board; remove the misses so only keepers remain.',
              'Switch "Save to…" back to "Don’t auto-file" (or another project) when you move on — the setting persists per device until you change it.',
            ],
          },
        ],
      },
      {
        title: 'Prompt Library',
        paragraphs: [
          'Every prompt you generate with (image and video) is logged automatically with a use count. Open it from the "Library" button in either prompt area: search, filter (All / Starred / Image / Video / Logo), star keepers, reuse with one click, or delete.',
        ],
        more: [
          {
            heading: 'Library mechanics',
            tips: [
              'Re-running the same prompt doesn’t duplicate it — its use count ticks up and it rises in the list, so your workhorses float to the top.',
              'Starred prompts pin above everything regardless of recency.',
              '"Use" fills the prompt box for the mode you opened the library from — reuse an image prompt as a video prompt by opening the library in the Video tab and switching the filter.',
              'Search matches anywhere in the prompt text — search your subject ("earbud") to find every prompt that ever featured it.',
            ],
          },
        ],
      },
      {
        title: 'Presets',
        paragraphs: [
          'Presets bundle a prompt + full settings under a name. Save from the image settings rail (Presets section) or the video panel’s "Save preset". Manage them in Settings → Presets: load, rename, delete.',
          'Presets sync to your account in the cloud — they follow you across browsers and devices.',
        ],
        more: [
          {
            heading: 'Presets vs Recipes vs Library — which to reach for',
            settings: [
              { name: 'Quick Recipe', values: 'built-in', description: 'A professional starting look you haven’t customized. Fastest first step.' },
              { name: 'Preset', values: 'yours', description: 'YOUR dialed-in combination — prompt + every setting — for repeatable work (brand look, client style).' },
              { name: 'Prompt Library', values: 'automatic', description: 'Just the words. Reuse a great prompt with whatever settings are current.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tools',
    emoji: '🧰',
    title: 'Other Tools',
    tagline: 'Logo, Thumbnail, Mockups, BG Remover, Translate',
    articles: [
      {
        title: 'Logo Maker',
        paragraphs: [
          'Describe your brand and generate logo concepts with dedicated controls for logo type, visual style, render treatment, and typography direction. The AI helper knows all of these and can configure them for you.',
          'On results: generate variations, vectorize to SVG, recolor, upscale, remove the background, and build a brand kit. Logo history keeps everything with favorites.',
        ],
        more: [
          {
            heading: 'A logo session that works',
            steps: [
              'Tell the AI helper: "design a logo for BREW & CO, a specialty coffee roaster — warm, artisanal, wordmark style". It configures the logo controls and writes the prompt.',
              'Generate, then use Variations on the closest concept to explore siblings.',
              'Exact text matters: keep the brand name in quotes in the prompt and check spelling on every candidate — regenerate rather than accept a near-miss.',
              'Finish the winner: Remove BG for a transparent PNG, Vectorize for scalable SVG, Recolor for alternate palettes, Brand Kit for the full asset pack.',
              'Then take it to Mockups to see it on products, or to the Video tab (Animate) for a logo sting.',
            ],
          },
        ],
      },
      {
        title: 'Thumbnail Studio',
        paragraphs: [
          'Generate YouTube-style thumbnail concepts from a topic, then edit them with AI instructions. Thumbnail history keeps your iterations.',
        ],
      },
      {
        title: 'Product Mockups',
        paragraphs: [
          'Put your logo on products: clothing, hats, mugs, tumblers, totes, pillows, phone cases and more. "Generate All" batches everything. Exports are true WYSIWYG captures of the preview.',
        ],
        more: [
          {
            heading: 'The full catalog',
            settings: [
              { name: 'Clothing', values: '5 items × 18 colors × 3 views', description: 'T-shirt, long-sleeve, tank top, hoodie, zip hoodie — front, back, and side views each. 270 combinations.' },
              { name: 'Hats', values: '2 items × 18 colors', description: 'Baseball cap and beanie.' },
              { name: 'Other products', values: 'various colors', description: 'Mugs, tumblers, tote bags, pillows, phone cases, and more.' },
              { name: 'Color palette', values: '18 colors', description: 'Black, white, charcoal, gray, heather, navy, royal, sky, red, burgundy, coral, forest, olive, teal, purple, pink, orange, yellow.' },
            ],
            tips: [
              'Categories are collapsible dropdowns with real color swatches on the buttons.',
              '"Generate All" processes the entire selection with a short delay between items — start it and let it run.',
            ],
          },
        ],
      },
      {
        title: 'BG Remover',
        paragraphs: [
          'Drop in any image for professional background removal. Default engine is fal · BiRefNet (top-tier edges, pay-as-you-go); PhotoRoom is the fallback. Also available as the "Remove BG" action on any generated image.',
        ],
      },
      {
        title: 'Translate',
        paragraphs: [
          'Translate the text inside a design image to another language while keeping the layout and style.',
        ],
      },
    ],
  },
  {
    id: 'credits',
    emoji: '💳',
    title: 'Credits & Account',
    tagline: 'What things cost and how billing works',
    articles: [
      {
        title: 'Credit costs',
        settings: [
          { name: 'Image generation', values: '4 credits / image', description: 'ChatGPT Images 2.0, any size. A 10-image batch = 40 credits.' },
          { name: 'Video · Seedance Fast', values: '3 credits / second', description: 'A 5s draft = 15 credits.' },
          { name: 'Video · Seedance 2.0', values: '6–8 credits / second', description: 'Higher rate with audio on. 4K doubles the total.' },
          { name: 'Video · Kling 3.0 Pro', values: '8–10 credits / second', description: 'Higher rate with audio on.' },
          { name: 'Video · Veo 3.1', values: '12–20 credits / second', description: 'Premium model; higher rate with audio. 4K doubles the total.' },
          { name: 'Lip Sync', values: '10 credits / run', description: 'Text-to-speech or uploaded audio.' },
          { name: 'Video Enhance', values: '15 credits / run', description: 'SeedVR2 upscale to 1080p/1440p/4K.' },
          { name: 'Image edit / thumbnail edit', values: '2 credits', description: 'AI edits on existing images.' },
          { name: 'Upscale image', values: '2 credits', description: 'To 4K.' },
          { name: 'Remove background / vectorize / recolor / mockup photo', values: '1 credit', description: 'Light transforms.' },
          { name: 'Brand kit', values: '3 credits', description: 'Full brand asset pack from a logo.' },
        ],
        tips: [
          'The exact cost always shows before you commit — on the image-count buttons and in the video panel’s live readout.',
          'Failed video jobs refund automatically. New accounts start with 30 free credits; buy more at /credits.',
        ],
        more: [
          {
            heading: 'What a typical project costs',
            paragraphs: [
              'A short product ad: 4 image candidates (16) + one More Like This (4) + a Seedance Fast draft clip (15) + the final 5s on Seedance 2.0 with audio (40) + Enhance to 4K (15) = 90 credits.',
              'A 4-shot story: 4 frames (16) + four 5s clips on Seedance 2.0 (120) = 136 credits; drafting the motion on Seedance Fast first adds 60 but usually saves at least one expensive re-run.',
            ],
          },
          {
            heading: 'How charging and refunds behave',
            paragraphs: [
              'Video jobs debit when submitted; if the job later fails, the same amount refunds automatically and Analytics shows the row as "refunded". Refunds are idempotent — a hiccup can never refund twice. Free mode (billing off) skips charging entirely while everything else works the same.',
            ],
          },
        ],
      },
      {
        title: 'The Analytics tab',
        paragraphs: [
          'The Analytics tab in the top bar shows exactly where your credits go: total spend and job counts for the last 7 / 30 / 90 days, a per-category breakdown (image, video, lip sync, enhance, logos), a daily spend chart, and a per-job list with the individual cost of every generation.',
          'Costs are computed from your history at current rates, so the numbers work even in free mode; failed video jobs show as refunded. When billing is enabled, actual recorded charges are shown too.',
        ],
      },
      {
        title: 'Accounts & your data',
        paragraphs: [
          'Sign in (email or Google) from the account menu in the top bar. Your history, favorites, collections, prompts, and presets are stored in your account and follow you across devices.',
          'Used the app before signing up? The account menu can claim the anonymous history from this device into your account (one-time).',
        ],
      },
    ],
  },
  {
    id: 'tips',
    emoji: '💡',
    title: 'Tips & Troubleshooting',
    tagline: 'Get better results and un-stick common snags',
    articles: [
      {
        title: 'Getting better results',
        tips: [
          'Workflow that wins: batch 4–6 image options → pick the best → Animate → draft the motion on Seedance Fast → re-run the keeper on Seedance 2.0 or Veo.',
          'Motion prompts: one camera move + one subject action beats a paragraph.',
          'Character consistency across shots: keep Story Mode’s repeated descriptor phrases intact when editing.',
          'Use "More Like This" instead of re-rolling the whole prompt when an image is 80% right.',
          'Star your best prompts in the Library — reuse beats rewriting.',
        ],
        more: [
          {
            heading: 'Three complete workflows',
            paragraphs: [
              'PRODUCT AD — Product on White recipe → 4 images → More Like This on the near-winner → Animate → auto motion prompt + Orbit chip → Seedance Fast draft → Seedance 2.0 final with audio → Enhance 4K → download. (~90 credits.)',
              'STORY SHORT — Story Mode: idea → 4-shot plan → Refine with AI ("raise the stakes in shot 3") → Generate frames → redo any mismatched frame → Animate All on Seedance 2.0 → Extend the climax shot → download all, cut in your editor.',
              'BRAND PACKAGE — AI helper designs the logo → variations → vectorize + Remove BG + Brand Kit → Mockups: Generate All on tees and mugs → back to Image tab: Animate the logo for a video sting → Lip Sync a mascot clip for socials.',
            ],
          },
        ],
      },
      {
        title: 'Common snags',
        tips: [
          'End frame slot says the model can’t use it → switch to Seedance 2.0, Kling 3.0 Pro, or Veo 3.1.',
          'Lip Sync fails on a 4K clip → sources must be 720p/1080p; regenerate at 1080p and try again.',
          'Video seems stuck → pending jobs poll every few seconds and survive refreshes; give final-tier models a few minutes. Failures refund automatically.',
          'A camera chip won’t combine with Static → intentional; Static clears other moves.',
          'Applied a Quick Recipe with an empty prompt → replace the words "your subject" with your actual subject.',
          'Just deployed an update and something looks off → hard refresh (Ctrl+Shift+R).',
        ],
      },
    ],
  },
]
