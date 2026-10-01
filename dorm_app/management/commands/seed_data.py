from django.core.management.base import BaseCommand
from django.utils import timezone
from dorm_app.models import BuildingBlock, Category, User, Complaint, Announcement, CafeteriaMenu
import datetime


class Command(BaseCommand):
    help = 'Kırşehir Mucur Elvin Buğra Arslan Yurdu başlangıç verilerini tohumlar (seed).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Veritabanı tohumlama işlemi başlatılıyor..."))

        # 1. Bina Blokları
        block_a, _ = BuildingBlock.objects.get_or_create(
            name='A Blok',
            defaults={
                'gender_type': 'KIZ',
                'address': 'Yenice Mah. Yenice 92. Sokak No:1A',
                'total_rooms': 120,
                'capacity': 480
            }
        )

        block_b, _ = BuildingBlock.objects.get_or_create(
            name='B Blok',
            defaults={
                'gender_type': 'ERKEK',
                'address': 'Yenice Mah. Yenice 92. Sokak No:1B',
                'total_rooms': 120,
                'capacity': 480
            }
        )

        block_social, _ = BuildingBlock.objects.get_or_create(
            name='Sosyal Tesis',
            defaults={
                'gender_type': 'KARMA',
                'address': 'Yenice Mah. Yenice 92. Sokak No:1',
                'total_rooms': 10,
                'capacity': 50
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Bloklar olusturuldu."))

        # 2. Kategoriler
        categories_data = [
            {'name': 'Teknik / Arıza', 'department': 'Teknik Destek Ekibi', 'icon': 'build', 'description': 'Elektrik, priz, lamba, kapı kolu, mobilya ve mekanik arızalar'},
            {'name': 'Temizlik', 'department': 'Temizlik Hizmetleri', 'icon': 'cleaning_services', 'description': 'Oda, koridor, ortak kullanım alanları ve banyo hijyeni'},
            {'name': 'Sıhhi Tesisat', 'department': 'Tesisat Servisi', 'icon': 'plumbing', 'description': 'Musluk, lavabo, sıcak su, kalorifer peteği ve gider sorunları'},
            {'name': 'Yemekhane', 'department': 'Beslenme Servisi', 'icon': 'restaurant', 'description': 'Yemek kalitesi, porsiyon, hijyen ve kantin geri bildirimleri'},
            {'name': 'İnternet / Wi-Fi', 'department': 'Bilgi İşlem Birimi', 'icon': 'wifi', 'description': 'KYKWifi erişim noktası, hız ve sinyal kalitesi problemleri'},
            {'name': 'Güvenlik', 'department': 'Güvenlik Amirliği', 'icon': 'security', 'description': 'Giriş-çıkış, turnike, çevre güvenliği ve huzur ihlalleri'},
            {'name': 'Genel Öneri', 'department': 'Yurt İdaresi', 'icon': 'lightbulb', 'description': 'Sosyal aktiviteler, çalışma salonları ve genel iyileştirme tavsiyeleri'},
        ]

        category_objs = {}
        for cat_data in categories_data:
            cat_obj, _ = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            category_objs[cat_data['name']] = cat_obj
        self.stdout.write(self.style.SUCCESS("[OK] Kategoriler olusturuldu."))

        # 3. Kullanıcılar
        # Super Admin
        admin_user, _ = User.objects.get_or_create(
            tc_no='11111111110',
            defaults={
                'full_name': 'Sistem Yöneticisi',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '05551112233'
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # Yurt Müdürü (Manager)
        manager_user, _ = User.objects.get_or_create(
            tc_no='22222222220',
            defaults={
                'full_name': 'Murat Yılmaz',
                'role': 'MANAGER',
                'is_staff': True,
                'phone': '05552223344'
            }
        )
        manager_user.set_password('mudur123')
        manager_user.save()

        # Teknik Personel (Staff)
        staff_tech, _ = User.objects.get_or_create(
            tc_no='33333333330',
            defaults={
                'full_name': 'Ahmet Usta (Teknisyen)',
                'role': 'STAFF',
                'is_staff': True,
                'phone': '05553334455'
            }
        )
        staff_tech.set_password('personel123')
        staff_tech.save()

        # Temizlik Personeli (Staff)
        staff_clean, _ = User.objects.get_or_create(
            tc_no='33333333332',
            defaults={
                'full_name': 'Fatma Hanım (Temizlik Sorumlusu)',
                'role': 'STAFF',
                'is_staff': True,
                'phone': '05553334456'
            }
        )
        staff_clean.set_password('personel123')
        staff_clean.save()

        # Öğrenci 1 - Eren Demir (B Blok Erkek)
        student_eren, _ = User.objects.get_or_create(
            tc_no='98765432109',
            defaults={
                'full_name': 'Eren Demir',
                'role': 'STUDENT',
                'block': block_b,
                'room_number': '304',
                'phone': '05559876543'
            }
        )
        student_eren.set_password('ogrenci123')
        student_eren.save()

        # Öğrenci 2 - Zeynep Kaya (A Blok Kız)
        student_zeynep, _ = User.objects.get_or_create(
            tc_no='12345678901',
            defaults={
                'full_name': 'Zeynep Kaya',
                'role': 'STUDENT',
                'block': block_a,
                'room_number': '214',
                'phone': '05551234567'
            }
        )
        student_zeynep.set_password('ogrenci123')
        student_zeynep.save()

        self.stdout.write(self.style.SUCCESS("[OK] Kullanicilar olusturuldu."))

        # 4. Örnek Şikayetler / Talepler
        sample_complaints = [
            {
                'student': student_eren,
                'block': block_b,
                'category': category_objs['Teknik / Arıza'],
                'room_number': 'Oda 304',
                'title': 'Çalışma Masası Prizi Çalışmıyor',
                'description': '304 numaralı odada sol taraftaki çalışma masasının elektrik prizinde temassızlık var. Kıvılcım çıkardı, acil kontrol edilmesi gerekebilir.',
                'status': 'PENDING',
                'priority': 'HIGH',
            },
            {
                'student': student_eren,
                'block': block_b,
                'category': category_objs['Sıhhi Tesisat'],
                'room_number': 'Kat 3 Banyo',
                'title': '3. Kat Banyo Sıcak Su Basıncı Yetersiz',
                'description': 'Akşam saatlerinde 3. kat duşlarında sıcak su basıncı çok zayıflıyor, ılık su gelmekte zorlanıyor.',
                'status': 'IN_PROGRESS',
                'priority': 'NORMAL',
                'assigned_to': staff_tech,
                'resolution_note': 'Kazan dairesi sirkülasyon pompası kontrol ediliyor, parça değişimi yapılacak.'
            },
            {
                'student': student_zeynep,
                'block': block_a,
                'category': category_objs['Temizlik'],
                'room_number': 'Oda 214',
                'title': 'Oda Cam Kolu ve Genel Temizlik Kontrolü',
                'description': 'Oda cam kolu tam kapanmıyor ve rutin zemin temizliği talebimiz bulunmaktadır.',
                'status': 'RESOLVED',
                'priority': 'NORMAL',
                'assigned_to': staff_clean,
                'resolution_note': 'Cam mandalı onarıldı, zemin temizliği ve dezenfeksiyonu tamamlandı.',
                'resolved_at': timezone.now() - datetime.timedelta(hours=6)
            },
            {
                'student': student_eren,
                'block': block_b,
                'category': category_objs['İnternet / Wi-Fi'],
                'room_number': 'Oda 304',
                'title': 'KYKWifi Kopma Problemi',
                'description': 'Akşam 20:00 ile 23:00 arasında KYKWifi ağına bağlanırken IP alma hatası alınıyor.',
                'status': 'PENDING',
                'priority': 'NORMAL',
            },
            {
                'student': student_zeynep,
                'block': block_a,
                'category': category_objs['Yemekhane'],
                'room_number': 'Sosyal Tesis',
                'title': 'Akşam Menüsü Porsiyon ve Çorba Sıcaklığı',
                'description': 'Akşam yemekhanesinde çorba oldukça ılıktı, ısıtıcı tezgaha dikkat edilmesi rica olunur.',
                'status': 'RESOLVED',
                'priority': 'LOW',
                'assigned_to': manager_user,
                'resolution_note': 'Yemekhane şefine ve servis personeline gerekli uyarı yapıldı, benmari derecesi yükseltildi.',
                'resolved_at': timezone.now() - datetime.timedelta(days=1)
            }
        ]

        for comp_data in sample_complaints:
            Complaint.objects.get_or_create(
                student=comp_data['student'],
                title=comp_data['title'],
                defaults=comp_data
            )
        self.stdout.write(self.style.SUCCESS("[OK] Ornek sikayetler olusturuldu."))

        # 5. Duyurular
        announcements_data = [
            {
                'author': manager_user,
                'block': None,
                'title': '2024-2025 Eğitim-Öğretim Yılı Güz Dönemi Yemekhane Saatleri',
                'content': 'Sabah Kahvaltısı: 07:00 - 10:30, Akşam Yemeği: 16:30 - 22:30 saatleri arasında Sosyal Tesis Yemekhanemizde servis edilecektir. Öğrencilerimizin kimlik kartlarını ibraz etmeleri gerekmektedir.',
                'category': 'Yemekhane',
                'is_urgent': False
            },
            {
                'author': manager_user,
                'block': block_b,
                'title': 'B Blok Kalorifer Tesisatı Periyodik Bakımı',
                'content': '28 Ekim Pazartesi günü 13:00 - 16:00 saatleri arasında B Blok genelinde kalorifer petek havası alma ve basınç testi gerçekleştirilecektir. Odalarda vanaların kapalı tutulmaması önemle duyurulur.',
                'category': 'Bakım/Arıza',
                'is_urgent': False
            },
            {
                'author': manager_user,
                'block': None,
                'title': 'Acil: Deprem ve Yangın Tahliye Tatbikatı Bilgilendirmesi',
                'content': 'İl Afet ve Acil Durum Müdürlüğü (AFAD) koordinesinde yarın saat 15:00\'te tüm bloklarımızda siren sesi eşliğinde eşzamanlı tatbikat icra edilecektir. Sakin kalıp acil çıkış yönlendirmelerine uyunuz.',
                'category': 'Acil',
                'is_urgent': True
            }
        ]

        for ann_data in announcements_data:
            Announcement.objects.get_or_create(
                title=ann_data['title'],
                defaults=ann_data
            )
        self.stdout.write(self.style.SUCCESS("[OK] Duyurular olusturuldu."))

        # 6. Yemekhane Menüsü
        today = timezone.now().date()
        CafeteriaMenu.objects.get_or_create(
            date=today,
            meal_type='DINNER',
            defaults={
                'soup': 'Ezogelin Çorbası',
                'main_course': 'Orman Kebabı & Patates Püresi',
                'side_dish': 'Şehriyeli Pirinç Pilavı',
                'extra': 'Mevsim Salata & Ayran / Kemalpaşa Tatlısı',
                'calories': 885,
                'rating': 4.8,
                'review_count': 168
            }
        )

        CafeteriaMenu.objects.get_or_create(
            date=today + datetime.timedelta(days=1),
            meal_type='DINNER',
            defaults={
                'soup': 'Süzme Mercimek Çorbası',
                'main_course': 'Tavuk Sote (Köz Biberli)',
                'side_dish': 'Bulgur Pilavı',
                'extra': 'Cacık & Meyve (Elma)',
                'calories': 820,
                'rating': 4.6,
                'review_count': 94
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Yemekhane menuleri olusturuldu."))

        self.stdout.write(self.style.SUCCESS("Tum baslangic verileri basariyla sisteme aktarildi!"))

