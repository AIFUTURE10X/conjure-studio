import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

export async function GET() {
  try {
    console.log('[v0] Testing Neon connection...')
    
    const sql = getSQL()
    // Test basic query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`
    console.log('[v0] Connection successful:', result[0])
    
    // Test table access
    const tableTest = await sql`SELECT COUNT(*) as row_count FROM public.favorites`
    console.log('[v0] Favorites table accessible, rows:', tableTest[0].row_count)
    
    // Test insert capability
    const testInsert = await sql`
      INSERT INTO public.favorites (user_id, image_url)
      VALUES ('test-user', 'https://test.com/image.png')
      RETURNING id
    `
    console.log('[v0] Test insert successful, ID:', testInsert[0].id)
    
    // Clean up test
    await sql`DELETE FROM public.favorites WHERE user_id = 'test-user'`
    console.log('[v0] Test cleanup complete')
    
    return NextResponse.json({
      success: true,
      message: 'Neon connection working correctly',
      serverTime: result[0]?.current_time ?? null
    })
  } catch (error) {
    // Log the real error server-side only; driver errors can embed
    // hostnames/credentials and the pg version string aids fingerprinting.
    console.error('[v0] Neon test failed:', error)
    return NextResponse.json({
      error: 'Connection test failed',
      code: 'connection_test_failed'
    }, { status: 500 })
  }
}
