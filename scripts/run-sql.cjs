/**
 * Applies a SQL file to the Neon database from NEON_DATABASE_URL.
 * Loads .env.local first so it works outside Vercel.
 *
 * Usage: node scripts/run-sql.cjs scripts/008_better_auth_tables.sql
 */

const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const key = match[1]
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node scripts/run-sql.cjs <file.sql>')
    process.exit(1)
  }

  loadEnvLocal()
  const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    console.error('NEON_DATABASE_URL is not set (checked process env and .env.local)')
    process.exit(1)
  }

  const sql = fs.readFileSync(path.resolve(file), 'utf8')
  const { Client } = require('pg')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query(sql)
    console.log(`Applied ${file}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
