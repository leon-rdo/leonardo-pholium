export interface Permission {
  id: number;
  name: string;
  content_type: number;
  codename: string;
}

export interface Group {
  id: number;
  name: string;
  permissions: number[];
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  groups: number[];
  user_permissions: number[];
}

export interface AnonymousUser {
  id: null;
  username: "";
  is_staff: false;
  is_active: false;
  is_superuser: false;
  is_anonymous: true;
  is_authenticated: false;
}

export type AuthUser = User | AnonymousUser;
