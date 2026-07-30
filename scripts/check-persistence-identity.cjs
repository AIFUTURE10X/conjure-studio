const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

// Source-level assertions only: everything here is IO (cookies, fetch, SQL),
// so execution isn't practical. Each pin anchors to the specific statement
// that carries the guarantee, not just the file.

const auth = read('lib/auth.ts')
const userId = read('lib/user-id.ts')
const identity = read('lib/api/identity.ts')
const studioTopBar = read('app/image-studio/components/Studio/StudioTopBar.tsx')
const accountMenu = read('app/image-studio/components/Studio/AccountMenu.tsx')
const claimRoute = read('app/api/account/claim/route.ts')
const deviceRoute = read('app/api/device/route.ts')
const deviceClaimRoute = read('app/api/device/claim/route.ts')

assert(
  /SESSION_EXPIRES_IN_SECONDS\s*=\s*60\s*\*\s*60\s*\*\s*24\s*\*\s*90/.test(auth),
  'Better Auth must keep studio sessions for 90 days, not the default 7 days.',
)

assert(
  /session:\s*\{[\s\S]*expiresIn:\s*SESSION_EXPIRES_IN_SECONDS[\s\S]*updateAge:\s*SESSION_UPDATE_AGE_SECONDS[\s\S]*\}/.test(auth),
  'Better Auth session config must wire expiresIn and updateAge explicitly.',
)

assert(
  /export function getKnownUserIds\(\): string\[\]/.test(userId),
  'lib/user-id.ts must expose all known current and legacy browser user IDs.',
)

assert(
  /return user \? user\.id : clientUserId/.test(identity),
  'Data routes must act as the session user when signed in and fall back to the browser user ID otherwise.',
)

// --- Durable device identity (cookie backup of the anonymous id) ---
// The anonymous id keys every server-side row; localStorage alone lost it on
// any storage eviction. These pins keep the cookie safety net in place.

assert(
  /DEVICE_COOKIE\s*=\s*'genie-device-id'/.test(deviceRoute),
  'Device handshake must persist the id under the genie-device-id cookie.',
)

assert(
  /DEVICE_COOKIE_MAX_AGE_SECONDS\s*=\s*60\s*\*\s*60\s*\*\s*24\s*\*\s*400/.test(deviceRoute) &&
    /maxAge:\s*DEVICE_COOKIE_MAX_AGE_SECONDS/.test(deviceRoute),
  'Device cookie must live 400 days (the Chrome ceiling) and be refreshed on every handshake.',
)

assert(
  /httpOnly:\s*true/.test(deviceRoute) && /sameSite:\s*'lax'/.test(deviceRoute),
  'Device cookie must be httpOnly (survives script-storage eviction) and SameSite=Lax.',
)

assert(
  /const deviceId = cookieId\.success \? cookieId\.data : parsed\.data\.userId/.test(deviceRoute),
  'Device handshake must treat the cookie as authoritative over the client-supplied id.',
)

assert(
  /export async function restoreDurableIdentity\(\)/.test(userId) &&
    /fetch\('\/api\/device'/.test(userId) &&
    /setUserId\(deviceId\)/.test(userId),
  'lib/user-id.ts must restore the durable cookie id on boot and adopt it locally.',
)

assert(
  /fetch\('\/api\/device\/claim'/.test(userId) && /UNCLAIMED_IDS_KEY/.test(userId),
  'restoreDurableIdentity must sweep transient-id rows into the durable id and retry failed sweeps.',
)

assert(
  /restoreDurableIdentity\(\)/.test(studioTopBar) &&
    /\.then\(\(\{ adopted \}\) => \{[\s\S]*window\.location\.reload\(\)[\s\S]*claimLegacyKeyIds\(\)/.test(studioTopBar),
  'StudioTopBar must run the cookie handshake before the legacy-key claim and reload when the durable id is adopted.',
)

assert(
  /SHOW_ACCOUNT_CONTROLS/.test(studioTopBar) &&
    /SHOW_ACCOUNT_CONTROLS && \(\s*<>[\s\S]*<AccountManager \/>[\s\S]*<AccountMenu \/>[\s\S]*<\/>/.test(studioTopBar),
  'StudioTopBar must hide account controls until the public SaaS flag is enabled.',
)

assert(
  /targetUserId: userIdSchema/.test(deviceClaimRoute) &&
    /legacyUserIds: z\.array\(userIdSchema\)/.test(deviceClaimRoute),
  'Anonymous device claim route must accept a target browser ID and legacy browser IDs.',
)

// Every user-keyed table must move in a claim — a table missing here is data
// that silently stays orphaned after an identity restore.
const CLAIMED_TABLES = [
  'favorites',
  'generation_history',
  'logo_history',
  'video_history',
  'user_presets',
  'saved_prompts',
  'collections',
  'collection_items',
]
for (const table of CLAIMED_TABLES) {
  assert(
    new RegExp(`UPDATE ${table} SET user_id = \\$2 WHERE user_id = ANY\\(\\$1::text\\[\\]\\)`).test(deviceClaimRoute),
    `Anonymous device claim route must move ${table} rows for all legacy IDs.`,
  )
}

assert(
  /getKnownUserIds/.test(accountMenu) && /legacyUserIds:\s*getKnownUserIds\(\)/.test(accountMenu),
  'AccountMenu must claim every known browser user ID, not only the current one.',
)

assert(
  /legacyUserIds:\s*z\.array\(userIdSchema\)/.test(claimRoute),
  'Account claim route must accept legacyUserIds[].',
)

assert(
  /UPDATE favorites SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(claimRoute) &&
    /UPDATE generation_history SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(claimRoute) &&
    /UPDATE logo_history SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(claimRoute),
  'Account claim route must move favorites, generation history, and logo history for all legacy IDs.',
)

console.log('Persistence identity contract passed')
