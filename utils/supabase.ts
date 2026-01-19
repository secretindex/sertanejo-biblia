import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string | undefined = process.env.VITE_SUPABASE_URL;
const supabaseKey: string | undefined = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
