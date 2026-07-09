import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: {
    envCheck: boolean
    connectionTest: boolean
    tableExists: boolean
    rowCount: number
    error?: string
    details?: string
  } = {
    envCheck: false,
    connectionTest: false,
    tableExists: false,
    rowCount: 0
  }

  try {
    // Check 1: Environment variable exists
    const dbUrl = process.env.NEON_DATABASE_URL
    diagnostics.envCheck = !!dbUrl

    if (!dbUrl) {
      diagnostics.error = 'NEON_DATABASE_URL environment variable is not set'
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // Check 2: Can connect to database
    const sql = neon(dbUrl)
    const connectionResult = await sql`SELECT NOW() as current_time`
    diagnostics.connectionTest = true
    diagnostics.details = `Connected at ${connectionResult[0]?.current_time}`

    // Check 3: Table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'generation_history'
      ) as exists
    `
    diagnostics.tableExists = tableCheck[0]?.exists === true

    if (!diagnostics.tableExists) {
      diagnostics.error = 'Table "generation_history" does not exist. Run the migration script.'
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // Check 4: Row count
    const countResult = await sql`SELECT COUNT(*) as count FROM public.generation_history`
    diagnostics.rowCount = parseInt(countResult[0]?.count || '0', 10)

    return NextResponse.json({
      ...diagnostics,
      status: 'healthy',
      message: `Database connected. Table exists with ${diagnostics.rowCount} rows.`
    })

  } catch (error) {
    // Log the real error server-side only; connection failures can embed
    // hostnames/credentials in their messages.
    console.error('[v0] API: Test connection failed:', error)
    diagnostics.error = 'Connection test failed'
    return NextResponse.json(diagnostics, { status: 500 })
  }
}
