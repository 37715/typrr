import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAttempts() {
  try {
    // Use your user ID - you can find this in browser dev tools or profile
    const testUserId = '210c16c2-b5ae-419a-ac5d-e4a1272e98bb' // Replace with your actual user ID
    
    console.log('🔍 Debugging daily attempts for user:', testUserId)
    
    // Get today's date in UTC (same as API)
    const today = new Date().toISOString().slice(0, 10)
    console.log('📅 Today (UTC):', today)
    
    // Get today's daily challenge
    const { data: dailyChallenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('snippet_id, challenge_date')
      .eq('challenge_date', today)
      .maybeSingle()
    
    if (challengeError) {
      console.error('❌ Error fetching daily challenge:', challengeError)
      return
    }
    
    if (!dailyChallenge) {
      console.log('❌ No daily challenge found for today')
      return
    }
    
    console.log('✅ Today\'s challenge:', dailyChallenge)
    
    // Count attempts for this user today
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select('id, created_at, wpm, accuracy, mode')
      .eq('user_id', testUserId)
      .eq('mode', 'daily')
      .eq('snippet_id', dailyChallenge.snippet_id)
      .gte('created_at', today + 'T00:00:00Z')
      .lte('created_at', today + 'T23:59:59Z')
      .order('created_at', { ascending: true })
    
    if (attemptsError) {
      console.error('❌ Error fetching attempts:', attemptsError)
      return
    }
    
    console.log(`\n📊 Found ${attempts?.length || 0} daily attempts for today:`)
    attempts?.forEach((attempt, index) => {
      console.log(`${index + 1}. ${attempt.created_at} - ${attempt.wpm} WPM, ${attempt.accuracy}% acc`)
    })
    
    const attemptsUsed = attempts?.length || 0
    const attemptsRemaining = Math.max(0, 3 - attemptsUsed)
    
    console.log(`\n✅ Summary: ${attemptsUsed}/3 attempts used, ${attemptsRemaining} remaining`)
    
    // Check if date ranges are working correctly
    const startTime = today + 'T00:00:00Z'
    const endTime = today + 'T23:59:59Z'
    console.log(`\n🕐 Time range: ${startTime} to ${endTime}`)
    
    // Also check all daily attempts regardless of date for debugging
    const { data: allDailyAttempts, error: allError } = await supabase
      .from('attempts')
      .select('id, created_at, mode')
      .eq('user_id', testUserId)
      .eq('mode', 'daily')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log(`\n📈 Last 10 daily attempts (any date):`)
    allDailyAttempts?.forEach((attempt, index) => {
      const date = attempt.created_at.slice(0, 10)
      console.log(`${index + 1}. ${date} ${attempt.created_at.slice(11, 19)} UTC`)
    })
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

debugAttempts()