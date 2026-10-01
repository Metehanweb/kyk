# Kırşehir Mucur Elvin Buğra Arslan Öğrenci Yurdu Bütünleşik İletişim ve Operasyon Platformu

Bu proje, Kırşehir'in Mucur ilçesinde yer alan GSB'ye bağlı **Elvin Buğra Arslan Öğrenci Yurdu** için geliştirilmiş tam yığın (full-stack) web tabanlı arıza, şikayet, yemekhane ve duyuru yönetim sistemidir.

Platform; mimari şartnameye ve modern Stitch arayüz tasarımlarına birebir sadık kalınarak, **mobile-first (mobil öncelikli)** ve **sıfır test verisi** ile gerçek kullanım için hazır olarak yapılandırılmıştır.

---

## 🏛️ Mimari ve Teknoloji Yığını

- **Backend Hibrit Mimarisi:**
  - **Django 5.2 (ORM & Admin):** Veri modellemesi, PostgreSQL migrasyonları ve admin altyapısı.
  - **FastAPI 0.141 (Asenkron REST API):** Pydantic v2 veri doğrulama, OAuth2PasswordBearer JWT kimlik doğrulama, `sync_to_async` asenkron sarmalayıcıları ile sıfır I/O bloklaması.
- **Veritabanı (PostgreSQL 18):**
  - Tamamen ilişkisel ACID standartlarında PostgreSQL altyapısı (Port: `5433`, DB: `dorm_db`).
  - **Kısmi B-Tree İndeksi:** `idx_complaints_active_partial` (`ON complaint (block_id, created_at DESC) WHERE status = 'PENDING'`) ile beklemedeki şikayetlerde milisaniyelik okuma optimizasyonu.
  - **Kompozit B-Tree İndeksi:** `idx_student_complaints` (`ON complaint (student_id, created_at DESC)`) ile öğrencinin geçmiş bildirimlerini hafıza sıralaması olmadan anında getirme.
- **Frontend Katmanı:**
  - **React 19 + TypeScript + Vite:** Tip güvenli, modüler bileşen mimarisi.
  - **TailwindCSS:** Plus Jakarta Sans & Inter tipografisi, kurumsal lacivert (`#00236f`) ve turkuaz (`#006a61`) tema tonları. Safe-area insets (`pb-safe`, `pt-safe`) ve 100dvh ile mobil cihazlara tam uyum.
  - **AuthContext & Axios Interceptors:** JWT Access token dolduğunda (30 dk) kullanıcıyı oturumdan düşürmeden otomatik yenileyen (Refresh Token) interceptor sistemi.
  - **Rol Tabanlı Erişim Kontrolü (RBAC):** `ADMIN`, `MANAGER`, `STAFF`, `STUDENT`.

---

## 🚀 Tek Tıkla Başlatma (Local Çalıştırma)

Projenin ana dizininde bulunan **`baslat.bat`** dosyasını çift tıklatarak veya terminalden çalıştırarak tüm sistemleri tek seferde başlatabilirsiniz:

```cmd
baslat.bat
```

Bu dosya sırasıyla:
1. PostgreSQL sunucusunu (`port: 5433`) başlatır,
2. FastAPI backend servisini (`http://127.0.0.1:8000`) başlatır,
3. Vite frontend servisini (`http://127.0.0.1:5173`) ayağa kaldırır,
4. Tarayıcınızı otomatik olarak `http://localhost:5173` adresine yönlendirir.

---

## 🔑 Kullanıcı Girişi ve Gerçek Veri Girişi

Sistemde **hiçbir sahte/test verisi bulunmamaktadır**. Tüm şikayetleri, yemekhane menülerini ve duyuruları kendiniz girebilirsiniz.

### 1. Sistem Yöneticisi (Root Admin) Hesabı:
Sistem ilk kurulum için yalnızca yetkili bir yönetici hesabı içermektedir:
- **T.C. Kimlik No :** `11111111110`
- **Şifre          :** `admin123`

### 2. Kendi Hesabınızı Oluşturma (Yeni Kayıt):
Giriş ekranında yer alan **"Yeni Hesap Oluştur"** sekmesini kullanarak dilediğiniz kullanıcıyı anında oluşturabilirsiniz:
- **Öğrenci Hesabı:** Ad soyad, T.C. No, blok, oda numarası ve telefon belirterek kaydolun. Giriş yaptıktan sonra oda arızası açabilir, yemek menüsünü puanlayabilir ve duyuruları takip edebilirsiniz.
- **Yurt Müdürü / İdare:** Yönetim paneline erişebilir, gelen talepleri listeleyebilir, personele iş atayabilir, durum güncelleyebilir ve bloklara özel duyurular yayınlayabilir.
- **Yemekhane Sorumlusu / Personel:** Yemekhane sekmesindeki **"+ Menü Ekle"** butonunu kullanarak günün çorba, ana yemek, yan yemek, tatlı ve kalori bilgilerini sisteme kaydedebilir.

---

## 🌐 Adresler ve Bağlantılar

- **Frontend Web Arayüzü :** [http://localhost:5173](http://localhost:5173)
- **FastAPI Swagger Docs :** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Dokümanı   :** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
