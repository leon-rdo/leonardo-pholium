import type { Image } from "./core";

export interface ContentBlock {
  id: number;
  page_name: string;
  key: string;
  kind: "text" | "html" | "markdown";
  text: string;
  created_at?: string;
  updated_at?: string;
  images?: Image[];
}

export interface NavigationItem {
  id: number;
  parent: number | null;
  order: number;
  is_active: boolean;
  menu_key: string;
  label: string;
  title: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteSetting {
  id: number;
  logo: string;
  default_image: string;
  site_name: string;
  tagline: string;
  bio: string;
  default_title: string;
  default_description: string;
}

export interface Testimonial {
  id: number;
  author_name: string;
  photo: string;
  order: number;
  author_role: string;
  company: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at?: string;
  updated_at?: string;
}
