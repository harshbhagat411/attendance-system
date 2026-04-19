import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jczqvolscynklomjabpb.supabase.co";
const supabaseKey = "sb_publishable_crBeNEqgnjE-iCBLfxaOog_ETegu_75";

export const supabase = createClient(supabaseUrl, supabaseKey);
