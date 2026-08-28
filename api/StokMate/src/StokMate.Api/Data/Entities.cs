namespace StokMate.Api.Data;

/// <summary>Uygulamaya giriş yapabilen kullanıcı.</summary>
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";

    /// <summary>Salt + şifrenin SHA256 özeti. Şifrenin kendisi hiçbir zaman saklanmaz.</summary>
    public string PasswordHash { get; set; } = "";

    /// <summary>Kullanıcıya özel salt; aynı şifrelerin aynı özeti üretmesini engeller.</summary>
    public string PasswordSalt { get; set; } = "";
}

/// <summary>Erişim anahtarını yenilemeye yarayan, veritabanında saklanan opak anahtar.</summary>
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = "";
    public int UserId { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>Dolu ise anahtar iptal edilmiştir (yenileme rotasyonu veya çıkış).</summary>
    public DateTime? RevokedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>Ürün kategorisi.</summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";

    /// <summary>Listelerde görüntülenme sırası.</summary>
    public int SortOrder { get; set; }
}

/// <summary>Ürün markası.</summary>
public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>Ürünü tedarik eden firma.</summary>
public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string City { get; set; } = "";
}

/// <summary>Ürünün satış birimi.</summary>
public enum ProductUnit
{
    Adet = 1,
    Kg = 2,
    Lt = 3,
    Paket = 4
}

/// <summary>Ürünün satış durumu.</summary>
public enum ProductStatus
{
    Aktif = 1,
    Pasif = 2,
    UretimDurduruldu = 3
}

/// <summary>Stokta izlenen ürün.</summary>
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    /// <summary>Stok kodu; ürünler arasında benzersizdir.</summary>
    public string Sku { get; set; } = "";

    public string Barcode { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int BrandId { get; set; }
    public Brand? Brand { get; set; }

    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    /// <summary>Satış fiyatı, KURUŞ cinsinden. Örnek: 1999 = 19,99 TL.</summary>
    public int Price { get; set; }

    /// <summary>Alış maliyeti, KURUŞ cinsinden.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }

    /// <summary>Kritik stok eşiği; stok bu değerin altına indiğinde ürün "az stoklu" sayılır.</summary>
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; }
    public ProductStatus Status { get; set; }

    public string Description { get; set; } = "";
    public bool IsFeatured { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
