import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wucdaxuaaiwttainorap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1Y2RheHVhYWl3dHRhaW5vcmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQxOTQsImV4cCI6MjA4NzE0MDE5NH0.8dVHc0lcUE5e-uTZMnm_IWJ2gzco1W5adRWaOWnE2Lo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});