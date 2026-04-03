import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
