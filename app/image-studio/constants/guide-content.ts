/**
 * Guide tab content — the in-app manual. Pure data; rendered by
 * components/Guide/GuideCanvas. Keep descriptions in sync with real
 * behavior when features change.
 */

export interface GuideSettingRow {
  name: string
  values: string
  description: string
}

export interface GuideArticle {
  title: string
  paragraphs?: string[]
  steps?: string[]
  tips?: string[]
  settings?: GuideSettingRow[]
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
      },
      {
        title: 'Where everything lives',
        paragraphs: [
          'Top bar: mode tabs (Image, Video, Logo, Thumbnail, Translate, Mockups, BG Remover, Guide) plus History, Favorites, and Collections.',
          'Left panel: the AI Helper chat — an image/logo assistant in those modes, and a video director in Video mode.',
          'Center: the canvas for the current mode. Bottom (Image/Logo): the prompt dock with Generate.',
          'Right rail (Image mode): all generation settings, Quick Recipes, and Presets.',
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
      },
      {
        title: 'Quick Recipes (one-tap looks)',
        paragraphs: [
          'The Quick Recipes section at the top of the settings rail holds 10 templates: Product on White, UGC Phone Photo, Cinematic Still, Vintage Polaroid, Studio Portrait, Isometric 3D, Flat Illustration, Neon Cyberpunk, Watercolor, and Food Photography.',
          'Tapping one wraps your current prompt as the subject inside a proven scaffold AND sets the matching style, ratio, camera, and negative-prompt settings. If your prompt box is empty, the template inserts "your subject" for you to replace.',
        ],
      },
      {
        title: 'Buttons on every generated image',
        paragraphs: [
          'Heart — save to Favorites. Download — save the PNG. Restore — load the exact settings that made this image back into the rail.',
          'Remove BG — cut the background with your selected engine. Upscale — enlarge to 4K. Edit / Edit in Chat — AI-edit with instructions or a conversation. Annotate — draw boxes and notes on the image to direct the next edit.',
          'More Like This — generates a sibling variation (same subject, style, and palette; fresh details) and appends it to the grid.',
          'Animate — makes this image the video Start frame and switches you to the Video tab. End Frame — makes it the closing frame the video moves toward.',
        ],
      },
      {
        title: 'Image references (uploads)',
        paragraphs: [
          'The upload section takes Subject images (people, products, objects to include), a Scene/Background image, and a Style reference. Each is auto-analyzed and the findings feed your prompt — the style analysis can even auto-select a matching style preset and camera settings.',
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
      },
      {
        title: 'Writing the motion prompt',
        paragraphs: [
          'With a start frame set, describe MOTION only — the model already sees the scene. Without frames, describe the scene AND the motion.',
          'Automation on tap: pressing Animate auto-writes a motion prompt from your image (only if the box is empty — it never overwrites your typing). "Suggest motion from start frame" re-rolls it on demand.',
          'Camera move chips (Push In, Pull Back, Orbit, Crane Up/Down, Crash Zoom, Tracking, FPV Drone, Handheld, Whip Pan, Tilt Up, Static) toggle professional phrasing in and out of your prompt. Static clears the others.',
          '"Improve with AI" opens the video director chat in the helper panel — see the AI Helpers section.',
        ],
      },
      {
        title: 'After a clip finishes',
        paragraphs: [
          'Heart — favorite the clip. Download — save the MP4.',
          'Extend — make it longer. Veo appends ~7 seconds to the same file (repeatable to ~2 minutes); other models capture the last frame and continue as a new chained clip.',
          'Lip Sync (mic button) — make a person in the clip speak. Type text (max 120 characters) with one of 46 AI voices (21 English, 25 Chinese), or upload your own MP3/WAV (2s–60s, max 5MB). Needs a visible face and a 720p/1080p source — 4K clips must be regenerated at 1080p first.',
          'Enhance (wand button) — AI-upscale the clip to 1080p, 1440p, or 4K with SeedVR2.',
          'Failed jobs refund their credits automatically.',
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
          'The AI returns a titled shot plan. Each shot has a frame prompt (the shot’s first image), a motion prompt, and a duration. Character and style descriptors repeat word-for-word across shots so people stay consistent.',
          'Edit anything inline: titles, prompts, durations. Remove shots you don’t want. "Redo frame" regenerates a single frame.',
          'Press "Generate frames" — start images for all shots generate in parallel.',
          'Press "Animate all" — every shot with a frame is queued as a video clip using the model/resolution/audio settings from the Video Generator below.',
        ],
        tips: [
          'Clips land in the normal Videos list labeled "Shot 1/4", "Shot 2/4"… Use Extend on any of them to stretch a moment.',
          'Shot durations snap to what the selected video model supports.',
        ],
      },
      {
        title: 'Refine with AI (conversational script editing)',
        paragraphs: [
          'Press "Refine with AI" on the plan header and the whole plan is handed to the video director chat. Talk to it — "make shot 3 darker", "add a twist ending", "tighten the pacing" — and it returns a complete revised plan with an "Apply revised plan" button.',
          'Applying is smart: shots whose frame prompt didn’t change keep their already-generated frames, so revisions don’t waste credits.',
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
          'The wrench icon opens suggested prompts and preflight checks; the book icon shows what the helper currently remembers.',
        ],
      },
      {
        title: 'Video director (left panel, Video mode)',
        paragraphs: [
          'Switch to the Video tab and the helper becomes a video director that knows every model’s capabilities, durations, resolutions, audio and end-frame support — plus how Story Mode, Extend, Lip Sync, and Enhance work.',
          'Ask it to write a motion prompt, pick the right model for a shot, or plan a story. When it proposes something concrete, Apply buttons appear: Apply prompt (fills the video prompt box), Apply settings (sets model/duration/resolution/audio), and Apply revised plan (updates Story Mode).',
          'Quick-start chips under the chat: "Write me a motion prompt", "Which model should I use?", "Plan a 4-shot story".',
        ],
      },
      {
        title: 'The Improve with AI buttons',
        paragraphs: [
          'Image/Logo dock → sends your typed idea to the helper for a full prompt + settings treatment.',
          'Video panel → seeds the video director with your current prompt and context.',
          'Both open the conversation so you can keep refining instead of accepting the first answer.',
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
          'Collections are named boards for your work. The killer feature is pre-assignment: open "Save to…" next to Generate, pick or create a collection, and every new generation auto-files into it — organize before you create, not after.',
          'Browse everything via the Collections button in the top bar: tabs per collection, thumbnail grid, remove items, delete collections.',
        ],
      },
      {
        title: 'Prompt Library',
        paragraphs: [
          'Every prompt you generate with (image and video) is logged automatically with a use count. Open it from the "Library" button in either prompt area: search, filter (All / Starred / Image / Video / Logo), star keepers, reuse with one click, or delete.',
        ],
      },
      {
        title: 'Presets',
        paragraphs: [
          'Presets bundle a prompt + full settings under a name. Save from the image settings rail (Presets section) or the video panel’s "Save preset". Manage them in Settings → Presets: load, rename, delete.',
          'Presets sync to your account in the cloud — they follow you across browsers and devices, and old local-only presets migrate up automatically the first time you load the app.',
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
          'On results: generate variations, vectorize to SVG, recolor, upscale, remove the background (PhotoRoom-grade cleanup), and build a brand kit. Logo history keeps everything with favorites.',
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
          'Put your logo on products: 5 clothing items × 18 colors × 3 views (front/back/side), 2 hat styles × 18 colors, plus mugs, tumblers, totes, pillows, phone cases and more. "Generate All" batches everything. Exports are true WYSIWYG captures of the preview.',
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
          'Motion prompts: one camera move + one subject action beats a paragraph. The chips + auto-suggest exist so you rarely write from scratch.',
          'Character consistency across shots: let Story Mode write the plan — it repeats character descriptors verbatim in every frame prompt on purpose. Keep those phrases when editing.',
          'Use "More Like This" instead of re-rolling the whole prompt when an image is 80% right.',
          'Star your best prompts in the Library — reuse beats rewriting.',
        ],
      },
      {
        title: 'Common snags',
        tips: [
          'End frame slot says the model can’t use it → switch to Seedance 2.0, Kling 3.0 Pro, or Veo 3.1.',
          'Lip Sync fails on a 4K clip → sources must be 720p/1080p; regenerate at 1080p (or Enhance a 1080p version) and try again.',
          'Video seems stuck → pending jobs poll every few seconds and survive refreshes and tab switches; give final-tier models a few minutes. Failures refund automatically.',
          'A camera chip won’t combine with Static → intentional; Static clears other moves because a locked-off camera can’t also orbit.',
          'Applied a Quick Recipe with an empty prompt → replace the words "your subject" in the prompt with your actual subject.',
          'Just deployed an update and something looks off → hard refresh (Ctrl+Shift+R).',
        ],
      },
    ],
  },
]
