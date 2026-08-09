// =====================================================
// Supabase Database Types
// Auto-generated shape matching repository SQL schemas
// =====================================================

export type UserRole = 'root' | 'admin' | 'viewer' | 'user';
export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
          username?: string;
          display_name?: string;
          avatar?: string;
          email?: string | null;
        };
        Insert: {
          id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          username?: string;
          display_name?: string;
          avatar?: string;
          email?: string | null;
        };
        Update: {
          role?: UserRole;
          updated_at?: string;
          username?: string;
          display_name?: string;
          avatar?: string;
          email?: string | null;
        };
      };
      sites: {
        Row: {
          id: string;
          name: string;
          url: string;
          description: string;
          cred_type: 'normal' | 'admin';
          username: string;
          email: string;
          password: string;
          admin_page_url: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url?: string;
          description?: string;
          cred_type?: 'normal' | 'admin';
          username?: string;
          email?: string;
          password?: string;
          admin_page_url?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          url?: string;
          description?: string;
          cred_type?: 'normal' | 'admin';
          username?: string;
          email?: string;
          password?: string;
          admin_page_url?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      site_credentials: {
        Row: {
          id: string;
          site_id: string;
          cred_type: 'normal' | 'admin';
          username: string;
          email: string;
          password: string;
          admin_page_url: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          cred_type?: 'normal' | 'admin';
          username?: string;
          email?: string;
          password?: string;
          admin_page_url?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          site_id?: string;
          cred_type?: 'normal' | 'admin';
          username?: string;
          email?: string;
          password?: string;
          admin_page_url?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      mails: {
        Row: {
          id: string;
          email: string;
          password: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          password?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          name: string;
          api_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          api_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          api_key?: string;
          updated_at?: string;
        };
      };
      emp: {
        Row: {
          avatar: string;
          name: string;
          mail: string;
          phone_number: string;
          offer_letter: string;
          role: string;
        };
        Insert: {
          avatar?: string;
          name: string;
          mail: string;
          phone_number?: string;
          offer_letter?: string;
          role?: string;
        };
        Update: {
          avatar?: string;
          name?: string;
          mail?: string;
          phone_number?: string;
          offer_letter?: string;
          role?: string;
        };
      };
      _admins: {
        Row: {
          username: string;
          password: string;
        };
        Insert: {
          username: string;
          password: string;
        };
        Update: {
          username?: string;
          password?: string;
        };
      };
      login_user: {
        Row: {
          email: string;
          password_hash: string;
        };
        Insert: {
          email: string;
          password_hash: string;
        };
        Update: {
          email?: string;
          password_hash?: string;
        };
      };
    };
  };
}

// Convenience row types
export type Profile        = Database['public']['Tables']['profiles']['Row'];
export type SiteRow        = Database['public']['Tables']['sites']['Row'];
export type Site           = SiteRow; // alias kept for compat
export type SiteCredential = Database['public']['Tables']['site_credentials']['Row'];
export type MailAccount    = Database['public']['Tables']['mails']['Row'];
export type ApiKeyRecord   = Database['public']['Tables']['api_keys']['Row'];
export type EmpRecord      = Database['public']['Tables']['emp']['Row'];
export type AdminRecord    = Database['public']['Tables']['_admins']['Row'];
export type LoginUser      = Database['public']['Tables']['login_user']['Row'];

// A "SiteGroup" groups multiple rows from public.sites that share the same name+url
// Each row is one credential (normal or admin). This reflects the actual schema.
export interface SiteGroup {
  /** Synthetic key: site name (all rows in the group share same name+url) */
  name: string;
  url: string;
  description: string;
  /** All credential rows for this site (normal + admin) */
  rows: SiteRow[];
}

// Legacy alias kept for pages not yet migrated
export interface SiteWithCredentials extends Site {
  credentials: SiteCredential[];
}
