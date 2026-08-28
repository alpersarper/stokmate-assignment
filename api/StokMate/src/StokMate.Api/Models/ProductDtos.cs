using StokMate.Api.Data;

namespace StokMate.Api.Models;

/// <summary>Ürün yanıtı. Fiyat KURUŞ cinsindendir (1999 = 19,99 TL).</summary>
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Barcode { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";

    public int BrandId { get; set; }
    public string BrandName { get; set; } = "";

    /// <summary>Satış fiyatı, KURUŞ cinsinden.</summary>
    public int Price { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; }
    public ProductStatus Status { get; set; }

    public bool IsFeatured { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>GET /products sorgu parametreleri.</summary>
public class ProductQuery
{
    /// <summary>Arama terimi.</summary>
    public string? Q { get; set; }

    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public ProductStatus? Status { get; set; }

    /// <summary>1'den başlar.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Varsayılan 20, en fazla 100.</summary>
    public int PageSize { get; set; } = 20;

    /// <summary>name | price | stock | updatedAt</summary>
    public string? Sort { get; set; }

    /// <summary>asc | desc</summary>
    public string? Dir { get; set; }
}

/// <summary>POST /products gövdesi.</summary>
public class CreateProductRequest
{
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Barcode { get; set; }

    public int CategoryId { get; set; }
    public int BrandId { get; set; }
    public int SupplierId { get; set; }

    /// <summary>Satış fiyatı, KURUŞ cinsinden.</summary>
    public int Price { get; set; }

    /// <summary>Alış maliyeti, KURUŞ cinsinden.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; } = ProductUnit.Adet;
    public ProductStatus Status { get; set; } = ProductStatus.Aktif;

    public string? Description { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>PUT /products/{id} gövdesi. Ürünün tüm alanları gönderilir.</summary>
public class UpdateProductRequest
{
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Barcode { get; set; }

    public int CategoryId { get; set; }
    public int BrandId { get; set; }
    public int SupplierId { get; set; }

    /// <summary>Satış fiyatı, KURUŞ cinsinden.</summary>
    public int Price { get; set; }

    /// <summary>Alış maliyeti, KURUŞ cinsinden.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; } = ProductUnit.Adet;
    public ProductStatus Status { get; set; } = ProductStatus.Aktif;

    public string? Description { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>PATCH /products/{id}/stock gövdesi.</summary>
public class UpdateStockRequest
{
    public int Stock { get; set; }
}

/// <summary>GET /products/stats yanıtı.</summary>
public class ProductStatsDto
{
    /// <summary>Toplam ürün sayısı.</summary>
    public int Total { get; set; }

    /// <summary>Stoğu tükenmiş ürün sayısı.</summary>
    public int OutOfStock { get; set; }

    /// <summary>Kritik eşiğe inmiş (ama tükenmemiş) ürün sayısı.</summary>
    public int LowStock { get; set; }
}
