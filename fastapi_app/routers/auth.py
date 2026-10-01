from fastapi import APIRouter, Depends, HTTPException, status
from asgiref.sync import sync_to_async
from jose import JWTError, jwt
from datetime import timedelta

from dorm_app.models import User, BuildingBlock
from fastapi_app.schemas import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest, UserProfile
from fastapi_app.auth import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_current_user,
    get_user_by_tc,
    get_user_by_id,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Kimlik Doğrulama (Auth)"])


@sync_to_async
def register_user_db(data: RegisterRequest):
    if User.objects.filter(tc_no=data.tc_no).exists():
        raise ValueError("Bu T.C. Kimlik Numarası ile zaten kayıtlı bir hesap bulunmaktadır.")

    block = None
    if data.block_id:
        try:
            block = BuildingBlock.objects.get(id=data.block_id)
        except BuildingBlock.DoesNotExist:
            pass

    user = User(
        tc_no=data.tc_no,
        full_name=data.full_name,
        role=data.role,
        block=block,
        room_number=data.room_number,
        phone=data.phone,
        is_staff=(data.role in ['ADMIN', 'MANAGER', 'STAFF']),
        is_superuser=(data.role == 'ADMIN')
    )
    user.set_password(data.password)
    user.save()
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    try:
        user = await register_user_db(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    block_id_str = str(user.block_id) if user.block_id else None
    token_data = {
        "sub": str(user.id),
        "tc_no": user.tc_no,
        "full_name": user.full_name,
        "role": user.role,
        "block_id": block_id_str,
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id), "tc_no": user.tc_no})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):

    user = await get_user_by_tc(credentials.tc_no)
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="T.C. Kimlik Numarası veya şifre hatalı.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Payload with subject = user.id, role, tc_no, block_id
    block_id_str = str(user.block_id) if user.block_id else None
    token_data = {
        "sub": str(user.id),
        "tc_no": user.tc_no,
        "full_name": user.full_name,
        "role": user.role,
        "block_id": block_id_str,
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id), "tc_no": user.tc_no})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş yenileme anahtarı (Refresh Token)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        decoded = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = decoded.get("type")
        if token_type != "refresh":
            raise credentials_exception
        user_id = decoded.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_id(user_id)
    if not user:
        raise credentials_exception

    block_id_str = str(user.block_id) if user.block_id else None
    token_data = {
        "sub": str(user.id),
        "tc_no": user.tc_no,
        "full_name": user.full_name,
        "role": user.role,
        "block_id": block_id_str,
    }

    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "tc_no": user.tc_no})

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
