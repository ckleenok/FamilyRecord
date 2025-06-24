import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://akmzuhsobmckfsxvcuqr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbXp1aHNvYm1ja2ZzeHZjdXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzU3MjEsImV4cCI6MjA2NjM1MTcyMX0.fL7HrRnkn_CE1lLbK-WsMUECneeSAvhNN_TBs1uhMlk'

export const supabase = createClient(supabaseUrl, supabaseKey) 