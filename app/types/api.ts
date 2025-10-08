export interface ContentBlock {
  id: number;
  page_name: string;
  key: string;
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

export interface DjangoListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
