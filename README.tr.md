[English](README.md) | **Türkçe**

# StokMate

Değerlendirme projesi: verilen StokMate .NET API'si üzerine kurulu iki istemci — genel merkez için bir **web yönetim paneli** ve mağaza personeli için **müşteriye dönük bir mobil uygulama** (birincil akış stok güncelleme). İkisi de framework'ten bağımsız tek bir TypeScript API/auth çekirdeğini paylaşır. Backend, verilen API'nin kendisi artı üç küçük ve belgelenmiş değişikliktir.

**Değerlendirici derin analizleri** (mimari, kararlar, backend değişiklikleri, yapay zekâ destekli süreç) GitHub Pages üzerinde yayımlanıyor — bkz. [Değerlendirici derin analizleri](#değerlendirici-derin-analizleri).

## Hızlı başlangıç

**1. Backend** (.NET SDK 8.0+ gerekir):

```bash
cd api/StokMate
dotnet run --project src/StokMate.Api
```

→ `http://localhost:5080` (Swagger: `/swagger`). Bellek içi çalışır: her yeniden başlatma veriyi yeniden seed'ler ve tüm oturumları geçersiz kılar.

**2. Web yönetim paneli** (Node.js ≥ 20 gerekir; yeni bir terminalde, depo kökünde):

```bash
npm install
npm run dev:web
```

→ `http://localhost:5173`.

**3. Mobil** (çalışan bir Android emülatörü; JDK 17 + Android SDK gerekir):

```bash
cd mobile
npx expo run:android
```

İlk çalıştırma native debug uygulamasını derleyip kurar, ardından Metro'yu başlatır; sonraki JS-only iterasyonlar için depo kökünde `npm run dev:mobile` ve kurulu uygulamayı açmak yeterlidir. JDK 17 varsayılanınız değilse `JAVA_HOME`'u ona ayarlayın. Emülatör host'taki backend'e varsayılan `http://10.0.2.2:5080` üzerinden ulaşır; fiziksel cihazda `EXPO_PUBLIC_API_URL=http://<lan-ip-adresiniz>:5080` verin (aynı Wi-Fi).

**Test kullanıcısı** (assignment tarafından bilinçli olarak verilmiştir, yalnızca test amaçlı):
e-posta `test@ornek.com` · parola `Test1234!`

## APK

**[Güncel Release APK'yı indir →](https://github.com/alpersarper/stokmate-assignment/releases/tag/v1.0.0)** (GitHub Release `v1.0.0`)

- **Build**: Release — `stokmate-v1.0.0-release.apk`, applicationId `com.stokmate.app`, debuggable değil, Gradle debug keystore ile imzalı (assignment düzeyinde).
- **SHA-256**: `a004fa9c04fa42f469073dbf256cad4a2335e73e4fadeaede3dde904ea081290` (77.824.176 bayt).
- **Kaynak**: `339d00c` commit'i — uygulama kaynağını değiştiren son commit; `main` üzerinde ondan sonrası yalnızca dokümantasyon.
- **API hedefi**: `http://10.0.2.2:5080`, **build sırasında sabitlenir**. `10.0.2.2`, Android emülatörünün host makineye verdiği adrestir; dolayısıyla backend'i o makinede çalıştırın ve APK'yı yine aynı makinedeki bir emülatöre kurun. Barındırılan (hosted) bir backend yoktur.
- Yayımlanmadan önce tek başına uçtan uca doğrulandı (12 maddelik matris, `docs/IMPLEMENTATION_REPORT.md`); yayımlanan dosya, doğrulamayı geçen artefaktla bayt bayt aynıdır.
- Yeniden üretmek (veya URL'yi değiştirip fiziksel cihaza yöneltmek) için:

  ```bash
  cd mobile
  CI=1 npx expo prebuild --platform android --clean
  cd android
  JAVA_HOME=<jdk-17-yolu> EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 ./gradlew assembleRelease
  # → app/build/outputs/apk/release/app-release.apk
  ```

- Backend düz HTTP konuştuğu için Android cleartext trafiği açık (`expo-build-properties`).

## Proje bir bakışta

```
api/StokMate/   verilen .NET 8 API (bellek içi) + 3 belgelenmiş değişiklik
shared/         framework'ten bağımsız TS: tipler, API client, query key'ler, yardımcılar
web/            Vite + React yönetim paneli (Tailwind + shadcn/ui)
mobile/         Expo (managed) + React Native müşteri uygulaması
docs/           kontratlar, kararlar, QA raporu, değerlendirici raporları (docs/reviewer/)
```

## Neler yapıldı

### Web yönetim paneli

- Zorunlu kapsamın tamamı: giriş/oturum, arama içeren yoğun ürün tablosu, kategori/marka/**durum** filtreleri, sunucu tarafı başlık sıralaması, sayfalama — tüm liste state'i URL'de tutulur.
- Korumalı düzenleme formu içeren ürün detayı: taze bir okumadan kurulan kayıpsız tam nesne PUT'u, doğrulanmış API kurallarını birebir yansıtan satır içi doğrulama, kaydedilmemiş değişiklik koruması.
- Veri tazeliği: "X önce güncellendi" göstergesi, bekleme süresiyle korunan manuel yenileme ve son fetch'in tamamlanmasına sabitlenen 15 sn'lik polling (başka istemcilerin değişiklikleri sayfa yenilenmeden görünür — opsiyonel bonus).
- Eksiksiz yükleniyor/hata/boş durumları, sıraya alınan toast'lar, EN/TR arayüz.

→ Derin analiz: [Web yönetim paneli mimarisi](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html?lang=tr)

### Mobil

- Zorunlu kapsamın tamamı, ürünleşmiş bir müşteri uygulaması olarak: giriş (güvenli depolama ile "beni hatırla"), sunucu tarafı arama/filtre/sıralama ve sonsuz kaydırma içeren ürün listesi, detay ekranı ve **stok güncelleme akışı** (taslak tabanlı editör, artır/azalt kontrolleri, doğrulama, sunucudan teyitli kayıt).
- Discontinued ürünlerde stok editörü kilitlenir (ve backend bunu 409 ile zorunlu kılar — eski veriyle çalışan bir istemci Discontinued bir ürüne stok işleyemez).
- Aşağı çekip yenileme, tazelik göstergesi, korumalı manuel yenileme ve detayda 10 sn'lik polling — hepsi tek bir koordineli yenileme hattında.
- Elle yazılmış görsel sistem (UI kit yok), sıraya alınan snackbar'lar, tam EN/TR.

→ Derin analiz: [Mobil mimari](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html?lang=tr)

### Backend

- **Verilen**: API yüzeyinin tamamı — auth (opak token'lar, 15 dk access / 7 gün rotasyonlu refresh), ürün listeleme/arama/filtre/sıralama/sayfalama, tam değiştiren PUT güncellemesi, ayrı stok PATCH'i, lookup'lar, seed verisi, hata kuralları. Doğrulanmış davranış `docs/API_CONTRACT.md` içinde kayıtlı.
- **Proje sırasında değiştirilen** (her biri minimal, belgelenmiş ve çalışır durumda doğrulanmış):
  1. `GET /products/{id}` eklendi — özgün backend'de ürünü id ile okuyan bir uç yoktu, ancak tam değiştiren PUT hiçbir okuma ucunun döndürmediği üç alanı zorunlu tutuyordu (kanıtlanmış bir sessiz veri kaybı tuzağı).
  2. **Discontinued** ürünlerde stok güncellemesi `409` ile reddediliyor — eski veriyle çalışan istemcilere karşı sunucu tarafı koruma.
  3. Ürün okumalarında rate limiting (token başına 60 istek / 10 sn → `429`) — yenileme/polling özelliği için bağımsız bir backend sınırı.

→ Derin analiz: [Backend mimarisi ve değişiklikler](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html?lang=tr)

## Temel kararlar

| Karar | Gerekçe |
| --- | --- |
| npm workspaces monorepo | Tek kurulum, tek bağımlılık ağacı; üç paketin ihtiyacı script'ler, build grafiği değil. |
| Tek sunucu-state katmanı olarak TanStack Query | Uygulama neredeyse tamamen sunucu state'i; query key'ler + invalidation her global store'un yerini tutuyor. |
| Framework'ten bağımsız `shared/` çekirdek | Wire formatı ile auth/refresh/hata mekaniği iki istemci için tam olarak bir kez yazıldı. |
| Merkezî, single-flight 401 → refresh → retry | Katı token rotasyonunda eşzamanlı refresh ölümcül; tepkisel kurtarma, süre sayan zamanlayıcılardan üstün. |
| Web'de shadcn/ui + Tailwind | Depoya kopyalanan, okunabilir primitive'ler; operasyonel bir yönetim paneli için küçük bağımlılık yüzeyi. |
| Elle yazılmış mobil arayüz (kit yok) | Dört ekran; işin zor kısmı (sıraya alınan snackbar'lar) bir kit ile de özel kod gerektiriyordu. |
| Expo managed + yerel Gradle APK | Belgelenmiş komutlarla, çevrimdışı ve tekrarlanabilir; bulut build hesabı gerekmiyor. |
| EN/TR, varsayılan İngilizce, her yerde TRY | İki dil için tipli mesaj katalogları yeterli; para birimi veridir, hiçbir zaman çevrilmez. |

Alternatifler ve ödünleşimlerle birlikte tam gerekçe: [Mühendislik kararları](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html?lang=tr).

## Geliştirme süreci

- Gereksinimler, UX kararları ve kabul ölçütleri implementasyondan önce `docs/` altında yazıya döküldü ve bağlayıcı kontrat olarak ele alındı.
- Backend'in gerçek davranışı önce çalışır durumda doğrulandı; istemciler varsayımlara göre değil, kayıt altına alınan kontrata (`docs/API_CONTRACT.md`) göre yazıldı.
- İnsan sahipliğindeki kararlar altında implementasyonu, araştırmayı, QA'i ve dokümantasyonu yapay zekâ ajanları yürüttü; her PR merge öncesi insan tarafından incelendi — bkz. [Yapay zekâ destekli geliştirme süreci](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html?lang=tr).
- Doğrulama, otomatik kontrolleri (TypeScript, lint, birim + canlı kontrat testleri, build'ler) tarayıcıdaki, emülatördeki ve nihai release APK'sındaki gerçek backend akışlarıyla birleştirdi (bağımsız `curl` geri okumaları dâhil).
- Doğrulanmış güncel durum `docs/IMPLEMENTATION_REPORT.md` içinde.

## Varsayımlar

### Ortam ve API gerçekleri

- **Bellek içi backend**: yeniden başlatma veriyi ve tüm oturumları siler; refresh başarısız olduğunda istemciler giriş ekranına döner.
- **Son yazan kazanır**: API'de eşzamanlılık mekanizması yok (doğrulandı); yalnızca UX düzeyinde hafifletildi (taze okumayla düzenleme, kanonik mutation yanıtları, hedefli yenileme). Discontinued-stok 409'u bir alan kuralıdır, sürüm kontrolü değil.
- **Tek değerli filtreler** (bir kategori, bir marka) — API'de çoklu seçim yok.
- **Arama/sıralama karşılaştırması sunucu tarafından belirlenir** (Türkçe i/ı davranışı backend host'unun locale'ini izler); girdi olduğu gibi geçirilir.
- Verilen alan dokümantasyonu uyarınca **TRY (₺)**; tam sayı kuruş aritmetiğiyle açıkça biçimlendirilir.
- Varsayılan arayüz dili İngilizce, çalışma zamanında EN/TR anahtarı var; API verisi (ürün/marka adları) hiçbir zaman çevrilmez.

### Ürün tasarımı inisiyatifleri

Bunlar ödevin davranışı açık bıraktığı noktalarda alınan bilinçli kararlardır; gerekçelerin tamamı [`docs/DECISIONS.md`](docs/DECISIONS.md), UX ve wire-level sınırlar ise [`docs/UX_DECISIONS.md`](docs/UX_DECISIONS.md) ile [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) içindedir.

- **Operasyonel durum sınırı**: eski veriyle çalışan mağaza istemcilerini korumak için Discontinued durumunda stok terminaldir (`409` ve mobil kilit); Pasif değiştirilebilir, Discontinued ise listelenebilir ve diğer yönleriyle düzenlenebilir kalır çünkü görünürlük ve durum yönetimi bilinçli olarak kısıtlanmadı.
- **Kitleye özgü varsayılanlar**: mobil mağaza çalışanları için Aktif ürünlerle, web ise genel müdürlük gözetimi için Tüm durumlarla açılır; iki yüzey de bütün durum seçeneklerini sunmaya devam eder.
- **Kayıpsız detay okuması**: tümünü değiştiren PUT, hiçbir okumanın döndürmediği alanları gerektirdiği için yalnızca `GET /products/{id}` eklendi; değerler tahmin edilmedi, liste DTO'su genişletilmedi ve PUT semantiği değiştirilmedi.
- **Bağımsız okuma hız sınırı**: üç ürün GET'i authorization değeri başına 60 istek/10 saniyelik ortak bütçe kullanır (fallback: IP); auth, lookup ve yazmalar kapsam dışıdır, dolayısıyla olağan yenileme/polling etkilenmez.
- **Doğrulanmış düşük stok semantiği**: aynı alan kuralını iki istemcide de göstermek için vurgu API'nin `minStock` sinyalini izler; yalnızca istemcide yaşayan bir eşik uydurulmadı.
- **Realtime olmadan tazelik**: koordineli polling/refetch, tek veri yolunu korurken istemciler arası değişiklikleri makul sürede görünür kılar; WebSocket/SSE veya ikinci bir senkronizasyon sistemi eklenmedi.

## Başlıca kütüphaneler

- **Web**: Vite + React + TypeScript (strict) — SPA araç zinciri; React Router — route'lar + URL liste state'i; TanStack Query v5 — sunucu state'i; react-hook-form — alan kaydı ve doğrulama; Tailwind CSS v4 + shadcn/ui — depoya kopyalanan UI primitive'leri; sonner — sıraya alınan toast'lar.
- **Mobil**: Expo (managed) + React Native + TypeScript; React Navigation (native stack); TanStack Query v5; expo-secure-store — token saklama; expo-build-properties — cleartext HTTP bayrağı; expo-dev-client — dev build araçları (release'de etkisiz, doğrulandı).
- **Backend**: verilen .NET 8 + EF Core InMemory temeli; yukarıda belgelenen üç dar ek, ürün okumalarındaki `System.Threading.RateLimiting` dâhil.
- **Shared/test**: Vitest — birim + canlı kontrat testleri; ESLint v9 + Prettier.

## Notlar

- Realtime kanal yok (WebSocket/SSE) — istemciler arası tutarlılık tasarım gereği polling + koordineli yenileme ile sağlanıyor; raporların tazelik bölümlerine bakın.
- **Açık kıdemli inceleme bulgusu**: sürükleme ve momentum sayfalamayı ayrı ayrı tetiklediği için tek bir mobil sürükleme/savurma şu anda birden fazla sayfa isteyebilir; ürün kodu düzeltilene veya açıkça kabul edilene kadar onay beklemede. Stok sıralı cache satırlarının değeri de yenilenir ama sırası refresh'e kadar değişmez. Bkz. `docs/IMPLEMENTATION_REPORT.md`.
- Teslim edilen APK'nın API hedefi build sırasında sabitlenir; farklı bir hedef belgelenmiş yeniden build'i gerektirir.
- Assignment odaklı altyapı: CI hattı veya E2E framework'ü yok — doğrulama, script'lenmiş kontroller artı `docs/IMPLEMENTATION_REPORT.md` içinde kayıtlı QA sürecidir.
- Doğrulama komutları: `npm run typecheck`, `npm run lint`, `npm run test` (çevrimdışı birim), `npm run test:live --workspace shared` (çalışan backend'e karşı), `npm run build:web`.

## Değerlendirici derin analizleri

GitHub Pages üzerinde yayımlanıyor (her raporun kendi EN/TR anahtarı var):

| Rapor | Bağlantı |
| --- | --- |
| **Teknik genel bakış** (buradan başlayın) | [alpersarper.github.io/stokmate-assignment/reviewer](https://alpersarper.github.io/stokmate-assignment/reviewer/?lang=tr) |
| Web yönetim paneli mimarisi | [frontend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html?lang=tr) |
| Mobil mimari | [mobile-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html?lang=tr) |
| Backend mimarisi ve değişiklikler | [backend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html?lang=tr) |
| Mühendislik kararları | [development-decisions.html](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html?lang=tr) |
| Yapay zekâ destekli geliştirme süreci | [agent-workflow-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html?lang=tr) |

Aynı raporlar çevrimdışı olarak [`docs/reviewer/`](docs/reviewer/) altında da bulunuyor — her sayfa kendi kendine yeten, bir klondan doğrudan açılabilen tek bir HTML dosyası.
