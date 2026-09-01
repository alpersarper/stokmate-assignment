[English](README.md) | **Türkçe**

# StokMate

Take-home projesi: verilen StokMate .NET API'si üzerinde iki istemci — genel merkezin ürün yönetimi için bir **web admin paneli** ve mağaza personelinin kullandığı, müşteri uygulaması gibi tasarlanmış bir **mobil uygulama** (birincil iş akışı: stok güncelleme). İki istemci, framework bağımsız tek bir TypeScript API/auth çekirdeğini paylaşır. Backend, verilen API artı üç küçük ve belgelenmiş değişikliktir.

**Değerlendirici raporları** (mimari, kararlar, backend değişiklikleri, yapay zekâ destekli süreç) GitHub Pages'te yayında — bkz. [Değerlendirici raporları](#değerlendirici-raporları).

## Hızlı başlangıç

**1. Backend** (.NET SDK 8.0+ gerektirir):

```bash
cd api/StokMate
dotnet run --project src/StokMate.Api
```

→ `http://localhost:5080` (Swagger: `/swagger`). Backend in-memory çalışır: her yeniden başlatma veriyi baştan seed'ler ve tüm oturumları geçersiz kılar.

**2. Web admin paneli** (Node.js ≥ 20 gerektirir; yeni bir terminalde, repo kökünde):

```bash
npm install
npm run dev:web
```

→ `http://localhost:5173`.

**3. Mobil** (çalışan bir Android emülatörü; JDK 17 + Android SDK gerektirir):

```bash
cd mobile
npx expo run:android
```

İlk çalıştırma native debug build'ini derleyip emülatöre kurar, ardından Metro'yu başlatır. Sonrasında yalnızca JS değişiyorsa repo kökünde `npm run dev:mobile` çalıştırıp kurulu uygulamayı açmak yeterli. JDK 17 varsayılanınız değilse `JAVA_HOME`'u ona ayarlayın. Emülatör, host'taki backend'e varsayılan `http://10.0.2.2:5080` adresinden erişir; fiziksel cihaz için `EXPO_PUBLIC_API_URL=http://<lan-ip>:5080` verin (aynı Wi-Fi ağında).

