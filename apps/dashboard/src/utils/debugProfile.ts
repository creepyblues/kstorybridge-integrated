import { supabase } from "@/integrations/supabase/client";
import { determineAccountType } from "@/utils/simpleAccountTypeService";

export const debugProfile = async () => {
  console.log("=== Account Profile Debug Utility ===");
  console.log("📝 Using current account type detection system (user_buyers/user_creators)");

  // 1. Test basic database connection
  try {
    const { data: titlesTest, error: titlesError } = await supabase
      .from("titles")
      .select("count")
      .limit(1);

    if (titlesError) {
      console.error("❌ Database connection failed:", titlesError);
      return;
    } else {
      console.log("✅ Database connection working");
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return;
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

  console.log("✅ Current user:", {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata
  });

  // 3. Use centralized account type detection
  try {
    console.log("🔍 Running account type detection...");
    const accountTypeResult = await determineAccountType({
      includeDatabaseLookup: true,
      debug: true
    });

    console.log("📊 Account type detection result:", accountTypeResult);
  } catch (error) {
    console.error("❌ Account type detection failed:", error);
  }

  // 4. Check user_buyers table
  try {
    const { data: buyerData, error: buyerError } = await supabase
      .from("user_buyers")
      .select("*")
      .eq("email", user.email);

    if (buyerError) {
      console.log("ℹ️ user_buyers query failed:", buyerError.message);
    } else {
      if (buyerData.length > 0) {
        console.log("✅ Found buyer profile:", buyerData[0]);
      } else {
        console.log("📭 No buyer profile found for this user");
      }
    }
  } catch (error) {
    console.error("❌ Buyer table check failed:", error);
  }

  // 5. Check user_creators table
  try {
    const { data: creatorData, error: creatorError } = await supabase
      .from("user_creators")
      .select("*")
      .eq("email", user.email);

    if (creatorError) {
      console.log("ℹ️ user_creators query failed:", creatorError.message);
    } else {
      if (creatorData.length > 0) {
        console.log("✅ Found creator profile:", creatorData[0]);
      } else {
        console.log("📭 No creator profile found for this user");
      }
    }
  } catch (error) {
    console.error("❌ Creator table check failed:", error);
  }

  // 6. Check for account type in user metadata
  const metadataAccountType = user.user_metadata?.account_type;
  if (metadataAccountType) {
    console.log(`🏷️ User metadata account_type: ${metadataAccountType}`);
  } else {
    console.log("⚠️ No account_type found in user metadata");
  }

  // 7. Summary
  console.log("\n📋 SUMMARY:");
  console.log("- Database connection: ✅");
  console.log("- User authenticated: ✅");
  console.log(`- Email: ${user.email}`);
  console.log(`- Metadata account_type: ${metadataAccountType || 'Not set'}`);

  console.log("=== End Account Profile Debug ===");
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).debugProfile = debugProfile;
}