import { supabase } from '@/integrations/supabase/client';
import type {
  PostgrestResponse,
  PostgrestSingleResponse,
  User,
  Session
} from '@supabase/supabase-js';

/**
 * Centralized database client that wraps Supabase operations
 * This provides a single point of control for all database access
 */
export class DatabaseClient {
  private static instance: DatabaseClient;

  private constructor() {}

  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  // Auth operations
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return user;
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return session;
  }

  async signOut(): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return {};
  }

  // Generic query operations
  async select<T = any>(
    table: string,
    columns = '*',
    options: {
      filters?: Record<string, any>;
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      single?: boolean;
    } = {}
  ): Promise<{ data: T | T[] | null; error?: string }> {
    try {
      let query = supabase.from(table).select(columns);

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Execute query
      const response = options.single
        ? await query.maybeSingle()
        : await query;

      if (response.error) {
        return { data: null, error: response.error.message };
      }

      return { data: response.data };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database query failed'
      };
    }
  }

  async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<{ data: T | T[] | null; error?: string }> {
    try {
      const response = await supabase.from(table).insert(data).select();

      if (response.error) {
        return { data: null, error: response.error.message };
      }

      return { data: response.data };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database insert failed'
      };
    }
  }

  async update<T = any>(
    table: string,
    data: Record<string, any>,
    filters: Record<string, any>
  ): Promise<{ data: T | T[] | null; error?: string }> {
    try {
      let query = supabase.from(table).update(data);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const response = await query.select();

      if (response.error) {
        return { data: null, error: response.error.message };
      }

      return { data: response.data };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database update failed'
      };
    }
  }

  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ error?: string }> {
    try {
      let query = supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const response = await query;

      if (response.error) {
        return { error: response.error.message };
      }

      return {};

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Database delete failed'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('titles').select('title_id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Raw Supabase client access (for advanced operations)
  get client() {
    return supabase;
  }
}

// Export singleton instance
export const databaseClient = DatabaseClient.getInstance();