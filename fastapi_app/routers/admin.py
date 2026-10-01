import json
import os
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from asgiref.sync import sync_to_async
from django.db.models import Q, Count
from django.contrib.auth.hashers import make_password
from fastapi import APIRouter, Depends, HTTPException, status, Query

from dorm_app.models import User, BuildingBlock, Complaint, Announcement, CafeteriaMenu, Category
from fastapi_app.schemas import (
    UserAdminView,
    UserCreateAdmin,
    UserUpdateAdmin,
    SiteSettingsModel,
    RoleStatItem,
    ComplaintResponse,
    AnnouncementResponse,
    CafeteriaMenuResponse,
    CafeteriaMenuCreate,
    AnnouncementCreate,
)
from fastapi_app.auth import get_current_user, require_roles

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "site_settings.json")

router = APIRouter(tags=["Admin Yönetim Paneli"])


def load_settings_from_disk() -> dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return SiteSettingsModel().model_dump()


def save_settings_to_disk(data: dict):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# --- PUBLIC & ADMIN SITE SETTINGS ENDPOINTS ---
@router.get("/settings", response_model=SiteSettingsModel)
async def get_site_settings():
    """
    Sitenin genel görsel, renk, stil ve metin yapılandırması (Herkese açık).
    """
    data = load_settings_from_disk()
    return SiteSettingsModel(**data)


@router.get("/admin/settings", response_model=SiteSettingsModel)
async def get_admin_site_settings(current_user: User = Depends(require_roles(["ADMIN"]))):
    """
    Yönetici için sitenin mevcut görsel, renk, stil ve metin ayarları.
    """
    data = load_settings_from_disk()
    return SiteSettingsModel(**data)


