import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class BuildingBlock(models.Model):
    GENDER_CHOICES = (
        ('KIZ', 'Kız Öğrenci'),
        ('ERKEK', 'Erkek Öğrenci'),
        ('KARMA', 'İdari / Karma'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Blok Adı")
    gender_type = models.CharField(max_length=20, choices=GENDER_CHOICES, verbose_name="Yurt Tipi")
    address = models.CharField(max_length=255, verbose_name="Adres / Konum")
    total_rooms = models.PositiveIntegerField(default=120, verbose_name="Toplam Oda Sayısı")
    capacity = models.PositiveIntegerField(default=480, verbose_name="Öğrenci Kapasitesi")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'building_block'
        verbose_name = 'Bina Bloğu'
        verbose_name_plural = 'Bina Blokları'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_gender_type_display()})"


class UserManager(BaseUserManager):
    def create_user(self, tc_no, full_name, password=None, role='STUDENT', **extra_fields):
        if not tc_no:
            raise ValueError('T.C. Kimlik Numarası zorunludur.')
        if len(tc_no) != 11 or not tc_no.isdigit():
            raise ValueError('Geçerli bir 11 haneli T.C. Kimlik Numarası giriniz.')

        user = self.model(
            tc_no=tc_no,
            full_name=full_name,
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, tc_no, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser is_staff=True olmalıdır.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser is_superuser=True olmalıdır.')

        return self.create_user(tc_no, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Sistem Yöneticisi'),
        ('MANAGER', 'Yurt Müdürü / İdare'),
        ('STAFF', 'Birim Görevlisi / Personel'),
        ('STUDENT', 'Öğrenci'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tc_no = models.CharField(max_length=11, unique=True, verbose_name="T.C. Kimlik No")
    full_name = models.CharField(max_length=150, verbose_name="Ad Soyad")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT', verbose_name="Kullanıcı Rolü")
    block = models.ForeignKey(BuildingBlock, on_delete=models.SET_NULL, null=True, blank=True, related_name='residents', verbose_name="Bağlı Olduğu Blok")
    room_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="Oda No")
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="Telefon Numarası")
    is_active = models.BooleanField(default=True, verbose_name="Aktif mi")
    is_staff = models.BooleanField(default=False, verbose_name="Personel / Admin Girişi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Kayıt Tarihi")

    objects = UserManager()

    USERNAME_FIELD = 'tc_no'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'app_user'
        verbose_name = 'Kullanıcı'
        verbose_name_plural = 'Kullanıcılar'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.tc_no}) - {self.get_role_display()}"


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Kategori Adı")
    department = models.CharField(max_length=100, verbose_name="İlgili Departman")
    icon = models.CharField(max_length=50, default='build', verbose_name="İkon")
    description = models.TextField(null=True, blank=True, verbose_name="Açıklama")

    class Meta:
        db_table = 'category'
        verbose_name = 'Kategori'
        verbose_name_plural = 'Kategoriler'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.department})"


class Complaint(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Beklemede'),
        ('IN_PROGRESS', 'İşleme Alındı'),
        ('RESOLVED', 'Çözüldü'),
        ('REJECTED', 'Reddedildi'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Düşük'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'Yüksek'),
        ('URGENT', 'Acil'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints', verbose_name="Şikayetçi Öğrenci")
    block = models.ForeignKey(BuildingBlock, on_delete=models.CASCADE, related_name='complaints', verbose_name="Blok")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='complaints', verbose_name="Kategori")
    room_number = models.CharField(max_length=50, verbose_name="Oda / Alan Numarası")
    title = models.CharField(max_length=200, verbose_name="Şikayet Başlığı")
    description = models.TextField(verbose_name="Detaylı Açıklama")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Durum")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL', verbose_name="Öncelik")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks', verbose_name="Atanan Personel")
    resolution_note = models.TextField(null=True, blank=True, verbose_name="Çözüm / Süreç Notu")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="Çözülme Tarihi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Son Güncelleme")

    class Meta:
        db_table = 'complaint'
        verbose_name = 'Arıza & Şikayet'
        verbose_name_plural = 'Arıza & Şikayetler'
        ordering = ['-created_at']
        indexes = [
            # Partial index: fast query for active pending complaints by block
            models.Index(
                fields=['block', '-created_at'],
                condition=models.Q(status='PENDING'),
                name='idx_complaints_active_partial'
            ),
            # Composite index: fast query for student's complaint history ordered by time
            models.Index(
                fields=['student', '-created_at'],
                name='idx_student_complaints'
            ),
        ]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title} - {self.block.name} ({self.room_number})"


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', verbose_name="Yayınlayan")
    block = models.ForeignKey(BuildingBlock, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements', verbose_name="Hedef Blok (Boşsa Tüm Yurt)")
    title = models.CharField(max_length=200, verbose_name="Duyuru Başlığı")
    content = models.TextField(verbose_name="Duyuru Metni")
    category = models.CharField(max_length=50, default='Genel', verbose_name="Kategori")
    is_urgent = models.BooleanField(default=False, verbose_name="Acil Duyuru mu")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Yayından Kalkma Tarihi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yayınlanma Zamanı")

    class Meta:
        db_table = 'announcement'
        verbose_name = 'Duyuru'
        verbose_name_plural = 'Duyurular'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.created_at.strftime('%d.%m.%Y')})"


class CafeteriaMenu(models.Model):
    MEAL_CHOICES = (
        ('LUNCH', 'Öğle Yemeği'),
        ('DINNER', 'Akşam Yemeği'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(default=timezone.now, verbose_name="Tarih")
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES, default='DINNER', verbose_name="Öğün")
    soup = models.CharField(max_length=100, verbose_name="Çorba")
    main_course = models.CharField(max_length=100, verbose_name="Ana Yemek")
    side_dish = models.CharField(max_length=100, verbose_name="Yan Yemek / Pilav / Makarna")
    extra = models.CharField(max_length=100, verbose_name="Tatlı / Meyve / Salata")
    calories = models.PositiveIntegerField(default=850, verbose_name="Toplam Kalori (kcal)")
    rating = models.FloatField(default=4.6, verbose_name="Memnuniyet Puanı")
    review_count = models.PositiveIntegerField(default=142, verbose_name="Değerlendirme Sayısı")

    class Meta:
        db_table = 'cafeteria_menu'
        verbose_name = 'Yemekhane Menüsü'
        verbose_name_plural = 'Yemekhane Menüleri'
        ordering = ['-date', 'meal_type']

    def __str__(self):
        return f"{self.date} - {self.get_meal_type_display()}: {self.main_course}"
