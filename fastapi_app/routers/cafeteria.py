from typing import List, Optional
from uuid import UUID
from datetime import date
from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from dorm_app.models import CafeteriaMenu, User
from fastapi_app.schemas import CafeteriaMenuResponse, CafeteriaMenuCreate
from fastapi_app.auth import get_current_user, require_roles


router = APIRouter(prefix="/cafeteria", tags=["Yemekhane (Cafeteria)"])


class RateRequest(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)


@sync_to_async
def get_recent_menus():
    menus = list(CafeteriaMenu.objects.all().order_by('-date')[:7])
    # Convert date to string for schema
    result = []
    for m in menus:
        result.append(CafeteriaMenuResponse(
            id=m.id,
            date=str(m.date),
            meal_type=m.meal_type,
            soup=m.soup,
            main_course=m.main_course,
            side_dish=m.side_dish,
            extra=m.extra,
            calories=m.calories,
            rating=m.rating,
            review_count=m.review_count
        ))
    return result


@sync_to_async
def rate_menu_record(menu_id: UUID, rating_score: float):
    try:
        menu = CafeteriaMenu.objects.get(id=menu_id)
        new_count = menu.review_count + 1
        new_rating = round(((menu.rating * menu.review_count) + rating_score) / new_count, 1)
        menu.rating = new_rating
        menu.review_count = new_count
        menu.save()
        return CafeteriaMenuResponse(
            id=menu.id,
            date=str(menu.date),
            meal_type=menu.meal_type,
            soup=menu.soup,
            main_course=menu.main_course,
            side_dish=menu.side_dish,
            extra=menu.extra,
            calories=menu.calories,
            rating=menu.rating,
            review_count=menu.review_count
        )
    except CafeteriaMenu.DoesNotExist:
        return None


@router.get("/today", response_model=List[CafeteriaMenuResponse])
async def list_cafeteria_menus():
    """
    Günün ve haftanın yemekhane menülerinin listelenmesi.
    """
    return await get_recent_menus()


@sync_to_async
def create_menu_record(data: CafeteriaMenuCreate):
    from django.utils import timezone
    import datetime
    menu_date = timezone.now().date()
    if data.date:
        try:
            menu_date = datetime.datetime.strptime(data.date, "%Y-%m-%d").date()
        except ValueError:
            pass

    m = CafeteriaMenu.objects.create(
        date=menu_date,
        meal_type=data.meal_type,
        soup=data.soup,
        main_course=data.main_course,
        side_dish=data.side_dish,
        extra=data.extra,
        calories=data.calories,
        rating=5.0,
        review_count=1
    )
    return CafeteriaMenuResponse(
        id=m.id,
        date=str(m.date),
        meal_type=m.meal_type,
        soup=m.soup,
        main_course=m.main_course,
        side_dish=m.side_dish,
        extra=m.extra,
        calories=m.calories,
        rating=m.rating,
        review_count=m.review_count
    )


@router.post("/menu", response_model=CafeteriaMenuResponse, status_code=status.HTTP_201_CREATED)
async def create_cafeteria_menu(
    payload: CafeteriaMenuCreate,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """
    Yemekhane sorumlusu veya yönetici tarafından yeni yemek menüsü eklenmesi.
    """
    return await create_menu_record(payload)


@router.post("/{menu_id}/rate", response_model=CafeteriaMenuResponse)
async def rate_menu(
    menu_id: UUID,
    payload: RateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Öğrencilerin günlük yemek menüsünü 1-5 yıldız arasında puanlaması.
    """
    res = await rate_menu_record(menu_id, payload.rating)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menü bulunamadı.")
    return res

