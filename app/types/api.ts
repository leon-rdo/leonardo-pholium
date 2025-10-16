export interface ContentBlock {
  id: number;
  page_name: string;
  key: string;
  kind: "text" | "html" | "markdown";
  text: string;
  created_at?: string;
  updated_at?: string;
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
}

export interface Skill {
  id: number;
  level: number;
  icon: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
}

export interface Project {
  id: number;
  start_date: string;
  end_date: string | null;
  website_url: string;
  repo_url: string;
  cover: string | null;
  status: string;
  tags: number[];
  skills: number[];
  author: number;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
}

export interface Experience {
  id: number;
  start_date: string;
  end_date: string;
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
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  institution: string;
  degree: string;
  description: string;
}

export interface DjangoListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
