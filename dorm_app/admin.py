from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, BuildingBlock, Category, Complaint, Announcement, CafeteriaMenu


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('tc_no', 'full_name', 'role', 'block', 'room_number', 'phone', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'block')
    search_fields = ('tc_no', 'full_name', 'phone')
    ordering = ('full_name',)

    fieldsets = (
        (None, {'fields': ('tc_no', 'password')}),
        ('Kişisel Bilgiler', {'fields': ('full_name', 'phone')}),
        ('Yurt Bilgileri', {'fields': ('role', 'block', 'room_number')}),
        ('İzinler & Durum', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('tc_no', 'full_name', 'role', 'block', 'room_number', 'password'),
        }),
    )


@admin.register(BuildingBlock)
class BuildingBlockAdmin(admin.ModelAdmin):
    list_display = ('name', 'gender_type', 'address', 'total_rooms', 'capacity')
    search_fields = ('name', 'address')
    list_filter = ('gender_type',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'icon')
    search_fields = ('name', 'department')


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'block', 'room_number', 'category', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'block', 'category', 'created_at')
    search_fields = ('title', 'description', 'room_number', 'student__full_name', 'student__tc_no')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status', 'priority', 'assigned_to')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'block', 'category', 'is_urgent', 'created_at')
    list_filter = ('is_urgent', 'category', 'block', 'created_at')
    search_fields = ('title', 'content', 'author__full_name')


@admin.register(CafeteriaMenu)
class CafeteriaMenuAdmin(admin.ModelAdmin):
    list_display = ('date', 'meal_type', 'main_course', 'soup', 'calories', 'rating', 'review_count')
    list_filter = ('meal_type', 'date')
    search_fields = ('main_course', 'soup', 'side_dish')
