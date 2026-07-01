// Run database migrations for Neon PostgreSQL
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  try {
    console.log('🚀 Starting Neon Database Migrations\n');

    // Check if NEON_DATABASE_URL is set
    if (!process.env.NEON_DATABASE_URL) {
      console.error('❌ NEON_DATABASE_URL is not set in .env.local');
      process.exit(1);
    }

    // Create SQL client
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Test connection
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1`;
    console.log('✅ Connected to Neon database\n');

    // Migration files in order
    const migrations = [
      '004_create_neon_favorites_table.sql',
      '005_create_neon_history_table.sql',
      '006_create_logo_history_table.sql',
      '007_add_config_to_logo_history.sql',
      '011_add_metadata_to_history.sql',
      '002-update-ai-helper-history.sql'
    ];

    // Run each migration
    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, 'scripts', migrationFile);

      console.log(`📄 Running migration: ${migrationFile}`);

      try {
        // Read SQL file
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Execute SQL (note: we need to use raw query for multi-statement SQL)
        // Split by semicolons and execute each statement
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement) {
            await sql.unsafe(statement);
          }
        }

        console.log(`   ✅ ${migrationFile} completed successfully\n`);
      } catch (error) {
        // If table already exists, it's okay
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${migrationFile} - tables already exist (skipping)\n`);
        } else {
          console.error(`   ❌ Error in ${migrationFile}:`);
          console.error(`      ${error.message}\n`);
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying database tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n✨ Database has ${tables.length} table(s):`);
    tables.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });

    console.log('\n🎉 Migration process complete!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

runMigrations();
