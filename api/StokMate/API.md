# StokMate API — Uç Referansı

Temel adres: `http://localhost:5080`

---

## 1. Genel Kurallar

### 1.1 Kimlik doğrulama

`POST /auth/login` ve `POST /auth/refresh` dışındaki **tüm uçlar** kimlik doğrulama ister.

Erişim anahtarını her istekte şu başlıkla gönderin:

```
Authorization: Bearer <accessToken>
```

- **accessToken** — 15 dakika geçerlidir. Süresi dolduğunda uçlar `401` döner.
- **refreshToken** — 7 gün geçerlidir. `POST /auth/refresh` ile yeni bir anahtar çifti alınır.
- Yenileme sırasında **rotasyon** uygulanır: kullanılan `refreshToken` iptal edilir ve
  yanıtta yeni bir `refreshToken` verilir. Eski anahtar bir daha kullanılamaz —
  istemcide her zaman en son dönen değeri saklayın.

### 1.2 Hata yanıtları

> **Önemli:** Hata yanıtlarının gövdesi **düz metindir (`text/plain`), JSON değildir.**
> Hata mesajını okurken gövdeyi `response.text()` ile alın; `response.json()` çağırmayın.

| Durum kodu | Anlamı | Örnek gövde |
| --- | --- | --- |
| `400` | İstek geçersiz | `Fiyat negatif olamaz.` |
| `401` | Kimlik doğrulama başarısız / anahtar geçersiz | `Erişim anahtarı geçersiz veya süresi dolmuş.` |
| `404` | Kayıt bulunamadı | `99 numaralı ürün bulunamadı.` |
| `409` | Mevcut bir kayıtla çakışma | `'ICE-1001' stok kodu başka bir üründe kullanılıyor.` |
| `500` | Beklenmeyen hata | `Beklenmeyen bir hata oluştu.` |

Başarılı yanıtlar ise `application/json` döner.

### 1.3 Para birimi

> **`price` ve `costPrice` alanları KURUŞ cinsinden `int` değerlerdir.**
>
> | Alan değeri | Gösterilecek tutar |
> | --- | --- |
> | `1999` | 19,99 ₺ |
> | `3950` | 39,50 ₺ |
> | `129900` | 1.299,00 ₺ |
>
> Ekranda göstermek için 100'e bölün, API'ye gönderirken 100 ile çarpın.
> Küsurat kaybı yaşamamak için hesaplamaları kuruş üzerinden yapın.

### 1.4 Enum değerleri

Enum alanları JSON'da **sayı** olarak taşınır.

**`unit`** (birim)

| Değer | Anlamı |
| --- | --- |
| `1` | Adet |
| `2` | Kg |
| `3` | Lt |
| `4` | Paket |

**`status`** (durum)

| Değer | Anlamı |
| --- | --- |
| `1` | Aktif |
| `2` | Pasif |
| `3` | Üretim Durduruldu |

### 1.5 Tarihler

Tüm tarihler **UTC** ve ISO 8601 biçimindedir: `2026-07-17T12:39:31.9060307Z`

---

## 2. Uç Listesi

| Method | Path | Yetki |
| --- | --- | --- |
| `POST` | `/auth/login` | — |
| `POST` | `/auth/refresh` | — |
| `POST` | `/auth/logout` | Bearer |
| `GET` | `/auth/me` | Bearer |
| `GET` | `/products` | Bearer |
| `GET` | `/products/stats` | Bearer |
| `POST` | `/products` | Bearer |
| `PUT` | `/products/{id}` | Bearer |
| `PATCH` | `/products/{id}/stock` | Bearer |
| `DELETE` | `/products/{id}` | Bearer |
| `GET` | `/categories` | Bearer |
| `GET` | `/brands` | Bearer |
| `GET` | `/suppliers` | Bearer |

---

## 3. Auth

### 3.1 `POST /auth/login`

Giriş yapar ve anahtar çifti döner.

**İstek gövdesi**

| Alan | Tip | Zorunlu |
| --- | --- | --- |
| `email` | string | evet |
| `password` | string | evet |

```json
{
  "email": "test@ornek.com",
  "password": "Test1234!"
}
```

**Yanıt — `200 OK`**

```json
{
  "accessToken": "50b46b98ee88493e9e5b36d9364a677d",
  "refreshToken": "f46414b28c96418bbb2df92c565cba15",
  "expiresAt": "2026-07-17T12:53:34.0173723Z",
  "user": {
    "id": 1,
    "email": "test@ornek.com",
    "fullName": "Deniz Yılmaz"
  }
}
```

| Alan | Açıklama |
| --- | --- |
| `accessToken` | `Authorization: Bearer` başlığında kullanılır |
| `refreshToken` | Anahtar yenilemek için saklanır |
| `expiresAt` | `accessToken`'ın son geçerlilik anı (UTC) |
| `user` | Giriş yapan kullanıcı |

**Hatalar**

| Kod | Durum |
| --- | --- |
| `400` | `email` veya `password` boş |
| `401` | E-posta veya şifre hatalı |

---

### 3.2 `POST /auth/refresh`

Yenileme anahtarını yeni bir anahtar çiftiyle değiştirir.

