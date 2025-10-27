/**
 * Test if survey tables exist in production database
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.GQDlZCO8ZFKADGYdEAIcNs9OPnvEQG_xqPd6FUFyAhQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testTables() {
  console.log('\n🔍 Testing Survey Tables in Production Database\n')
  console.log('=' .repeat(60))

  const tables = [
    { name: 'title_platforms', description: 'Multi-platform support' },
    { name: 'title_documents', description: 'File upload metadata' },
    { name: 'title_drafts', description: 'Auto-save drafts' }
  ]

  let allExist = true

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table.name} - Table does not exist`)
          console.log(`   Description: ${table.description}`)
          allExist = false
        } else {
          console.log(`✅ ${table.name} - Table exists`)
          console.log(`   Description: ${table.description}`)
          console.log(`   Error querying: ${error.message} (code: ${error.code})`)
        }
      } else {
        console.log(`✅ ${table.name} - Table exists`)
        console.log(`   Description: ${table.description}`)
        console.log(`   Rows found: ${data ? data.length : 0}`)
      }
    } catch (err) {
      console.log(`❌ ${table.name} - Error: ${err.message}`)
      allExist = false
    }
    console.log('')
  }

  console.log('=' .repeat(60))

  if (allExist) {
    console.log('\n✅ All survey tables exist in production!\n')
    console.log('Next steps:')
    console.log('  1. Reload survey page: http://localhost:8085/titles/add-survey')
    console.log('  2. Test auto-save functionality')
    console.log('  3. Verify no more console errors\n')
  } else {
    console.log('\n⚠️  Some tables are missing!\n')
    console.log('Action required:')
    console.log('  1. Open Supabase SQL Editor')
    console.log('  2. Run: APPLY_SURVEY_MIGRATIONS_PRODUCTION.sql')
    console.log('  3. Verify tables created')
    console.log('  4. Reload survey page\n')
  }
}

testTables().catch(console.error)
