# Conjure Studio

AI-powered image generation, logo design, mockups, and background removal suite for creating stunning visuals.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

## Features

### Image Studio
- **Image Analysis** - Upload images and get AI-generated prompts to recreate or modify them
- **Style Presets** - Quick access to popular styles (Photorealistic, Anime, Digital Art, etc.)
- **Batch Mode** - Process multiple images at once
- **History Panel** - Track all your generations with full parameter recall

### Logo Generator
- **Guided Mode** - Step-by-step wizard for personalized logo suggestions
- **Expert Mode** - Full control with all presets and advanced options
- **Dot Matrix Configurator** - Create stunning 3D dot matrix logos
- **PNG + SVG Export** - Download in multiple formats
- **Background Removal** - AI-powered transparent backgrounds
- **Mockup Preview** - See your logo on business cards, shirts, and more

### AI Helper
- **Smart Suggestions** - AI-powered prompt improvements
- **Logo Configuration** - Natural language to logo settings
- **Parameter Optimization** - Get better results with AI guidance

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **AI**: OpenAI API primary, Google Gemini API optional fallback, Replicate API legacy fallback paths
- **Icons**: Lucide React
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- OpenAI API key
- PhotoRoom API key (for reliable transparent PNG cleanup)
- Google Gemini API key (optional fallback)
- Replicate API token (legacy fallback paths)

### Installation

```bash
# Clone the repository
git clone https://github.com/AIFUTURE10X/v0promptsgenie.git
cd v0promptsgenie

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# OPENAI_API_KEY=your_openai_key
# PHOTOROOM_API_KEY=your_photoroom_key
# GEMINI_API_KEY=your_gemini_key_optional
# REPLICATE_API_TOKEN=your_replicate_token

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
v0promptsgenie/
├── app/
│   ├── api/                    # API Routes
│   │   ├── analyze-image/      # Image analysis endpoint
│   │   └── generate-prompt-suggestion/
│   ├── image-studio/           # Main studio application
│   │   ├── components/         # UI components
│   │   │   ├── GeneratePanel/  # Image generation
│   │   │   ├── Logo/           # Logo generator
│   │   │   ├── AIHelper/       # AI sidebar
│   │   │   └── Toolbar/        # Studio toolbar
│   │   ├── hooks/              # Custom React hooks
│   │   └── constants/          # Configuration data
│   └── page.tsx                # Landing page
├── components/
│   └── ui/                     # shadcn/ui components
└── lib/
    └── utils.ts                # Utility functions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Primary key for ChatGPT Images, AI helper, image analysis, prompt enhancement, logos, and recolor |
| `GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` | Optional Google Gemini fallback/model picker key |
| `PHOTOROOM_API_KEY` | PhotoRoom API key for default professional logo PNG background removal |
| `REPLICATE_API_TOKEN` | Replicate API token for legacy fallback paths |
| `PIXELCUT_API_KEY` | PixelCut API for background removal (optional) |

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in the Vercel dashboard.

## Development Guidelines

See [CLAUDE.md](app/image-studio/CLAUDE.md) for detailed development guidelines including:
- 300 line limit rule for components
- UI/UX best practices
- Code conventions
- Anthropic Skills reference

## License

MIT

## Author

AIFUTURE10X
