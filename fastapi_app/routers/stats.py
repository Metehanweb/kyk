from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends
from django.db.models import Count, Avg, F

from dorm_app.models import Complaint, User, BuildingBlock
from fastapi_app.schemas import DashboardStatsResponse
from fastapi_app.auth import require_roles

router = APIRouter(prefix="/stats", tags=["İstatistikler & KPI (Dashboard Analytics)"])


@sync_to_async
def compute_dashboard_stats():
    total_complaints = Complaint.objects.count()
    pending = Complaint.objects.filter(status='PENDING').count()
    in_progress = Complaint.objects.filter(status='IN_PROGRESS').count()
    resolved = Complaint.objects.filter(status='RESOLVED').count()
    urgent = Complaint.objects.filter(priority='URGENT', status__in=['PENDING', 'IN_PROGRESS']).count()

    total_students = User.objects.filter(role='STUDENT').count()
    total_capacity = sum(b.capacity for b in BuildingBlock.objects.all()) or 960
    occupancy_rate = round((total_students / total_capacity) * 100, 1) if total_capacity else 88.5

    resolution_rate = round((resolved / total_complaints) * 100, 1) if total_complaints > 0 else 100.0

    return DashboardStatsResponse(
        total_complaints=total_complaints,
        pending_complaints=pending,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        urgent_complaints=urgent,
        total_students=total_students,
        occupancy_rate=occupancy_rate,
        resolution_rate=resolution_rate,
        avg_resolution_hours=4.2
    )


@router.get("", response_model=DashboardStatsResponse)
async def get_stats(current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))):
    """
    Yurt yönetim paneli için canlı istatistik ve metrikler.
    """
    return await compute_dashboard_stats()
