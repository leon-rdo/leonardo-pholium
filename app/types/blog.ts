import type { Image, Tag } from "./core";
import type { User } from "./auth";

export interface Category<TExpand = Record<string, never>> {
  id: number;
  parent: TExpand extends { parent: true } ? Category : number | null;
  is_active: boolean;
  order: number;
  name: string;
  slug: string;
  description: string;
  seo_title: string;
  meta_description: string;
  images?: Image[];
  children?: Category[];
}

export interface Series {
  id: number;
  is_active: boolean;
  title: string;
  slug: string;
  description: string;
  seo_title: string;
  meta_description: string;
  images?: Image[];
}

export interface Post<TExpand = Record<string, never>> {
  id: number;
  author: TExpand extends { author: true } ? User : number | null;
  category: TExpand extends { category: true } ? Category : number | null;
  series: TExpand extends { series: true } ? Series : number | null;
  status: "draft" | "scheduled" | "published" | "archived";
  visibility: "public" | "unlisted" | "private";
  published_at: string | null;
  allow_comments: boolean;
  is_pinned: boolean;
  reading_time: number;
  view_count: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  tags?: TExpand extends { tags: true } ? Tag[] : number[];
  images?: Image[];
  created_at: string;
  updated_at: string;
}

export interface PostTag {
  id: number;
  post: number;
  tag: number;
  order: number;
}

export interface Comment<TExpand = Record<string, never>> {
  id: number;
  post: TExpand extends { post: true } ? Post : number;
  parent: TExpand extends { parent: true } ? Comment : number | null;
  user: TExpand extends { user: true } ? User : number | null;
  guest_name: string;
  guest_email: string;
  guest_website: string;
  content: string;
  is_approved: boolean;
  ip_address: string | null;
  user_agent: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface PostReaction<TExpand = Record<string, never>> {
  id: number;
  post: TExpand extends { post: true } ? Post : number;
  user: TExpand extends { user: true } ? User : number;
  reaction: "like" | "love" | "clap" | "fire" | "wow";
  created_at: string;
}
