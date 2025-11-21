/**
 * Check comp_title_cache table contents
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCache() {
  console.log("Checking comp_title_cache table...");

  const { data, error, count } = await supabase
    .from("comp_title_cache")
    .select("*", { count: "exact" });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Total cached entries:", count);

  if (data && data.length > 0) {
    data.forEach(entry => {
      const emb = entry.embedding;
      const embType = typeof emb;
      const isArray = Array.isArray(emb);
      const dim = emb ? emb.length : 0;

      console.log("Title:", entry.comp_title);
      console.log("Type:", embType, "Is Array:", isArray);
      console.log("Dimension:", dim);
    });
  } else {
    console.log("Cache is empty");
  }
}

checkCache();

