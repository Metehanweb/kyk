from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    tc_no: str = Field(..., min_length=11, max_length=11, description="11 Haneli T.C. Kimlik No")
    password: str = Field(..., min_length=4, description="Kullanıcı Şifresi")


class RegisterRequest(BaseModel):
    tc_no: str = Field(..., min_length=11, max_length=11, description="11 Haneli T.C. Kimlik No")
    full_name: str = Field(..., min_length=3, max_length=150, description="Ad Soyad")
    password: str = Field(..., min_length=4, description="Kullanıcı Şifresi")
    role: str = Field(default="STUDENT", description="Rol: STUDENT, STAFF, MANAGER, ADMIN")
    block_id: Optional[UUID] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # in seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class BuildingBlockSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    gender_type: str
    address: str


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tc_no: str
    full_name: str
    role: str
    room_number: Optional[str] = None
    phone: Optional[str] = None
    block: Optional[BuildingBlockSimple] = None
    is_active: bool


# --- BUILDING BLOCK SCHEMAS ---
class BuildingBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    gender_type: str
    address: str
    total_rooms: int
    capacity: int


# --- CATEGORY SCHEMAS ---
class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    department: str
    icon: str
    description: Optional[str] = None


# --- COMPLAINT SCHEMAS ---
class ComplaintCreate(BaseModel):
    category_id: UUID
    block_id: Optional[UUID] = None
    room_number: Optional[str] = Field(default=None, max_length=50)
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    priority: str = Field(default="NORMAL")


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None  # PENDING, IN_PROGRESS, RESOLVED, REJECTED
    priority: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    resolution_note: Optional[str] = None


class UserSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tc_no: str
    full_name: str
    role: str


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    student: UserSimple
    block: BuildingBlockSimple
    category: CategoryResponse
    room_number: str
    title: str
    description: str
    status: str
    priority: str
    assigned_to: Optional[UserSimple] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# --- ANNOUNCEMENT SCHEMAS ---
class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5)
    category: str = Field(default="Genel")
    block_id: Optional[UUID] = None
    is_urgent: bool = False
    duration_days: Optional[int] = Field(default=7, description="Yayında kalacak gün sayısı (1, 3, 7, 14, 30 veya 0: süresiz)")


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    author: UserSimple
    block: Optional[BuildingBlockSimple] = None
    title: str
    content: str
    category: str
    is_urgent: bool
    expires_at: Optional[datetime] = None
    created_at: datetime


# --- CAFETERIA SCHEMAS ---
class CafeteriaMenuCreate(BaseModel):
    date: Optional[str] = None  # YYYY-MM-DD, default today
    meal_type: str = Field(default="DINNER", description="LUNCH veya DINNER")
    soup: str = Field(..., min_length=2, max_length=100)
    main_course: str = Field(..., min_length=2, max_length=100)
    side_dish: str = Field(..., min_length=2, max_length=100)
    extra: str = Field(..., min_length=2, max_length=100)
    calories: int = Field(default=850, ge=100, le=2500)


class CafeteriaMenuResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    date: str
    meal_type: str
    soup: str
    main_course: str
    side_dish: str
    extra: str
    calories: int
    rating: float
    review_count: int



# --- STATS SCHEMAS ---
class DashboardStatsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    urgent_complaints: int
    total_students: int
    occupancy_rate: float
    resolution_rate: float
    avg_resolution_hours: float


# --- ADMIN & SITE SETTINGS SCHEMAS ---
class UserAdminView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tc_no: str
    full_name: str
    role: str
    room_number: Optional[str] = None
    phone: Optional[str] = None
    block: Optional[BuildingBlockSimple] = None
    is_active: bool
    is_staff: bool
    is_superuser: bool
    created_at: datetime


class UserCreateAdmin(BaseModel):
    tc_no: str = Field(..., min_length=11, max_length=11)
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=4)
    role: str = Field(default="STUDENT")
    room_number: Optional[str] = None
    phone: Optional[str] = None
    block_id: Optional[UUID] = None
    is_active: bool = True


class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    block_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class SiteSettingsModel(BaseModel):
    site_title: str = "Elvin Buğra Arslan Yurdu"
    site_subtitle: str = "Kırşehir Mucur KYK Portalı"
    primary_color: str = "#00236f"
    primary_container: str = "#1e3a8a"
    secondary_color: str = "#006a61"
    secondary_container: str = "#86f2e4"
    surface_color: str = "#f9f9ff"
    on_surface_color: str = "#111c2d"
    accent_color: str = "#ba1a1a"
    border_radius: str = "rounded-2xl"
    font_family: str = "Plus Jakarta Sans"
    hero_badge: str = "2026 Bahar Dönemi Aktif"
    hero_title: str = "GSB Kırşehir Mucur Yurt Talep & Yaşam Yönetim Sistemi"
    hero_subtitle: str = "Arıza bildirimleri, oda talepleri ve yemekhane menüleri tek portalda"
    contact_phone: str = "0 (386) 812 45 67"
    contact_email: str = "mucuryurt@gsb.gov.tr"
    contact_address: str = "Yenice Mah. KYK Cad. No:12 Mucur / Kırşehir"
    security_phone: str = "0 (386) 812 45 99 (Nöbetçi Memur Dahili: 104)"
    cafeteria_lunch_hours: str = "12:00 - 13:30"
    cafeteria_dinner_hours: str = "18:00 - 21:00"
    footer_text: str = "T.C. Gençlik ve Spor Bakanlığı • Kredi ve Yurtlar Genel Müdürlüğü"


class RoleStatItem(BaseModel):
    role: str
    name: str
    description: str
    count: int
    permissions: List[str]
