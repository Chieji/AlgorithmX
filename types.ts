export interface Post {
  id: string;
  author: string;
  avatar: string;
  timestamp: string; // Should be an ISO 8601 date string
  caption: string;
  imageUrl?: string | null;
  scheduledTime?: string; // Should be an ISO 8601 date string
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  attachment?: string | null;
}

export interface Slots {
  caption?: string;
  schedule_time?: string;
  post_id?: string;
  new_caption?: string;
}

export type Intent = 'create_post' | 'edit_post' | 'delete_post' | 'list_posts' | 'unknown';

export interface InterpretedCommand {
  intent: Intent;
  slots: Slots;
  reasoning: string;
  responseText: string;
}

export interface ApiKeys {
  groq?: string;
  openrouter?: string;
  tavily?: string;
  cohere?: string;
  together?: string;
}

export interface AppSettings {
  apiKeys: ApiKeys;
  facebook: {
    connected: boolean;
  };
}