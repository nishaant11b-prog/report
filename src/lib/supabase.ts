import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kukvczlounfoqyhrfjgm.supabase.co';
const supabaseAnonKey = 'sb_publishable_E6NmDRHs_4LYH5Sc6mnOmg__M_H9kFj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