@router.put("/admin/settings", response_model=SiteSettingsModel)
async def update_admin_site_settings(
    settings: SiteSettingsModel,
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Sitenin başlık, renk, stil, metin ve tasarım ayarlarının güncellenmesi.
    """
    save_settings_to_disk(settings.model_dump())
    return settings


# --- ROLES & PERMISSIONS ENDPOINTS ---
@router.get("/admin/roles", response_model=List[RoleStatItem])
async def get_roles_summary(current_user: User = Depends(require_roles(["ADMIN"]))):
    """
    Sistemdeki rolleri, kullanıcı sayılarını ve rol yetkilerini listeler.
    """
    @sync_to_async
    def query_role_counts():
        counts = {
            'ADMIN': User.objects.filter(role='ADMIN').count(),
            'MANAGER': User.objects.filter(role='MANAGER').count(),
            'STAFF': User.objects.filter(role='STAFF').count(),
            'STUDENT': User.objects.filter(role='STUDENT').count(),
        }
        return counts

    counts = await query_role_counts()

    return [
        RoleStatItem(
            role="ADMIN",
            name="Sistem Yöneticisi (Super Admin)",
            description="Tüm platform ayarları, stiller, renkler, kullanıcılar ve veri tabanı yönetimi.",
            count=counts['ADMIN'],
            permissions=[
                "Site stilleri ve renklerini değiştirme",
                "Kullanıcı ekleme, silme, rol değiştirme ve şifre sıfırlama",
                "Tüm arıza ve bildirimleri düzenleme/silme",
                "Duyuru ve yemekhane içeriklerini yönetme",
                "Sistem sağlık ve istatistik analizleri"
            ]
        ),
        RoleStatItem(
            role="MANAGER",
            name="Yurt Müdürü / İdare",
            description="Yurt içi idari süreçler, onay mercisi, duyuru yayınlama ve personel iş ataması.",
            count=counts['MANAGER'],
            permissions=[
                "Arıza taleplerini personele atama ve onaylama",
                "Genel ve blok bazlı acil duyuru yayınlama",
                "Yemekhane haftalık/günlük menü takibi",
                "Öğrenci talep istatistiklerini izleme"
            ]
        ),
        RoleStatItem(
            role="STAFF",
            name="Birim Görevlisi / Teknisyen",
            description="Saha ve teknik operasyonlar, tamirat, temizlik ve bakım süreçleri.",
            count=counts['STAFF'],
            permissions=[
                "Üzerine atanan arızaları görüntüleme ve inceleme",
                "Arıza durumunu 'İşleme Alındı' / 'Çözüldü' yapma",
                "Çözüm notu ve teknik açıklama ekleme"
            ]
        ),
        RoleStatItem(
            role="STUDENT",
            name="Yurt Öğrencisi",
            description="Yurtta ikamet eden ve servisleri kullanan öğrenci hesabı.",
            count=counts['STUDENT'],
            permissions=[
                "Oda veya ortak alan için arıza/talep oluşturma",
                "Kendi taleplerinin çözüm sürecini takip etme",
                "Günün ve haftanın yemekhane menüsünü oylama/inceleme",
                "Yurt duyurularını ve rehberini görüntüleme"
            ]
        ),
    ]


# --- USER MANAGEMENT ENDPOINTS ---
@router.get("/admin/users", response_model=List[UserAdminView])
async def list_all_users(
    q: Optional[str] = Query(None, description="İsim, TC veya oda araması"),
    role: Optional[str] = Query(None, description="Rol filtresi"),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Sistemdeki tüm kayıtlı kullanıcıları filtreleme ve arama desteğiyle listeler.
    """
    @sync_to_async
    def fetch_users():
        qs = User.objects.select_related('block').all().order_by('-created_at')
        if role:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(
                Q(full_name__icontains=q) |
                Q(tc_no__icontains=q) |
                Q(phone__icontains=q) |
                Q(room_number__icontains=q)
            )
        return list(qs)

    return await fetch_users()


@router.post("/admin/users", response_model=UserAdminView, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    payload: UserCreateAdmin,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Admin veya Yurt Müdürü tarafından doğrudan yeni kullanıcı oluşturulması.
    """
    @sync_to_async
    def save_new_user():
        if User.objects.filter(tc_no=payload.tc_no).exists():
            raise ValueError(f"Bu T.C. Kimlik Numarası ({payload.tc_no}) ile kayıtlı hesap zaten var.")

        block = None
        if payload.block_id:
            try:
                block = BuildingBlock.objects.get(id=payload.block_id)
            except BuildingBlock.DoesNotExist:
                pass

        user = User(
            tc_no=payload.tc_no,
            full_name=payload.full_name,
            role=payload.role,
            room_number=payload.room_number,
            phone=payload.phone,
            block=block,
            is_active=payload.is_active,
            is_staff=(payload.role in ['ADMIN', 'MANAGER', 'STAFF']),
            is_superuser=(payload.role == 'ADMIN')
        )
        user.set_password(payload.password)
        user.save()
        return User.objects.select_related('block').get(id=user.id)

    try:
        return await save_new_user()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/admin/users/{user_id}", response_model=UserAdminView)
async def update_user_admin(
    user_id: UUID,
    payload: UserUpdateAdmin,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Kullanıcı bilgilerini, rolünü, odasını veya şifresini güncelleme.
    """
    @sync_to_async
    def update_user_db():
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise LookupError("Kullanıcı bulunamadı.")

        if payload.full_name is not None:
            target.full_name = payload.full_name
        if payload.role is not None:
            target.role = payload.role
            target.is_staff = (payload.role in ['ADMIN', 'MANAGER', 'STAFF'])
            target.is_superuser = (payload.role == 'ADMIN')
        if payload.room_number is not None:
            target.room_number = payload.room_number
        if payload.phone is not None:
            target.phone = payload.phone
        if payload.is_active is not None:
            target.is_active = payload.is_active
        if payload.block_id is not None:
            try:
                target.block = BuildingBlock.objects.get(id=payload.block_id)
            except BuildingBlock.DoesNotExist:
                target.block = None

        if payload.password:
            target.set_password(payload.password)

        target.save()
        return User.objects.select_related('block').get(id=target.id)

    try:
        return await update_user_db()
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/admin/users/{user_id}")
async def delete_user_admin(
    user_id: UUID,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Kullanıcıyı sistemden silme (Kendi hesabını silemez).
    """
    if str(current_user.id) == str(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kendi admin hesabınızı silemezsiniz.")

    @sync_to_async
    def delete_db():
        try:
            target = User.objects.get(id=user_id)
            target.delete()
            return True
        except User.DoesNotExist:
            return False

    deleted = await delete_db()
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı.")
    return {"status": "success", "message": "Kullanıcı başarıyla silindi."}


# --- DATA & RECORD MANAGEMENT ENDPOINTS ---
@router.get("/admin/data-overview")
async def get_data_overview(current_user: User = Depends(require_roles(["ADMIN"]))):
    """
    Sistemdeki veri varlıklarının genel durum özeti.
    """
    @sync_to_async
    def stats():
        return {
            "complaints_count": Complaint.objects.count(),
            "announcements_count": Announcement.objects.count(),
            "cafeteria_menus_count": CafeteriaMenu.objects.count(),
            "blocks_count": BuildingBlock.objects.count(),
            "categories_count": Category.objects.count(),
            "users_count": User.objects.count(),
        }
    return await stats()


@router.delete("/admin/complaints/{complaint_id}")
async def delete_complaint_admin(
    complaint_id: UUID,
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Admin yetkisiyle bir arıza/şikayet kaydını kalıcı olarak silme.
    """
    @sync_to_async
    def del_c():
        try:
            Complaint.objects.get(id=complaint_id).delete()
            return True
        except Complaint.DoesNotExist:
            return False

    ok = await del_c()
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arıza kaydı bulunamadı.")
    return {"status": "success", "message": "Arıza kaydı silindi."}


@router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement_admin(
    announcement_id: UUID,
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Admin yetkisiyle bir duyuruyu silme.
    """
    @sync_to_async
    def del_a():
        try:
            Announcement.objects.get(id=announcement_id).delete()
            return True
        except Announcement.DoesNotExist:
            return False

    ok = await del_a()
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duyuru bulunamadı.")
    return {"status": "success", "message": "Duyuru silindi."}


@router.delete("/admin/cafeteria/{menu_id}")
async def delete_cafeteria_menu_admin(
    menu_id: UUID,
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Admin yetkisiyle bir yemek menüsünü silme.
    """
    @sync_to_async
    def del_m():
        try:
            CafeteriaMenu.objects.get(id=menu_id).delete()
            return True
        except CafeteriaMenu.DoesNotExist:
            return False

    ok = await del_m()
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Yemekhane menüsü bulunamadı.")
    return {"status": "success", "message": "Yemek menüsü silindi."}
