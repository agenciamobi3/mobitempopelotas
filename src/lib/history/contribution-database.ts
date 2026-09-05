import type { Database, Json } from "@/lib/supabase/database.types";

type HistoricalContributionsTable = {
  Row: {
    id: string;
    user_id: string;
    page_path: string;
    page_title: string;
    event_year: number | null;
    kind: string;
    title: string;
    description: string;
    location_text: string | null;
    date_label: string | null;
    source_url: string | null;
    credit_name: string | null;
    publish_anonymously: boolean;
    attachments: Json;
    rights_confirmed: boolean;
    publication_authorized: boolean;
    status: string;
    moderation_note: string | null;
    created_at: string;
    reviewed_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    page_path: string;
    page_title: string;
    event_year?: number | null;
    kind: string;
    title: string;
    description: string;
    location_text?: string | null;
    date_label?: string | null;
    source_url?: string | null;
    credit_name?: string | null;
    publish_anonymously?: boolean;
    attachments?: Json;
    rights_confirmed: boolean;
    publication_authorized: boolean;
    status?: string;
    moderation_note?: string | null;
    created_at?: string;
    reviewed_at?: string | null;
  };
  Update: Partial<HistoricalContributionsTable["Insert"]>;
  Relationships: [];
};

export type ContributionDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      historical_contributions: HistoricalContributionsTable;
    };
  };
};
