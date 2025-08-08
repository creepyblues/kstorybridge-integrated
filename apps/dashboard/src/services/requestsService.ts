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
  
  console.log('🔍 REQUESTS SERVICE: Mock data conditions:', {
    isLocalhost,
    bypassEnabled,
    isDev,
    shouldUse: isLocalhost && bypassEnabled && isDev
  });
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock requests data for localhost development - using real title data from database
const mockRequests: RequestWithTitle[] = [
  {
    id: "req-001",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "bd688163-0a61-4e67-a125-95644e5be942",
    type: "pitch",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    titles: {
      title_id: "bd688163-0a61-4e67-a125-95644e5be942",
      title_name_en: "serendipity",
      title_name_kr: "세렌디피티",
      genre: ["Drama", "Growth"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff0411885-e2d8-4b4e-8f6e-543406835ca6%2F14401000%EB%B0%B0%EB%84%88.jpg&blockId=61630920-51c6-4dd1-aa18-24867fe4d110"
    }
  },
  {
    id: "req-002", 
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "eda7e1d9-211a-4c9e-bd26-8eda72f58030",
    type: "contact",
    created_at: "2025-01-10T14:20:00Z",
    updated_at: "2025-01-12T09:15:00Z",
    titles: {
      title_id: "eda7e1d9-211a-4c9e-bd26-8eda72f58030",
      title_name_en: "Young Blood", 
      title_name_kr: "영블러드",
      genre: ["BL"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F67a243d0-c88f-4571-a915-ea2a82589c51%2F300_430.jpg&blockId=f9e61928-b726-4f8d-b437-4504e533e1ca"
    }
  },
  {
    id: "req-003",
    user_id: "550e8400-e29b-41d4-a716-446655440000", 
    title_id: "3cce946a-e45b-4c36-84b4-fc45b5ccec0e",
    type: "details",
    created_at: "2025-01-05T16:45:00Z",
    updated_at: "2025-01-08T11:30:00Z",
    titles: {
      title_id: "3cce946a-e45b-4c36-84b4-fc45b5ccec0e",
      title_name_en: "Is love delicious fried as well?",
      title_name_kr: "사랑도 튀기면 맛있나요", 
      genre: ["romance", "comedy"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F064d0237-3eb6-4b0d-9ac9-5ad7e05b6aec%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%EC%A7%80.jpg&blockId=68eca8ae-8266-4774-9a42-934c8f3c27f1"
    }
  },
  {
    id: "req-004",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "d5d4bd2b-7772-4905-8fbe-bcb21991491b",
    type: "licensing",
    created_at: "2024-12-28T09:15:00Z",
    updated_at: "2024-12-28T09:15:00Z",
    titles: {
      title_id: "d5d4bd2b-7772-4905-8fbe-bcb21991491b",
      title_name_en: "Alone on the island",
      title_name_kr: "나 홀로 섬에",
      genre: ["thriller", "suspense"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7367f965-5456-4d8a-8b6c-903940f2a8d2%2F%EB%82%98%ED%99%80%EB%A1%9C.jpg&blockId=ed10c85b-9a0c-47fe-85b5-fd303d59057d"
    }
  },
  {
    id: "req-005",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "93519f7f-5859-48c7-9130-1c829b07b382",
    type: "contact",
    created_at: "2024-12-20T13:45:00Z",
    updated_at: "2024-12-22T16:20:00Z",
    titles: {
      title_id: "93519f7f-5859-48c7-9130-1c829b07b382",
      title_name_en: "Moosick",
      title_name_kr: "무식아",
      genre: ["comedy", "gag"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7aaa1010-f1f3-4fcb-a71c-a8e7e7dcd1e8%2F005-1_%EB%B3%B5%EC%82%AC.png&blockId=1c0453f2-5066-4fb2-9efd-c0d6caa15aef"
    }
  },
  {
    id: "req-006",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "bd688163-0a61-4e67-a125-95644e5be942", // Use a valid title
    type: "pitch",
    created_at: "2025-08-07T08:42:00Z", // Match the date from the screenshot
    updated_at: "2025-08-07T08:42:00Z",
    titles: {
      title_id: "bd688163-0a61-4e67-a125-95644e5be942",
      title_name_en: "serendipity",
      title_name_kr: "세렌디피티",
      genre: ["Drama", "Growth"],
      content_format: "webtoon",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff0411885-e2d8-4b4e-8f6e-543406835ca6%2F14401000%EB%B0%B0%EB%84%88.jpg&blockId=61630920-51c6-4dd1-aa18-24867fe4d110"
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
      const filteredRequests = mockRequests.filter(request => request.user_id === userId);
      console.log('📝 REQUESTS SERVICE: Mock requests found:', filteredRequests.length, 'for user:', userId);
      console.log('📝 REQUESTS SERVICE: Available mock user IDs:', [...new Set(mockRequests.map(r => r.user_id))]);
      console.log('📝 REQUESTS SERVICE: Sample request data:', filteredRequests[0]);
      console.log('📝 REQUESTS SERVICE: All filtered requests:', filteredRequests.map(r => ({ id: r.id, titleName: r.titles?.title_name_en, hasImage: !!r.titles?.title_image })));
      return filteredRequests;
    }
    
    console.log('🌐 REQUESTS SERVICE: Attempting to fetch from production database');
    
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
      console.log('📋 Production request sample:', requestsOnly?.[0]);
      
      // Transform requests to match expected format
      return (requestsOnly || []).map(request => ({
        ...request,
        titles: null // No title data available
      })) as RequestWithTitle[];
    }

    console.log('✅ Fetched requests with titles:', data?.length || 0);
    console.log('📋 Production request with titles sample:', data?.[0]);
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