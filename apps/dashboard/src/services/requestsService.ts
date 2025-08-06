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
  };
};

export const requestsService = {
  // Get all requests for a specific user
  async getUserRequests(userId: string): Promise<RequestWithTitle[]> {
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
      console.error("Error fetching user requests:", error);
      throw error;
    }

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