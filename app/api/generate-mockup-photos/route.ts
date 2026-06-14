import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, flatCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { generateOpenAIImage } from "@/lib/openai-image-client"
import { removeBackgroundSmart } from "@/lib/smart-bg-removal"
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * API to generate product mockup photos for realistic mockup rendering
 *
 * This is a utility endpoint to generate and save product photos.
 * Run once to populate the public/mockups folder.
 */

// Product photo prompts for each product type and color
const PRODUCT_PROMPTS: Record<string, Record<string, string>> = {
  tshirt: {
    // Neutrals - Front
    black: "product photography, blank black t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    white: "product photography, blank white t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    charcoal: "product photography, blank charcoal dark gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    gray: "product photography, blank medium gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    heather: "product photography, blank heather gray marled t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Blues - Front
    navy: "product photography, blank navy blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    royal: "product photography, blank royal blue bright blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    sky: "product photography, blank sky blue light blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Reds - Front
    red: "product photography, blank red t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    burgundy: "product photography, blank burgundy dark red wine colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    coral: "product photography, blank coral pink salmon colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Greens - Front
    forest: "product photography, blank forest green dark green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    olive: "product photography, blank olive green army green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    teal: "product photography, blank teal blue-green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Others - Front
    purple: "product photography, blank purple violet t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    pink: "product photography, blank pink hot pink t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    orange: "product photography, blank orange bright orange t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    yellow: "product photography, blank yellow bright yellow t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Back views
    'black-back': "product photography, blank black t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'white-back': "product photography, blank white t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'charcoal-back': "product photography, blank charcoal dark gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'gray-back': "product photography, blank medium gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'heather-back': "product photography, blank heather gray marled t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'navy-back': "product photography, blank navy blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'royal-back': "product photography, blank royal blue bright blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'sky-back': "product photography, blank sky blue light blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'red-back': "product photography, blank red t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'burgundy-back': "product photography, blank burgundy dark red wine colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'coral-back': "product photography, blank coral pink salmon colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'forest-back': "product photography, blank forest green dark green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'olive-back': "product photography, blank olive green army green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'teal-back': "product photography, blank teal blue-green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'purple-back': "product photography, blank purple violet t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'pink-back': "product photography, blank pink hot pink t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'orange-back': "product photography, blank orange bright orange t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'yellow-back': "product photography, blank yellow bright yellow t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    // Side views (sleeve)
    'black-side': "product photography, blank black t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'white-side': "product photography, blank white t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'charcoal-side': "product photography, blank charcoal dark gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'gray-side': "product photography, blank medium gray t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'heather-side': "product photography, blank heather gray marled t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'navy-side': "product photography, blank navy blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'royal-side': "product photography, blank royal blue bright blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'sky-side': "product photography, blank sky blue light blue t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'red-side': "product photography, blank red t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'burgundy-side': "product photography, blank burgundy dark red wine colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'coral-side': "product photography, blank coral pink salmon colored t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'forest-side': "product photography, blank forest green dark green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'olive-side': "product photography, blank olive green army green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'teal-side': "product photography, blank teal blue-green t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'purple-side': "product photography, blank purple violet t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'pink-side': "product photography, blank pink hot pink t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'orange-side': "product photography, blank orange bright orange t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
    'yellow-side': "product photography, blank yellow bright yellow t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle, cotton fabric texture visible",
  },
  hoodie: {
    // Front views - Neutrals
    black: "product photography, blank black hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    charcoal: "product photography, blank charcoal dark gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank medium gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    heather: "product photography, blank heather gray marled hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Blues
    navy: "product photography, blank navy blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    royal: "product photography, blank royal blue bright blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    sky: "product photography, blank sky blue light blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Reds
    red: "product photography, blank red hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    burgundy: "product photography, blank burgundy dark red wine colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    coral: "product photography, blank coral pink salmon colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Greens
    forest: "product photography, blank forest green dark green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    olive: "product photography, blank olive green army green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    teal: "product photography, blank teal blue-green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Others
    purple: "product photography, blank purple violet hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    pink: "product photography, blank pink hot pink hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    orange: "product photography, blank orange bright orange hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    yellow: "product photography, blank yellow bright yellow hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Back views
    'black-back': "product photography, blank black hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'white-back': "product photography, blank white hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'charcoal-back': "product photography, blank charcoal dark gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'gray-back': "product photography, blank medium gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'heather-back': "product photography, blank heather gray marled hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'navy-back': "product photography, blank navy blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'royal-back': "product photography, blank royal blue bright blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'sky-back': "product photography, blank sky blue light blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'red-back': "product photography, blank red hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'burgundy-back': "product photography, blank burgundy dark red wine colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'coral-back': "product photography, blank coral pink salmon colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'forest-back': "product photography, blank forest green dark green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'olive-back': "product photography, blank olive green army green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'teal-back': "product photography, blank teal blue-green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'purple-back': "product photography, blank purple violet hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'pink-back': "product photography, blank pink hot pink hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'orange-back': "product photography, blank orange bright orange hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'yellow-back': "product photography, blank yellow bright yellow hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    // Side views (sleeve)
    'black-side': "product photography, blank black hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'white-side': "product photography, blank white hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'charcoal-side': "product photography, blank charcoal dark gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'gray-side': "product photography, blank medium gray hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'heather-side': "product photography, blank heather gray marled hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'navy-side': "product photography, blank navy blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'royal-side': "product photography, blank royal blue bright blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'sky-side': "product photography, blank sky blue light blue hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'red-side': "product photography, blank red hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'burgundy-side': "product photography, blank burgundy dark red wine colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'coral-side': "product photography, blank coral pink salmon colored hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'forest-side': "product photography, blank forest green dark green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'olive-side': "product photography, blank olive green army green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'teal-side': "product photography, blank teal blue-green hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'purple-side': "product photography, blank purple violet hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'pink-side': "product photography, blank pink hot pink hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'orange-side': "product photography, blank orange bright orange hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'yellow-side': "product photography, blank yellow bright yellow hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
  },
  mug: {
    white: "product photography of a COMPLETELY BLANK white ceramic coffee mug, absolutely no logos no text no designs no prints no patterns, solid white color only, pure white studio background, professional product shot, high resolution, mug fills 80% of frame height, perfectly centered, handle on right side, straight-on side view, consistent scale, empty surface ready for printing",
    black: "product photography of a COMPLETELY BLANK black ceramic coffee mug, absolutely no logos no text no designs no prints no patterns, solid black color only, pure white studio background, professional product shot, high resolution, mug fills 80% of frame height, perfectly centered, handle on right side, straight-on side view, consistent scale, empty surface ready for printing",
    cream: "product photography of a COMPLETELY BLANK cream colored ceramic coffee mug, absolutely no logos no text no designs no prints no patterns, solid cream color only, pure white studio background, professional product shot, high resolution, mug fills 80% of frame height, perfectly centered, handle on right side, straight-on side view, consistent scale, empty surface ready for printing",
  },
  'phone-case': {
    black: "product photography, blank black iPhone phone case, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW back of case facing camera directly, symmetrical",
    white: "product photography, blank white iPhone phone case, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW back of case facing camera directly, symmetrical",
    clear: "product photography, blank clear transparent iPhone phone case, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW back of case facing camera directly, symmetrical",
  },
  hat: {
    // Neutrals
    black: "product photography, blank black baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    charcoal: "product photography, blank charcoal dark gray baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank medium gray baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    heather: "product photography, blank heather gray marled baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Blues
    navy: "product photography, blank navy blue baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    royal: "product photography, blank royal blue bright blue baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    sky: "product photography, blank sky blue light blue baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Reds
    red: "product photography, blank red baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    burgundy: "product photography, blank burgundy dark red wine colored baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    coral: "product photography, blank coral pink salmon colored baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Greens
    forest: "product photography, blank forest green dark green baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    olive: "product photography, blank olive green army green baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    teal: "product photography, blank teal blue-green baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Others
    purple: "product photography, blank purple violet baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    pink: "product photography, blank pink hot pink baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    orange: "product photography, blank orange bright orange baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    yellow: "product photography, blank yellow bright yellow baseball cap on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  'tote-bag': {
    natural: "product photography, blank natural canvas tote bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    black: "product photography, blank black canvas tote bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white canvas tote bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  pillow: {
    white: "product photography, blank white throw pillow, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, square shape",
    cream: "product photography, blank cream throw pillow, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, square shape",
    gray: "product photography, blank gray throw pillow, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, square shape",
  },
  'wall-art': {
    white: "product photography, blank white canvas wall art in black frame, pure white background, studio lighting, perfectly centered, no image on canvas, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    black: "product photography, blank black canvas wall art in white frame, pure white background, studio lighting, perfectly centered, no image on canvas, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  stickers: {
    white: "product photography, blank white die-cut sticker sheet, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW, rounded rectangle shapes",
  },
  // Long-sleeve tees
  longsleeve: {
    // Front views - Neutrals
    black: "product photography, blank black long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    white: "product photography, blank white long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    charcoal: "product photography, blank charcoal dark gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    gray: "product photography, blank medium gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    heather: "product photography, blank heather gray marled long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Front views - Blues
    navy: "product photography, blank navy blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    royal: "product photography, blank royal blue bright blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    sky: "product photography, blank sky blue light blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Front views - Reds
    red: "product photography, blank red long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    burgundy: "product photography, blank burgundy dark red wine colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    coral: "product photography, blank coral pink salmon colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Front views - Greens
    forest: "product photography, blank forest green dark green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    olive: "product photography, blank olive green army green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    teal: "product photography, blank teal blue-green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Front views - Others
    purple: "product photography, blank purple violet long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    pink: "product photography, blank pink hot pink long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    orange: "product photography, blank orange bright orange long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    yellow: "product photography, blank yellow bright yellow long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, cotton fabric texture visible",
    // Back views
    'black-back': "product photography, blank black long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'white-back': "product photography, blank white long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'charcoal-back': "product photography, blank charcoal dark gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'gray-back': "product photography, blank medium gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'heather-back': "product photography, blank heather gray marled long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'navy-back': "product photography, blank navy blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'royal-back': "product photography, blank royal blue bright blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'sky-back': "product photography, blank sky blue light blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'red-back': "product photography, blank red long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'burgundy-back': "product photography, blank burgundy dark red wine colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'coral-back': "product photography, blank coral pink salmon colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'forest-back': "product photography, blank forest green dark green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'olive-back': "product photography, blank olive green army green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'teal-back': "product photography, blank teal blue-green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'purple-back': "product photography, blank purple violet long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'pink-back': "product photography, blank pink hot pink long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'orange-back': "product photography, blank orange bright orange long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    'yellow-back': "product photography, blank yellow bright yellow long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical, cotton fabric texture visible",
    // Side views (sleeve)
    'black-side': "product photography, blank black long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'white-side': "product photography, blank white long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'charcoal-side': "product photography, blank charcoal dark gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'gray-side': "product photography, blank medium gray long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'heather-side': "product photography, blank heather gray marled long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'navy-side': "product photography, blank navy blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'royal-side': "product photography, blank royal blue bright blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'sky-side': "product photography, blank sky blue light blue long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'red-side': "product photography, blank red long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'burgundy-side': "product photography, blank burgundy dark red wine colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'coral-side': "product photography, blank coral pink salmon colored long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'forest-side': "product photography, blank forest green dark green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'olive-side': "product photography, blank olive green army green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'teal-side': "product photography, blank teal blue-green long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'purple-side': "product photography, blank purple violet long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'pink-side': "product photography, blank pink hot pink long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'orange-side': "product photography, blank orange bright orange long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
    'yellow-side': "product photography, blank yellow bright yellow long sleeve t-shirt on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing full sleeve, 90 degree profile angle, cotton fabric texture visible",
  },
  // Tank tops
  tanktop: {
    // Front views - Neutrals
    black: "product photography, blank black tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    charcoal: "product photography, blank charcoal dark gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank medium gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    heather: "product photography, blank heather gray marled tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Blues
    navy: "product photography, blank navy blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    royal: "product photography, blank royal blue bright blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    sky: "product photography, blank sky blue light blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Reds
    red: "product photography, blank red tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    burgundy: "product photography, blank burgundy dark red wine colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    coral: "product photography, blank coral pink salmon colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Greens
    forest: "product photography, blank forest green dark green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    olive: "product photography, blank olive green army green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    teal: "product photography, blank teal blue-green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Others
    purple: "product photography, blank purple violet tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    pink: "product photography, blank pink hot pink tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    orange: "product photography, blank orange bright orange tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    yellow: "product photography, blank yellow bright yellow tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Back views
    'black-back': "product photography, blank black tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'white-back': "product photography, blank white tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'charcoal-back': "product photography, blank charcoal dark gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'gray-back': "product photography, blank medium gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'heather-back': "product photography, blank heather gray marled tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'navy-back': "product photography, blank navy blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'royal-back': "product photography, blank royal blue bright blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'sky-back': "product photography, blank sky blue light blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'red-back': "product photography, blank red tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'burgundy-back': "product photography, blank burgundy dark red wine colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'coral-back': "product photography, blank coral pink salmon colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'forest-back': "product photography, blank forest green dark green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'olive-back': "product photography, blank olive green army green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'teal-back': "product photography, blank teal blue-green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'purple-back': "product photography, blank purple violet tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'pink-back': "product photography, blank pink hot pink tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'orange-back': "product photography, blank orange bright orange tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'yellow-back': "product photography, blank yellow bright yellow tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    // Side views
    'black-side': "product photography, blank black tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'white-side': "product photography, blank white tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'charcoal-side': "product photography, blank charcoal dark gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'gray-side': "product photography, blank medium gray tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'heather-side': "product photography, blank heather gray marled tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'navy-side': "product photography, blank navy blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'royal-side': "product photography, blank royal blue bright blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'sky-side': "product photography, blank sky blue light blue tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'red-side': "product photography, blank red tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'burgundy-side': "product photography, blank burgundy dark red wine colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'coral-side': "product photography, blank coral pink salmon colored tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'forest-side': "product photography, blank forest green dark green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'olive-side': "product photography, blank olive green army green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'teal-side': "product photography, blank teal blue-green tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'purple-side': "product photography, blank purple violet tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'pink-side': "product photography, blank pink hot pink tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'orange-side': "product photography, blank orange bright orange tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
    'yellow-side': "product photography, blank yellow bright yellow tank top on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW, 90 degree profile angle",
  },
  // Zip hoodies
  ziphoodie: {
    // Front views - Neutrals
    black: "product photography, blank black zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    charcoal: "product photography, blank charcoal dark gray zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank medium gray zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    heather: "product photography, blank heather gray marled zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Blues
    navy: "product photography, blank navy blue zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    royal: "product photography, blank royal blue bright blue zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    sky: "product photography, blank sky blue light blue zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Reds
    red: "product photography, blank red zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    burgundy: "product photography, blank burgundy dark red wine colored zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    coral: "product photography, blank coral pink salmon colored zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Greens
    forest: "product photography, blank forest green dark green zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    olive: "product photography, blank olive green army green zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    teal: "product photography, blank teal blue-green zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Others
    purple: "product photography, blank purple violet zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    pink: "product photography, blank pink hot pink zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    orange: "product photography, blank orange bright orange zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    yellow: "product photography, blank yellow bright yellow zip-up hoodie with hood down on invisible mannequin, zipper visible, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Back views
    'black-back': "product photography, blank black zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'white-back': "product photography, blank white zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'charcoal-back': "product photography, blank charcoal dark gray zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'gray-back': "product photography, blank medium gray zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'heather-back': "product photography, blank heather gray marled zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'navy-back': "product photography, blank navy blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'royal-back': "product photography, blank royal blue bright blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'sky-back': "product photography, blank sky blue light blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'red-back': "product photography, blank red zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'burgundy-back': "product photography, blank burgundy dark red wine colored zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'coral-back': "product photography, blank coral pink salmon colored zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'forest-back': "product photography, blank forest green dark green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'olive-back': "product photography, blank olive green army green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'teal-back': "product photography, blank teal blue-green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'purple-back': "product photography, blank purple violet zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'pink-back': "product photography, blank pink hot pink zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'orange-back': "product photography, blank orange bright orange zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    'yellow-back': "product photography, blank yellow bright yellow zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON BACK VIEW from behind, symmetrical",
    // Side views (sleeve)
    'black-side': "product photography, blank black zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'white-side': "product photography, blank white zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'charcoal-side': "product photography, blank charcoal dark gray zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'gray-side': "product photography, blank medium gray zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'heather-side': "product photography, blank heather gray marled zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'navy-side': "product photography, blank navy blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'royal-side': "product photography, blank royal blue bright blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'sky-side': "product photography, blank sky blue light blue zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'red-side': "product photography, blank red zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'burgundy-side': "product photography, blank burgundy dark red wine colored zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'coral-side': "product photography, blank coral pink salmon colored zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'forest-side': "product photography, blank forest green dark green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'olive-side': "product photography, blank olive green army green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'teal-side': "product photography, blank teal blue-green zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'purple-side': "product photography, blank purple violet zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'pink-side': "product photography, blank pink hot pink zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'orange-side': "product photography, blank orange bright orange zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
    'yellow-side': "product photography, blank yellow bright yellow zip-up hoodie with hood down on invisible mannequin, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, SIDE VIEW showing sleeve, 90 degree profile angle",
  },
  // Beanies
  beanie: {
    // Front views - Neutrals
    black: "product photography, blank black knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    white: "product photography, blank white knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    charcoal: "product photography, blank charcoal dark gray knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank medium gray knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    heather: "product photography, blank heather gray marled knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Blues
    navy: "product photography, blank navy blue knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    royal: "product photography, blank royal blue bright blue knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    sky: "product photography, blank sky blue light blue knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Reds
    red: "product photography, blank red knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    burgundy: "product photography, blank burgundy dark red wine colored knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    coral: "product photography, blank coral pink salmon colored knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Greens
    forest: "product photography, blank forest green dark green knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    olive: "product photography, blank olive green army green knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    teal: "product photography, blank teal blue-green knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    // Front views - Others
    purple: "product photography, blank purple violet knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    pink: "product photography, blank pink hot pink knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    orange: "product photography, blank orange bright orange knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    yellow: "product photography, blank yellow bright yellow knit beanie winter hat on invisible mannequin head form, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  // Travel mugs
  travelmug: {
    white: "product photography, blank white stainless steel travel mug tumbler with lid, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
    black: "product photography, blank black stainless steel travel mug tumbler with lid, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
    silver: "product photography, blank silver stainless steel travel mug tumbler with lid, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
  },
  // Tumblers
  tumbler: {
    white: "product photography, blank white insulated tumbler with straw, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
    black: "product photography, blank black insulated tumbler with straw, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
    silver: "product photography, blank silver stainless steel insulated tumbler with straw, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, side view",
  },
  // Canvas prints
  canvas: {
    white: "product photography, blank white stretched canvas on wooden frame, pure white background, studio lighting, centered, no image on canvas, professional mockup, high resolution, clean minimal style, angled view showing depth",
  },
  // Sticker packs
  stickerpack: {
    white: "product photography, pack of blank white vinyl stickers various shapes, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, top view scattered arrangement",
  },
  // Backpacks
  backpack: {
    black: "product photography, blank black backpack school bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank gray backpack school bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    navy: "product photography, blank navy blue backpack school bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  // Fanny packs
  fannypack: {
    black: "product photography, blank black fanny pack waist bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
    gray: "product photography, blank gray fanny pack waist bag, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical",
  },
  // Baby bodysuits
  babybodysuit: {
    white: "product photography, blank white baby onesie bodysuit, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    pink: "product photography, blank light pink baby onesie bodysuit, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    blue: "product photography, blank light blue baby onesie bodysuit, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
  },
  // Kids tees
  kidstee: {
    white: "product photography, blank white kids t-shirt small size, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    black: "product photography, blank black kids t-shirt small size, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    pink: "product photography, blank light pink kids t-shirt small size, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    blue: "product photography, blank light blue kids t-shirt small size, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
  },
  // Pet bandanas
  petbandana: {
    red: "product photography, blank red pet bandana dog scarf triangle shape, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON flat lay, symmetrical",
    blue: "product photography, blank blue pet bandana dog scarf triangle shape, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON flat lay, symmetrical",
    black: "product photography, blank black pet bandana dog scarf triangle shape, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON flat lay, symmetrical",
  },
  // Pet hoodies
  pethoodie: {
    black: "product photography, blank black pet hoodie dog sweater, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    gray: "product photography, blank gray pet hoodie dog sweater, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
    pink: "product photography, blank pink pet hoodie dog sweater, pure white background, studio lighting, perfectly centered, no logos, no text, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW flat lay, symmetrical",
  },
  // Pet beds
  petbed: {
    gray: "product photography, blank gray pet bed dog cushion, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, top angled view",
    brown: "product photography, blank brown pet bed dog cushion, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, top angled view",
    navy: "product photography, blank navy blue pet bed dog cushion, pure white background, studio lighting, centered, no logos, no text, professional mockup, high resolution, clean minimal style, top angled view",
  },
  // Posters
  poster: {
    white: "product photography, blank white paper poster print, pure white background, studio lighting, perfectly centered, no image on poster, professional mockup, high resolution, clean minimal style, STRAIGHT-ON FRONT VIEW facing camera directly, symmetrical, flat",
  },
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()
    const { product, color, saveToFile = false, skipExisting = false } = body

    // Validate inputs
    if (!product || !PRODUCT_PROMPTS[product]) {
      return NextResponse.json(
        { error: `Invalid product. Available: ${Object.keys(PRODUCT_PROMPTS).join(', ')}` },
        { status: 400 }
      )
    }

    if (!color || !PRODUCT_PROMPTS[product][color]) {
      return NextResponse.json(
        { error: `Invalid color for ${product}. Available: ${Object.keys(PRODUCT_PROMPTS[product]).join(', ')}` },
        { status: 400 }
      )
    }

    // Check if file already exists (skip if requested)
    if (skipExisting && saveToFile) {
      const filePath = path.join(process.cwd(), 'public', 'mockups', product, `${color}.png`)
      try {
        await access(filePath)
        // File exists, skip generation
        console.log(`[Mockup Photo] Skipping ${product}/${color} - already exists`)
        return NextResponse.json({
          success: true,
          product,
          color,
          skipped: true,
          savedPath: `/mockups/${product}/${color}.png`,
        })
      } catch {
        // File doesn't exist, continue with generation
      }
    }

    const prompt = PRODUCT_PROMPTS[product][color]
    console.log(`[Mockup Photo] Generating ${product}/${color}...`)

    // Generate the image
    const result = await generateOpenAIImage({
      prompt,
      aspectRatio: '1:1',
      imageSize: '2K',
      imageQuality: 'medium',
    })

    // Auto-remove background for transparent PNG using AI
    let finalBase64 = result.imageBase64
    try {
      console.log(`[Mockup Photo] Removing background with local smart removal...`)
      finalBase64 = await removeBackgroundSmart(result.imageBase64)
      console.log(`[Mockup Photo] Background removed successfully`)
    } catch (bgError) {
      console.error('[Mockup Photo] BG removal failed, using original:', bgError)
      // Continue with original image if BG removal fails
    }

    const dataUrl = `data:image/png;base64,${finalBase64}`

    // Optionally save to file system
    if (saveToFile) {
      try {
        const publicDir = path.join(process.cwd(), 'public', 'mockups', product)
        await mkdir(publicDir, { recursive: true })

        const filePath = path.join(publicDir, `${color}.png`)
        const buffer = Buffer.from(finalBase64, 'base64')
        await writeFile(filePath, buffer)

        console.log(`[Mockup Photo] Saved to ${filePath}`)

        return NextResponse.json({
          success: true,
          product,
          color,
          savedPath: `/mockups/${product}/${color}.png`,
          dataUrl,
        })
      } catch (fsError) {
        console.error('[Mockup Photo] Failed to save file:', fsError)
        // Still return success with dataUrl even if file save fails
      }
    }

    return NextResponse.json({
      success: true,
      product,
      color,
      dataUrl,
    })
  } catch (error) {
    console.error('[Mockup Photo] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate mockup photo' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available products and colors
export async function GET() {
  return NextResponse.json({
    products: Object.entries(PRODUCT_PROMPTS).map(([id, colors]) => ({
      id,
      colors: Object.keys(colors),
    })),
  })
}

export const POST = withCreditGuard('mockup_photo', flatCost('mockupPhoto'), handlePost)
