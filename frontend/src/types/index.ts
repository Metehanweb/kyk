export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'STUDENT';

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface BuildingBlockSimple {
  id: string;
  name: string;
  gender_type: 'KIZ' | 'ERKEK' | 'KARMA';
  address: string;
}

export interface BuildingBlockResponse extends BuildingBlockSimple {
  total_rooms: number;
  capacity: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  department: string;
  icon: string;
  description?: string | null;
}

export interface UserSimple {
  id: string;
  tc_no: string;
  full_name: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  tc_no: string;
  full_name: string;
  role: UserRole;
  room_number?: string | null;
  phone?: string | null;
  block?: BuildingBlockSimple | null;
  is_active: boolean;
}

export interface RegisterPayload {
  tc_no: string;
  full_name: string;
  password: string;
  role: UserRole;
  block_id?: string | null;
  room_number?: string | null;
  phone?: string | null;
}


export interface ComplaintResponse {
  id: string;
  student: UserSimple;
  block: BuildingBlockSimple;
  category: CategoryResponse;
  room_number: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  assigned_to?: UserSimple | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintCreatePayload {
  category_id: string;
  block_id?: string | null;
  room_number: string;
  title: string;
  description: string;
  priority: PriorityLevel;
}

export interface ComplaintUpdatePayload {
  status?: ComplaintStatus;
  priority?: PriorityLevel;
  assigned_to_id?: string | null;
  resolution_note?: string | null;
}

export interface AnnouncementResponse {
  id: string;
  author: UserSimple;
  block?: BuildingBlockSimple | null;
  title: string;
  content: string;
  category: string;
  is_urgent: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface AnnouncementCreatePayload {
  title: string;
  content: string;
  category: string;
  block_id?: string | null;
  is_urgent: boolean;
  duration_days?: number;
}

export interface CafeteriaMenuCreatePayload {
  date?: string;
  meal_type: 'LUNCH' | 'DINNER';
  soup: string;
  main_course: string;
  side_dish: string;
  extra: string;
  calories: number;
}

export interface CafeteriaMenuResponse {

  id: string;
  date: string;
  meal_type: 'LUNCH' | 'DINNER';
  soup: string;
  main_course: string;
  side_dish: string;
  extra: string;
  calories: number;
  rating: number;
  review_count: number;
}

export interface DashboardStatsResponse {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  urgent_complaints: number;
  total_students: number;
  occupancy_rate: number;
  resolution_rate: number;
  avg_resolution_hours: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SiteSettings {
  site_title: string;
  site_subtitle: string;
  primary_color: string;
  primary_container: string;
  secondary_color: string;
  secondary_container: string;
  surface_color: string;
  on_surface_color: string;
  accent_color: string;
  border_radius: string;
  font_family: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  security_phone: string;
  cafeteria_lunch_hours: string;
  cafeteria_dinner_hours: string;
  footer_text: string;
}

export interface RoleStatItem {
  role: UserRole;
  name: string;
  description: string;
  count: number;
  permissions: string[];
}

export interface UserAdminView {
  id: string;
  tc_no: string;
  full_name: string;
  role: UserRole;
  room_number?: string | null;
  phone?: string | null;
  block?: BuildingBlockSimple | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface UserCreateAdmin {
  tc_no: string;
  full_name: string;
  password: string;
  role: UserRole;
  room_number?: string;
  phone?: string;
  block_id?: string;
  is_active: boolean;
}

export interface UserUpdateAdmin {
  full_name?: string;
  role?: UserRole;
  room_number?: string;
  phone?: string;
  block_id?: string;
  is_active?: boolean;
  password?: string;
}

export interface DataOverview {
  complaints_count: number;
  announcements_count: number;
  cafeteria_menus_count: number;
  blocks_count: number;
  categories_count: number;
  users_count: number;
}
