from datetime import timedelta
from typing import List, Optional
from uuid import UUID
from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends, HTTPException, status
from django.db.models import Q
from django.utils import timezone

from dorm_app.models import Announcement, BuildingBlock, User
from fastapi_app.schemas import AnnouncementResponse, AnnouncementCreate
from fastapi_app.auth import get_current_user, require_roles

router = APIRouter(prefix="/announcements", tags=["Duyurular (Announcements)"])


@sync_to_async
def get_announcements_for_user(user: User):
    now = timezone.now()
    # Filter active non-expired announcements
    qs = Announcement.objects.select_related('author', 'block').filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=now)
    )
    # If student has a block, show dorm-wide (block=None) or block-specific
    if user.role == 'STUDENT' and user.block:
        qs = qs.filter(Q(block__isnull=True) | Q(block=user.block))
    return list(qs.order_by('-created_at')[:30])


@sync_to_async
def create_announcement_record(author: User, data: AnnouncementCreate):
    block = None
    if data.block_id:
        try:
            block = BuildingBlock.objects.get(id=data.block_id)
        except BuildingBlock.DoesNotExist:
            raise ValueError("Belirtilen blok bulunamadı.")

    expires_at = None
    if data.duration_days and data.duration_days > 0:
        expires_at = timezone.now() + timedelta(days=data.duration_days)

    ann = Announcement.objects.create(
        author=author,
        block=block,
        title=data.title,
        content=data.content,
        category=data.category,
        is_urgent=data.is_urgent,
        expires_at=expires_at
    )
    return Announcement.objects.select_related('author', 'block').get(id=ann.id)


@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(current_user: User = Depends(get_current_user)):
    """
    Kullanıcının bağlı olduğu bloğun ve genel yurdun güncel duyurularının listelenmesi.
    """
    return await get_announcements_for_user(current_user)


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Yurt idaresi tarafından yeni duyuru yayınlanması.
    """
    try:
        return await create_announcement_record(current_user, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@sync_to_async
def delete_announcement_record(announcement_id: UUID):
    deleted_count, _ = Announcement.objects.filter(id=str(announcement_id)).delete()
    return deleted_count > 0


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: UUID,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Yurt idaresi tarafından duyurunun silinmesi.
    """
    success = await delete_announcement_record(announcement_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duyuru bulunamadı.")

