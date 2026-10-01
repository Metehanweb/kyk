from typing import List, Optional
from uuid import UUID
from datetime import datetime
from django.utils import timezone
from django.db.models import Q
from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends, HTTPException, status, Query

from dorm_app.models import Complaint, Category, BuildingBlock, User
from fastapi_app.schemas import ComplaintResponse, ComplaintCreate, ComplaintUpdate
from fastapi_app.auth import get_current_user, require_roles

router = APIRouter(prefix="/complaints", tags=["Arıza ve Şikayetler (Complaints)"])


@sync_to_async
def get_complaints_filtered(status: Optional[str], block_id: Optional[UUID], category_id: Optional[UUID], priority: Optional[str], search: Optional[str]):
    qs = Complaint.objects.select_related('student', 'block', 'category', 'assigned_to').all()
    if status:
        qs = qs.filter(status=status)
    if block_id:
        qs = qs.filter(block_id=block_id)
    if category_id:
        qs = qs.filter(category_id=category_id)
    if priority:
        qs = qs.filter(priority=priority)
    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(room_number__icontains=search) |
            Q(student__full_name__icontains=search)
        )
    return list(qs)


@sync_to_async
def get_student_complaints(student_id: UUID):
    return list(
        Complaint.objects.select_related('student', 'block', 'category', 'assigned_to')
        .filter(student_id=student_id)
        .order_by('-created_at')
    )


@sync_to_async
def create_complaint_record(student_user: User, data: ComplaintCreate):
    try:
        category = Category.objects.get(id=data.category_id)
    except Category.DoesNotExist:
        raise ValueError("Geçersiz kategori seçimi.")

    block = None
    if student_user.role == 'STUDENT' and student_user.block:
        block = student_user.block
    elif data.block_id:
        try:
            block = BuildingBlock.objects.get(id=data.block_id)
        except BuildingBlock.DoesNotExist:
            raise ValueError("Geçersiz blok seçimi.")
    elif student_user.block:
        block = student_user.block
    else:
        # Fallback to first block if student has no assigned block
        block = BuildingBlock.objects.first()

    room_num = student_user.room_number if (student_user.role == 'STUDENT' and student_user.room_number) else (data.room_number or '304')

    complaint = Complaint.objects.create(
        student=student_user,
        block=block,
        category=category,
        room_number=room_num,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status='PENDING'
    )
    # Refresh relations
    return Complaint.objects.select_related('student', 'block', 'category', 'assigned_to').get(id=complaint.id)


@sync_to_async
def update_complaint_record(complaint_id: UUID, data: ComplaintUpdate, current_user: User):
    try:
        complaint = Complaint.objects.select_related('student', 'block', 'category', 'assigned_to').get(id=complaint_id)
    except Complaint.DoesNotExist:
        return None

    if data.status:
        complaint.status = data.status
        if data.status == 'RESOLVED':
            complaint.resolved_at = timezone.now()
        elif data.status in ['PENDING', 'IN_PROGRESS']:
            complaint.resolved_at = None

    if data.priority:
        complaint.priority = data.priority

    if data.resolution_note is not None:
        complaint.resolution_note = data.resolution_note

    if data.assigned_to_id:
        try:
            assigned_user = User.objects.get(id=data.assigned_to_id)
            complaint.assigned_to = assigned_user
        except User.DoesNotExist:
            pass

    complaint.save()
    return Complaint.objects.select_related('student', 'block', 'category', 'assigned_to').get(id=complaint.id)


@router.get("", response_model=List[ComplaintResponse])
async def list_all_complaints(
    status: Optional[str] = Query(None, description="Filtre: PENDING, IN_PROGRESS, RESOLVED, REJECTED"),
    block_id: Optional[UUID] = Query(None, description="Blok ID filtresi"),
    category_id: Optional[UUID] = Query(None, description="Kategori ID filtresi"),
    priority: Optional[str] = Query(None, description="Öncelik: LOW, NORMAL, HIGH, URGENT"),
    search: Optional[str] = Query(None, description="Arama metni"),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """
    Yurt yöneticileri ve görevliler için arıza/şikayet listesi (filtrelenebilir).
    """
    return await get_complaints_filtered(status, block_id, category_id, priority, search)


@router.get("/my", response_model=List[ComplaintResponse])
async def list_my_complaints(current_user: User = Depends(get_current_user)):
    """
    Giriş yapmış öğrencinin kendi oluşturduğu şikayetlerin listesi.
    """
    return await get_student_complaints(current_user.id)


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Öğrenci tarafından yeni arıza veya şikayet bildirimi oluşturulması.
    """
    try:
        complaint = await create_complaint_record(current_user, payload)
        return complaint
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{id}", response_model=ComplaintResponse)
async def update_complaint_status(
    id: UUID,
    payload: ComplaintUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """
    Yönetici veya görevli personel tarafından statü ("İşleme Alındı", "Çözüldü") güncellenmesi ve not eklenmesi.
    """
    updated = await update_complaint_record(id, payload, current_user)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Şikayet kaydı bulunamadı.")
    return updated
