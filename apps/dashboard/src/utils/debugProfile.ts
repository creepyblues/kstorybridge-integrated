import { supabase } from "@/integrations/supabase/client";

export const debugProfile = async () => {
  console.log("=== Profile Debug Utility ===");
  
  // 1. Test basic connection
  try {
    const { data: testData, error: testError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    
    if (testError) {
      console.error("❌ Profiles table test failed:", testError);
      
      // Check if table exists by trying to query titles table
      const { data: titlesTest, error: titlesError } = await supabase
        .from("titles")
        .select("count")
        .limit(1);
        
      if (titlesError) {
        console.error("❌ Database connection failed entirely:", titlesError);
      } else {
        console.log("✅ Database connection works, but profiles table has issues");
      }
    } else {
      console.log("✅ Profiles table accessible");
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error);
  }

  // 2. Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("❌ Failed to get current user:", userError);
    return;
  }
  
  if (!user) {
    console.log("❌ No authenticated user found");
    return;
  }
  
  console.log("✅ Current user:", { id: user.id, email: user.email });

  // 3. Check if profile exists
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile query failed:", profileError);
      
      // Try without .single() to see if there are multiple or no results
      const { data: allProfiles, error: allError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);
        
      if (allError) {
        console.error("❌ All profiles query failed:", allError);
      } else {
        console.log("📊 All profiles for user:", allProfiles);
      }
    } else {
      console.log("✅ Profile found:", profile);
    }
  } catch (error) {
    console.error("❌ Profile fetch exception:", error);
  }

  // 4. Check user_buyers and user_ipowners tables
  try {
    const { data: buyerData, error: buyerError } = await supabase
      .from("user_buyers")
      .select("*")
      .eq("id", user.id);
      
    if (buyerError) {
      console.log("ℹ️ user_buyers query failed (might not exist):", buyerError.message);
    } else {
      console.log("📊 user_buyers data:", buyerData);
    }

    const { data: ipOwnerData, error: ipOwnerError } = await supabase
      .from("user_ipowners")
      .select("*")
      .eq("id", user.id);
      
    if (ipOwnerError) {
      console.log("ℹ️ user_ipowners query failed (might not exist):", ipOwnerError.message);
    } else {
      console.log("📊 user_ipowners data:", ipOwnerData);
    }
  } catch (error) {
    console.error("❌ User tables check failed:", error);
  }

  // 5. List all tables to see what exists
  try {
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');
      
    if (tablesError) {
      console.log("ℹ️ Could not list tables:", tablesError.message);
    } else {
      console.log("📋 Available tables:", tables);
    }
  } catch (error) {
    console.log("ℹ️ Table listing not available");
  }

  console.log("=== End Profile Debug ===");
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugProfile = debugProfile;
}