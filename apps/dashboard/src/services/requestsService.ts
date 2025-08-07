import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Request = Tables<"request">;
export type RequestInsert = TablesInsert<"request">;
export type RequestUpdate = TablesUpdate<"request">;

export type RequestWithTitle = Request & {
  titles: {
    title_id: string;
    title_name_en: string | null;
    title_name_kr: string | null;
    genre: string[] | null;
    content_format: string | null;
    title_image: string | null;
  } | null;
};

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock requests data for localhost development
const mockRequests: RequestWithTitle[] = [
  {
    id: "req-1",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "1",
    request_type: "pitch_deck",
    status: "pending",
    message: "I'd like to request the pitch deck for this fantasy webtoon. It looks very promising for our streaming platform.",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    titles: {
      title_id: "1",
      title_name_en: "Mystic Academy Chronicles",
      title_name_kr: "신비한 아카데미 연대기",
      genre: ["Fantasy"],
      content_format: "Webtoon",
      title_image: "/covers/mystic-academy.jpg"
    }
  },
  {
    id: "req-2", 
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "2",
    request_type: "contact_info",
    status: "approved",
    message: "We're interested in licensing this for our international market. Could we get contact information for the creator?",
    created_at: "2024-01-10T14:20:00Z",
    updated_at: "2024-01-12T09:15:00Z",
    titles: {
      title_id: "2",
      title_name_en: "Corporate Love Simulator", 
      title_name_kr: "회사 연애 시뮬레이터",
      genre: ["Romance"],
      content_format: "Webnovel",
      title_image: "/covers/corporate-love.jpg"
    }
  },
  {
    id: "req-3",
    user_id: "550e8400-e29b-41d4-a716-446655440000", 
    title_id: "3",
    request_type: "bible",
    status: "rejected",
    message: "Looking for the series bible to evaluate adaptation potential for our cyberpunk anthology.",
    created_at: "2024-01-05T16:45:00Z",
    updated_at: "2024-01-08T11:30:00Z",
    titles: {
      title_id: "3",
      title_name_en: "Digital Detective",
      title_name_kr: "디지털 탐정", 
      genre: ["Mystery"],
      content_format: "Webtoon",
      title_image: "/covers/digital-detective.jpg"
    }
  }
] as RequestWithTitle[];

export const requestsService = {
  // Get all requests for a specific user
  async getUserRequests(userId: string): Promise<RequestWithTitle[]> {
    console.log('🔍 Fetching requests for user:', userId);
    
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📝 REQUESTS SERVICE: Using mock data for localhost development');
      return mockRequests.filter(request => request.user_id === userId);
    }
    
    // First try with titles relationship
    const { data, error } = await supabase
      .from("request")
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          genre,
          content_format,
          title_image
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user requests with titles:", error);
      console.log("🔄 Trying to fetch requests without titles relationship...");
      
      // Fallback: get requests without titles relationship
      const { data: requestsOnly, error: requestsError } = await supabase
        .from("request")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("Error fetching user requests (fallback):", requestsError);
        throw requestsError;
      }

      console.log('✅ Fetched requests without titles:', requestsOnly?.length || 0);
      
      // Transform requests to match expected format
      return (requestsOnly || []).map(request => ({
        ...request,
        titles: null // No title data available
      })) as RequestWithTitle[];
    }

    console.log('✅ Fetched requests with titles:', data?.length || 0);
    return data || [];
  },

  // Create a new request
  async createRequest(request: RequestInsert): Promise<Request> {
    const { data, error } = await supabase
      .from("request")
      .insert(request)
      .select()
      .single();

    if (error) {
      console.error("Error creating request:", error);
      throw error;
    }

    return data;
  },

  // Update an existing request
  async updateRequest(id: string, updates: RequestUpdate): Promise<Request> {
    const { data, error } = await supabase
      .from("request")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating request:", error);
      throw error;
    }

    return data;
  },

  // Delete a request
  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from("request")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  },

  // Get request by ID
  async getRequestById(id: string): Promise<RequestWithTitle | null> {
    const { data, error } = await supabase
      .from("request")
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          genre,
          content_format,
          title_image
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error("Error fetching request:", error);
      throw error;
    }

    return data;
  }
};