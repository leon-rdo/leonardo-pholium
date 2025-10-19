export interface Tag {
  id: number;
  name: string;
  slug: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: number;
  file: string;
  thumbnail: string | null;
  image_type:
    | "cover"
    | "gallery"
    | "logo"
    | "icon"
    | "screenshot"
    | "certificate"
    | "team"
    | "document"
    | "other";
  order: number;
  is_featured: boolean;
  title: string;
  alt_text: string;
  caption: string;
  credits: string;
  content_type: number | null;
  object_id: number | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string;
  created_at: string;
  updated_at: string;
}
