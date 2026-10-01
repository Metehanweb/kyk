from typing import List
from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends

from dorm_app.models import BuildingBlock, Category, User
from fastapi_app.schemas import BuildingBlockResponse, CategoryResponse, UserSimple
from fastapi_app.auth import require_roles

router = APIRouter(tags=["Bloklar ve Kategoriler (Blocks & Metadata)"])


@sync_to_async
def get_all_blocks():
    return list(BuildingBlock.objects.all())


@sync_to_async
def get_all_categories():
    return list(Category.objects.all())


@sync_to_async
def get_all_staff():
    return list(User.objects.filter(role__in=['STAFF', 'MANAGER'], is_active=True))


@router.get("/blocks", response_model=List[BuildingBlockResponse])
async def list_blocks():
    """
    Sisteme kayıtlı Elvin Buğra Arslan yurt bloklarının listelenmesi.
    """
    return await get_all_blocks()


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories():
    """
    Sistemdeki aktif arıza/şikayet kategorilerinin listelenmesi.
    """
    return await get_all_categories()


@router.get("/staff", response_model=List[UserSimple])
async def list_staff_members(current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))):
    """
    Görev ataması yapılabilecek personel ve idarecilerin listesi.
    """
    return await get_all_staff()
