require("dotenv").config({ path: "dashboard/.env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("Users Table Error:", error);
}
check();
