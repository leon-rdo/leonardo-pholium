import type { Tag } from "./core";
import type { User } from "./auth";

export interface Skill {
  id: number;
  level: number | null;
  icon: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
}

export interface Project<TExpand = Record<string, never>> {
  id: number;
  start_date: string | null;
  end_date: string | null;
  website_url: string;
  repo_url: string;
  cover: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tags: TExpand extends { tags: true } ? Tag[] : number[];
  skills: TExpand extends { skills: true } ? Skill[] : number[];
  author: TExpand extends { author: true } ? User : number | null;
}

export interface Experience {
  id: number;
  start_date: string;
  end_date: string | null;
  current: boolean;
  created_at: string;
  updated_at: string;
  company: string;
  role: string;
  location: string;
  description: string;
}

export interface Education {
  id: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  institution: string;
  degree: string;
  description: string;
}
