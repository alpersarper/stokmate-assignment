# StokMate API

Stok yönetimi case study'si için hazırlanmış .NET 8 Web API'si.
Veriler bellek içinde tutulur — veritabanı kurulumu, bağlantı ayarı veya migration gerekmez.

## Gereksinim

- **.NET SDK 8.0 veya üzeri**

Proje `net8.0` hedefler, ancak `RollForward` ayarı sayesinde yalnızca .NET 9 veya .NET 10
kurulu olan makinelerde de sorunsuz çalışır. Kurulu sürümü kontrol etmek için:

```bash
dotnet --version
```

## Çalıştırma

Çözüm klasöründe (`StokMate.sln` ile aynı yerde):

```bash
dotnet run --project src/StokMate.Api
```

Tek komut yeterlidir. İlk çalıştırmada paketler indirilir, ardından API açılır ve
örnek veriler otomatik olarak yüklenir.

> Visual Studio veya Rider kullanıyorsanız `StokMate.sln` dosyasını açıp doğrudan
> çalıştırmanız yeterlidir.

### Proje yapısı

```
StokMate/
├── StokMate.sln
├── README.md · API.md
└── src/
    └── StokMate.Api/     → API projesi (Controllers · Services · Data · Auth · Models · Common)
```

| | Adres |
| --- | --- |
| API kökü | `http://localhost:5080` |
| **Swagger arayüzü** | **`http://localhost:5080/swagger`** |
| OpenAPI şeması | `http://localhost:5080/swagger/v1/swagger.json` |

Port `5080` olarak sabitlenmiştir.

## Test kullanıcısı

| E-posta | Şifre |
| --- | --- |
| `test@ornek.com` | `Test1234!` |

`POST /auth/login` ile giriş yapın ve dönen `accessToken` değerini sonraki isteklerde
`Authorization: Bearer <accessToken>` başlığıyla gönderin.

Swagger arayüzünde sağ üstteki **Authorize** düğmesine `accessToken` değerini yapıştırarak
tüm uçları tarayıcıdan deneyebilirsiniz.

## Veri hakkında

- Veriler bellek içi (InMemory) veritabanında tutulur.
- Uygulama her başladığında örnek veri yeniden yüklenir: **80 ürün, 8 kategori, 12 marka, 6 tedarikçi**.
- **Uygulama kapandığında tüm değişiklikler kaybolur.** Eklediğiniz, güncellediğiniz veya
  sildiğiniz kayıtlar kalıcı değildir; API'yi yeniden başlattığınızda başlangıç verisine dönersiniz.
- Ürün görselleri `picsum.photos` üzerinden gelir; görsellerin yüklenmesi için internet bağlantısı gerekir.

## Mobil cihaz / emülatör erişimi

`localhost`, telefonun veya emülatörün **kendisini** işaret eder — geliştirme yaptığınız
bilgisayarı değil. Bu yüzden fiziksel cihazdan veya emülatörden bağlanırken
**makinenizin yerel IP adresini** kullanmanız gerekir.

| Ortam | Kullanılacak adres |
| --- | --- |
| Web (aynı makinede tarayıcı) | `http://localhost:5080` |
| iOS simülatör | `http://localhost:5080` |
| Android emülatör | `http://10.0.2.2:5080` |
| Fiziksel cihaz (iOS / Android) | `http://<MAKINE_IP>:5080` |

Yerel IP adresinizi bulmak için:

- **Windows:** `ipconfig` → "IPv4 Adresi" satırı (örn. `192.168.1.25`)
- **macOS / Linux:** `ifconfig` veya `ip addr`

Örnek: `http://192.168.1.25:5080`

Dikkat edilecekler:

- Cihaz ile bilgisayar **aynı Wi-Fi ağında** olmalıdır.
- API tüm ağ arayüzlerini dinler; sunucu tarafında ek bir ayar yapmanız gerekmez.
- İlk çalıştırmada Windows Güvenlik Duvarı izin isteyebilir — özel ağlar için izin verin.
- CORS tamamen serbesttir; tarayıcıdan kaynak (origin) kısıtlaması yaşamazsınız.
- API yalnızca **HTTP** üzerinden yayın yapar (HTTPS yoktur). Android'de `http://` adreslerine
  erişebilmek için `usesCleartextTraffic`, iOS'ta ise ATS ayarı gerekebilir.

## API dokümantasyonu

Tüm uçlar, alanlar, enum değerleri ve örnek istek/yanıtlar için **[API.md](API.md)** dosyasına bakın.