**İstek gövdesi**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Yanıt — `200 OK`**

`POST /auth/login` ile aynı gövde (yeni `accessToken` + yeni `refreshToken`).

> Yanıttaki yeni `refreshToken`'ı saklayın. Gönderdiğiniz eski anahtar iptal edilir ve
> tekrar kullanılırsa `401` alırsınız.

**Hatalar**

| Kod | Durum |
| --- | --- |
| `400` | `refreshToken` boş |
| `401` | Anahtar geçersiz, iptal edilmiş veya süresi dolmuş |

---

### 3.3 `POST /auth/logout`

Oturumu kapatır. Gönderilen yenileme anahtarını iptal eder ve kullanıcının açık
erişim anahtarlarını düşürür.

**Yetki:** `Authorization: Bearer <accessToken>`

**İstek gövdesi**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Yanıt — `204 No Content`** (gövde yok)

---

### 3.4 `GET /auth/me`

Oturum açmış kullanıcının bilgilerini döner.

**Yetki:** `Authorization: Bearer <accessToken>`

**Yanıt — `200 OK`**

```json
{
  "id": 1,
  "email": "test@ornek.com",
  "fullName": "Deniz Yılmaz"
}
```

---

## 4. Ürünler

### 4.1 `GET /products`

Ürünleri filtreler, sıralar ve sayfalar.

**Query parametreleri**