**Test kullanıcısı** (assignment'ın bilinçli olarak sağladığı, yalnızca test amaçlı hesap):
e-posta `test@ornek.com` · parola `Test1234!`

## APK

Teslim edilen APK bir GitHub Release olarak yayında — asset `stokmate-v1.0.0-release.apk`, nihai commit [`bd443f2`](https://github.com/alpersarper/stokmate-assignment/commit/bd443f237867a07f07f50548679439c3d24c8d07)'den build edildi, SHA-256 `becd9fa9c4f2f70a93bf2dd3b976075e8c90fc5cffd77de418008b58744b4284`, 77.824.168 bayt:

**[Release `v1.0.0` →](https://github.com/alpersarper/stokmate-assignment/releases/tag/v1.0.0)**

Teslim edilen APK hakkında bilinmesi gerekenler:

- **Build**: Release varyantı — applicationId `com.stokmate.app`, debuggable değil, Gradle debug keystore ile imzalı (assignment düzeyinde bir anahtar, dağıtım anahtarı değil).
- **API hedefi**: `http://10.0.2.2:5080`, **build sırasında sabitlenir**. `10.0.2.2`, Android emülatörünün host makine için kullandığı adrestir; backend'i o makinede çalıştırın ve APK'yı aynı makinedeki bir emülatöre kurun. Hosted bir backend yok.
- Yayımlanan asset, yayına alınmadan önce tek başına uçtan uca doğrulandı (12 maddelik matris, `docs/IMPLEMENTATION_REPORT.md`); release sayfası kendi SHA-256'sını ve kaynak commit'ini belirtir.
- Yeniden üretmek (veya URL'yi değiştirip fiziksel bir cihaza hedeflemek) için:

  ```bash
  cd mobile
  CI=1 npx expo prebuild --platform android --clean
  cd android
  JAVA_HOME=<jdk-17-yolu> EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 ./gradlew assembleRelease
  # → app/build/outputs/apk/release/app-release.apk
  ```

- Backend düz HTTP kullandığı için Android'de cleartext trafiğe izin verildi (`expo-build-properties`).

## Projeye genel bakış

```
api/StokMate/   verilen .NET 8 API (in-memory) + 3 belgelenmiş değişiklik
shared/         framework bağımsız TS: tipler, API client, query key'ler, yardımcılar
web/            Vite + React admin paneli (Tailwind + shadcn/ui)
mobile/         Expo (managed) + React Native müşteri uygulaması
docs/           kontratlar, kararlar, QA raporu, değerlendirici raporları (docs/reviewer/)
```

## Neler yapıldı

### Web admin paneli

- Zorunlu kapsamın tamamı: login/oturum, arama ve kategori/marka/**durum** filtreleri olan yoğun ürün tablosu, sunucu tarafında başlık sıralaması, pagination — liste state'inin tamamı URL'de yaşar.
- Korumalı düzenleme formuyla ürün detayı: taze bir read üzerine kurulan kayıpsız full-object PUT, doğrulanmış API kurallarını birebir uygulayan inline validasyon, kaydedilmemiş değişiklik uyarısı.
- Veri tazeliği: "X önce güncellendi" göstergesi, cooldown korumalı manuel yenileme ve son fetch'in bitişine göre hizalanan 15 saniyelik polling — diğer istemcilerin değişiklikleri sayfa yenilemeden görünür (opsiyonel bonus).
- Eksiksiz loading/hata/boş durumları, kuyruğa alınan toast'lar, EN/TR arayüz.

→ Ayrıntılı rapor: [Web admin mimarisi](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html?lang=tr)

### Mobil

- Zorunlu kapsamın tamamı, ürünleşmiş bir müşteri uygulaması olarak: login (secure storage ile "beni hatırla"), sunucu tarafında arama/filtre/sıralama ve infinite scroll içeren ürün listesi, detay ekranı ve **stok güncelleme akışı** (taslak tabanlı editör, stepper'lar, validasyon, sunucu yanıtıyla teyitli kayıt).
- Discontinued ürünlerde stok editörü kilitlenir; backend de bunu 409 ile uygular — stale veriyle çalışan bir istemci Discontinued bir ürüne stok yazamaz.
- Pull-to-refresh, tazelik göstergesi, korumalı manuel yenileme ve detay ekranında 10 saniyelik polling — hepsi tek bir koordineli yenileme hattında.
- Elle tasarlanmış görsel sistem (UI kit yok), kuyruğa alınan snackbar'lar, eksiksiz EN/TR.

→ Ayrıntılı rapor: [Mobil mimari](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html?lang=tr)

### Backend

- **Verilen**: API yüzeyinin tamamı — auth (opak token'lar, 15 dakikalık access / 7 günlük rotating refresh), ürün listeleme/arama/filtre/sıralama/pagination, full-replace PUT güncellemesi, ayrı stok PATCH endpoint'i, lookup'lar, seed verisi, hata konvansiyonları. Doğrulanmış davranış `docs/API_CONTRACT.md` dosyasında kayıtlı.
- **Proje sırasında değiştirilen** (her biri minimal, belgelenmiş ve runtime'da doğrulanmış):
  1. `GET /products/{id}` eklendi — orijinal backend'de ürünü id ile okuyan bir endpoint yoktu; oysa full-replace PUT, hiçbir read endpoint'inin döndürmediği üç alanı zorunlu tutuyordu (kanıtlanmış bir sessiz veri kaybı tuzağı).
  2. **Discontinued** ürünlerde stok güncellemesi `409` ile reddedilir — stale istemcilere karşı sunucu tarafı koruma.
  3. Ürün read'lerine rate limit (token başına 60 istek / 10 saniye → `429`) — yenileme/polling özelliği için backend tarafında bağımsız bir sınır.

→ Ayrıntılı rapor: [Backend mimarisi ve değişiklikler](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html?lang=tr)

## Temel kararlar

| Karar | Neden |
| --- | --- |
| npm workspaces monorepo | Tek kurulum, tek bağımlılık ağacı; üç paketin ihtiyacı script, build grafiği değil. |
| Tek server-state katmanı olarak TanStack Query | Uygulama neredeyse tamamen server state; query key + invalidation, global bir store ihtiyacını ortadan kaldırıyor. |
| Framework bağımsız `shared/` çekirdeği | Wire formatı ve auth/refresh/hata akışı iki istemci için tek bir yerde, bir kez yazıldı. |
| Merkezî single-flight 401 → refresh → retry | Katı token rotasyonunda eşzamanlı refresh istekleri oturumu düşürür; reaktif kurtarma, süre tahminine dayalı timer'lardan daha güvenilir. |
| Web'de shadcn/ui + Tailwind | Repoya kopyalanan, incelenebilir primitive'ler; operasyonel bir admin arayüzü için küçük bağımlılık yüzeyi. |
| Mobilde elle tasarlanmış UI (kit yok) | Dört ekran; işin zor kısmı (kuyruğa alınan snackbar'lar) kit kullanılsa da özel kod gerektiriyordu. |
| Expo managed + yerel Gradle APK | Belgelenmiş komutlarla offline tekrarlanabilir; cloud build hesabı gerekmez. |
| EN/TR, varsayılan İngilizce, her yerde TRY | İki dil için tipli mesaj katalogları yeterli; para birimi veridir, asla dönüştürülmez. |

Alternatifler ve trade-off'larla birlikte tam gerekçe: [Mühendislik kararları](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html?lang=tr).

## Geliştirme süreci

- Gereksinimler, UX kararları ve kabul kriterleri implementasyondan önce `docs/` altında yazıldı ve bağlayıcı kontrat olarak kullanıldı.
- Önce backend'in gerçek davranışı runtime'da doğrulandı; istemciler varsayımlara değil, kayıt altına alınan kontrata (`docs/API_CONTRACT.md`) göre geliştirildi.
- İmplementasyonu, araştırmayı, QA'i ve dokümantasyonu — kararların sahipliği insanda kalmak üzere — yapay zekâ ajanları yürüttü; her PR merge edilmeden önce insan tarafından incelendi. Bkz. [Yapay zekâ destekli geliştirme süreci](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html?lang=tr).
- Doğrulama, otomatik kontrolleri (TypeScript, lint, unit + canlı kontrat testleri, build'ler) tarayıcı, emülatör ve nihai release APK'sı üzerindeki gerçek backend akışlarıyla birleştirdi (bağımsız `curl` geri okumaları dâhil).
- Doğrulanmış güncel durum: `docs/IMPLEMENTATION_REPORT.md`.

## Varsayımlar

### Ortam ve API gerçekleri

- **In-memory backend**: yeniden başlatma veriyi ve tüm oturumları siler; refresh başarısız olduğunda istemciler login ekranına döner.
- **Last-write-wins**: API'de bir concurrency mekanizması yok (doğrulandı); risk yalnızca UX düzeyinde azaltıldı (düzenlemeden önce taze read, mutation yanıtının kanonik kabulü, hedefli yenileme). Discontinued-stok 409'u bir domain kuralıdır, versiyon kontrolü değil.
- **Tek değerli filtreler** (bir kategori, bir marka) — API çoklu seçim desteklemiyor.
- **Arama/sıralama collation'ı sunucuda belirlenir** (Türkçe i/ı ayrımı backend host'un locale'ine bağlıdır); girdi olduğu gibi iletilir.
- Verilen domain dokümantasyonu gereği **TRY (₺)**; tam sayı kuruş aritmetiğiyle, para birimi açık yazılarak gösterilir.
- Arayüz varsayılanı İngilizce, çalışma anında EN/TR geçişi var; API verisi (ürün/marka adları) hiçbir zaman çevrilmez.

### Ürün tasarımı kararları

Assignment'ın davranışı açık bıraktığı noktalarda bilinçli tercihler yapıldı; gerekçelerin tamamı [`docs/DECISIONS.md`](docs/DECISIONS.md), UX ve wire seviyesindeki sınırlar ise [`docs/UX_DECISIONS.md`](docs/UX_DECISIONS.md) ile [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) dosyalarındadır.

- **Operasyonel durum sınırı**: stale mağaza istemcilerini korumak için Discontinued üründe stok işlemi kapalıdır (`409` + mobilde kilit); Passive düzenlenebilir kalır, Discontinued da listelenmeye ve stok dışındaki alanlarıyla düzenlenmeye devam eder — görünürlük ve durum yönetimi bilinçli olarak kısıtlanmadı.
- **Kitleye göre varsayılanlar**: mobil, mağaza personeli için Active ürünlerle; web, genel merkez gözetimi için All (tüm durumlar) ile açılır. İki taraf da bütün durum seçeneklerini sunar.
- **Kayıpsız detay okuması**: full-replace PUT hiçbir read'in döndürmediği alanları gerektirdiği için yalnızca `GET /products/{id}` eklendi; değer tahmin edilmedi, liste DTO'su genişletilmedi, PUT semantiği değiştirilmedi.
- **Read'lere özel rate limit**: üç ürün GET'i, authorization değeri başına (yoksa IP) 60 istek/10 saniyelik ortak bir bütçe paylaşır; auth, lookup ve yazma işlemleri kapsam dışı — olağan yenileme/polling bundan etkilenmez.
- **Doğrulanmış düşük stok semantiği**: düşük stok vurgusu API'nin `minStock` sinyalini izler; aynı domain kuralı iki istemcide de aynı görünür, istemciye özel bir eşik uydurulmadı.
- **Realtime olmadan tazelik**: koordineli polling/refetch, tek veri yolunu korurken istemciler arası değişiklikleri makul sürede görünür kılar; WebSocket/SSE ya da ikinci bir senkronizasyon sistemi eklenmedi.

## Başlıca kütüphaneler

- **Web**: Vite + React + TypeScript (strict) — SPA araç zinciri; React Router — route'lar + URL'deki liste state'i; TanStack Query v5 — server state; react-hook-form — form alanları ve validasyon; Tailwind CSS v4 + shadcn/ui — repoya kopyalanan UI primitive'leri; sonner — kuyruğa alınan toast'lar.
- **Mobil**: Expo (managed) + React Native + TypeScript; React Navigation (native stack); TanStack Query v5; expo-secure-store — token saklama; expo-build-properties — cleartext HTTP izni; expo-dev-client — dev build araçları (release'te etkisiz, doğrulandı).
- **Backend**: verilen .NET 8 + EF Core InMemory temeli; yukarıda belgelenen üç dar ekleme — ürün read'lerindeki `System.Threading.RateLimiting` dâhil.
- **Shared/test**: Vitest — unit + canlı kontrat testleri; ESLint v9 + Prettier.

## Notlar

- Realtime kanal yok (WebSocket/SSE) — istemciler arası tutarlılık, bilinçli bir tercih olarak polling + koordineli yenilemeyle sağlanır; raporların tazelik bölümlerine bakın.
- **Senior review bulguları çözüldü**: YÜKSEK öncelikli mobil pagination bulgusu giderildi — pagination artık fiziksel hareket başına bir kez tetiklenmeye hazırlanır (yalnızca drag başlangıcında; momentum yeniden hazırlamaz) ve ağ kayıtları, arama/filtre/sıralama kombinasyonlarında drag/fling başına tek istek davranışını yeniden doğruladı. Stok sıralamasındaki cache-sırası sınırlaması ise bilinçli olarak kabul edildi: güncellenen stok değeri doğrudur, normal bir yenileme kanonik sıralamayı geri getirir. Bkz. `docs/IMPLEMENTATION_REPORT.md`.
- Teslim edilen APK'nın API hedefi build sırasında sabitlenir; farklı bir hedef için belgelenmiş komutlarla yeniden build gerekir.
- Altyapı assignment ölçeğinde tutuldu: CI pipeline'ı veya E2E framework'ü yok — doğrulama, script'lenmiş kontroller artı `docs/IMPLEMENTATION_REPORT.md` içinde kayıtlı QA sürecidir.
- Doğrulama komutları: `npm run typecheck`, `npm run lint`, `npm run test` (offline unit), `npm run test:live --workspace shared` (çalışan backend'e karşı), `npm run build:web`.

## Değerlendirici raporları

GitHub Pages'te yayında; her raporun başlığında bir **EN / TR** anahtarı var:

| Rapor | Bağlantı |
| --- | --- |
| **Teknik genel bakış** (buradan başlayın) | [alpersarper.github.io/stokmate-assignment/reviewer](https://alpersarper.github.io/stokmate-assignment/reviewer/?lang=tr) |
| Web admin mimarisi | [frontend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html?lang=tr) |
| Mobil mimari | [mobile-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html?lang=tr) |
| Backend mimarisi ve değişiklikler | [backend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html?lang=tr) |
| Mühendislik kararları | [development-decisions.html](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html?lang=tr) |
| Yapay zekâ destekli geliştirme süreci | [agent-workflow-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html?lang=tr) |

Aynı raporlar [`docs/reviewer/`](docs/reviewer/) altında offline olarak da mevcut — her sayfa kendi başına yeterli, klondan doğrudan açılabilen tek bir HTML dosyasıdır.
