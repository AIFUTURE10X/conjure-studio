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

const auth = read('lib/auth.ts')
const userId = read('lib/user-id.ts')
const identity = read('lib/api/identity.ts')
const studioTopBar = read('app/image-studio/components/Studio/StudioTopBar.tsx')
const accountMenu = read('app/image-studio/components/Studio/AccountMenu.tsx')
const claimRoute = read('app/api/account/claim/route.ts')
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
  /if \(!isSaasEnforcementOn\(\)\) return clientUserId/.test(identity),
  'Data routes must ignore auth cookies and use the browser user ID while SaaS enforcement is off.',
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

assert(
  /UPDATE favorites SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(deviceClaimRoute) &&
    /UPDATE generation_history SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(deviceClaimRoute) &&
    /UPDATE logo_history SET user_id = \$2 WHERE user_id = ANY\(\$1::text\[\]\)/.test(deviceClaimRoute),
  'Anonymous device claim route must move favorites, generation history, and logo history for all legacy IDs.',
)

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