| Parametre | Tip | Varsayılan | Açıklama |
| --- | --- | --- | --- |
| `q` | string | — | Arama terimi. |
| `categoryId` | int | — | Kategori filtresi |
| `brandId` | int | — | Marka filtresi |
| `status` | int | — | Durum filtresi (`1` \| `2` \| `3`) |
| `page` | int | `1` | Sayfa numarası (1'den başlar) |
| `pageSize` | int | `20` | Sayfa başına kayıt. En fazla `100`; daha büyük değerler `100`'e düşürülür |
| `sort` | string | `name` | `name` \| `price` \| `stock` \| `updatedAt` |
| `dir` | string | `asc` | `asc` \| `desc` |

Parametrelerin tümü isteğe bağlıdır ve birlikte kullanılabilir.

**Örnek istek**

```
GET /products?q=cola&categoryId=1&sort=price&dir=desc&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

**Yanıt — `200 OK`**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Coca-Cola 1 L Pet",
      "sku": "ICE-1001",
      "barcode": "8690637010011",
      "imageUrl": "https://picsum.photos/seed/1/400/400",
      "categoryId": 1,
      "categoryName": "İçecek",
      "brandId": 6,
      "brandName": "Coca-Cola",
      "price": 3950,
      "stock": 240,
      "minStock": 40,
      "unit": 1,
      "status": 1,
      "isFeatured": true,
      "updatedAt": "2026-07-17T12:37:56.2270349Z"
    }
  ],
  "total": 80,
  "page": 1,
  "pageSize": 20
}
```

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `items` | dizi | Geçerli sayfadaki ürünler |
| `total` | int | Filtrelere uyan **toplam** kayıt sayısı (sayfalama öncesi) |
| `page` | int | Geçerli sayfa |
| `pageSize` | int | Sayfa başına kayıt sayısı |

**Ürün alanları**

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | int | |
| `name` | string | Ürün adı |
| `sku` | string | Stok kodu (benzersiz) |
| `barcode` | string | Barkod |
| `imageUrl` | string | Görsel adresi |
| `categoryId` / `categoryName` | int / string | Kategori |
| `brandId` / `brandName` | int / string | Marka |
| `price` | int | Satış fiyatı — **KURUŞ** (`3950` = 39,50 ₺) |
| `stock` | int | Mevcut stok |
| `minStock` | int | Kritik stok eşiği |
| `unit` | int | Birim (bkz. 1.4) |
| `status` | int | Durum (bkz. 1.4) |
| `isFeatured` | bool | Öne çıkan ürün mü |
| `updatedAt` | string | Son güncelleme (UTC) |

---

### 4.2 `GET /products/stats`

Stok durumu özeti.

**Yanıt — `200 OK`**

```json
{
  "total": 80,
  "outOfStock": 10,
  "lowStock": 14
}
```

| Alan | Açıklama |
| --- | --- |
| `total` | Toplam ürün sayısı |
| `outOfStock` | Stoğu tükenmiş ürün sayısı (`stock == 0`) |
| `lowStock` | Kritik eşiğe inmiş ürün sayısı (`stock <= minStock` ve `stock > 0`) |

---

### 4.3 `POST /products`

Yeni ürün oluşturur.

**İstek gövdesi**

| Alan | Tip | Zorunlu | Açıklama |
| --- | --- | --- | --- |
| `name` | string | evet | |
| `sku` | string | evet | Benzersiz olmalı |
| `barcode` | string | hayır | |
| `categoryId` | int | evet | Var olan bir kategori |
| `brandId` | int | evet | Var olan bir marka |
| `supplierId` | int | evet | Var olan bir tedarikçi |
| `price` | int | evet | **KURUŞ**, negatif olamaz |
| `costPrice` | int | evet | **KURUŞ**, negatif olamaz |
| `stock` | int | evet | Negatif olamaz |
| `minStock` | int | evet | Negatif olamaz |
| `unit` | int | evet | `1` \| `2` \| `3` \| `4` |
| `status` | int | evet | `1` \| `2` \| `3` |
| `description` | string | hayır | |
| `isFeatured` | bool | hayır | Varsayılan `false` |

```json
{
  "name": "Ülker Çikolatalı Gofret 36 g",
  "sku": "ATI-2001",
  "barcode": "8690504019999",
  "categoryId": 5,
  "brandId": 1,
  "supplierId": 1,
  "price": 1999,
  "costPrice": 1200,
  "stock": 150,
  "minStock": 30,
  "unit": 1,
  "status": 1,
  "description": "Fındık parçacıklı çikolatalı gofret.",
  "isFeatured": false
}
```

**Yanıt — `201 Created`**

Oluşturulan ürün, `GET /products` içindeki ürün alanlarıyla aynı biçimde döner.
`imageUrl` sunucu tarafında otomatik atanır.

```json
{
  "id": 81,
  "name": "Ülker Çikolatalı Gofret 36 g",
  "sku": "ATI-2001",
  "barcode": "8690504019999",
  "imageUrl": "https://picsum.photos/seed/81/400/400",
  "categoryId": 5,
  "categoryName": "Atıştırmalık",
  "brandId": 1,
  "brandName": "Ülker",
  "price": 1999,
  "stock": 150,
  "minStock": 30,
  "unit": 1,
  "status": 1,
  "isFeatured": false,
  "updatedAt": "2026-07-17T12:39:30.3470686Z"
}
```

**Hatalar**

| Kod | Durum |
| --- | --- |
| `400` | Zorunlu alan boş, negatif tutar/stok, geçersiz enum, ya da `categoryId`/`brandId`/`supplierId` bulunamadı |
| `409` | `sku` başka bir üründe kullanılıyor |

---

### 4.4 `PUT /products/{id}`

Ürünün **tüm** alanlarını günceller. Gövde `POST /products` ile aynıdır —
değiştirmediğiniz alanları da mevcut değerleriyle göndermeniz gerekir.

`updatedAt` sunucu tarafında otomatik tazelenir.

**Path parametresi**

| Parametre | Tip |
| --- | --- |
| `id` | int |

**İstek gövdesi**

```json
{
  "name": "Coca-Cola 1 L Pet",
  "sku": "ICE-1001",
  "barcode": "8690637010011",
  "categoryId": 1,
  "brandId": 6,
  "supplierId": 1,
  "price": 4250,
  "costPrice": 2850,
  "stock": 200,
  "minStock": 40,
  "unit": 1,
  "status": 1,
  "description": "Güncellenmiş açıklama.",
  "isFeatured": true
}
```

**Yanıt — `200 OK`**

Güncellenmiş ürün (4.1'deki ürün alanlarıyla aynı biçim).

**Hatalar**

| Kod | Durum |
| --- | --- |
| `400` | Geçersiz alan (bkz. 4.3) |
| `404` | Ürün bulunamadı |
| `409` | `sku` başka bir üründe kullanılıyor |

---

### 4.5 `PATCH /products/{id}/stock`

Yalnızca stok miktarını günceller. `updatedAt` otomatik tazelenir.

**İstek gövdesi**

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `stock` | int | Yeni stok değeri. Negatif olamaz |

```json
{
  "stock": 7
}
```

**Yanıt — `200 OK`**

Güncellenmiş ürün (4.1'deki ürün alanlarıyla aynı biçim).

**Hatalar**

| Kod | Durum |
| --- | --- |
| `400` | `stock` negatif |
| `404` | Ürün bulunamadı |

---

### 4.6 `DELETE /products/{id}`

Ürünü siler.

**Yanıt — `204 No Content`** (gövde yok)

**Hatalar**

| Kod | Durum |
| --- | --- |
| `404` | Ürün bulunamadı |

---

## 5. Listeler

Ürün formlarında ve filtrelerde kullanılan sabit listeler.

### 5.1 `GET /categories`

**Yanıt — `200 OK`**

```json
[
  { "id": 1, "name": "İçecek", "slug": "icecek", "sortOrder": 1 },
  { "id": 2, "name": "Kahvaltılık", "slug": "kahvaltilik", "sortOrder": 2 }
]
```

Kategoriler `sortOrder` alanına göre sıralı döner. Toplam 8 kategori vardır.

---

### 5.2 `GET /brands`

**Yanıt — `200 OK`**

```json
[
  { "id": 6, "name": "Coca-Cola" },
  { "id": 8, "name": "Doğadan" }
]
```

Markalar ada göre sıralı döner. Toplam 12 marka vardır.

---

### 5.3 `GET /suppliers`

**Yanıt — `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Anadolu Gıda Dağıtım A.Ş.",
    "contactName": "Mehmet Yılmaz",
    "phone": "0212 555 1010",
    "email": "siparis@anadolugida.com.tr",
    "city": "İstanbul"
  }
]
```

Tedarikçiler ada göre sıralı döner. Toplam 6 tedarikçi vardır.
