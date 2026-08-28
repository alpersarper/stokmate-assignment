using Microsoft.EntityFrameworkCore;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Models;

namespace StokMate.Api.Services;

/// <summary>Ürün listeleme, oluşturma, güncelleme ve silme işlemleri.</summary>
public class ProductService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;

    public ProductService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ProductDto>> GetListAsync(ProductQuery query)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? DefaultPageSize : Math.Min(query.PageSize, MaxPageSize);

        var products = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim().ToLower();
            products = products.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Sku.ToLower().Contains(term) ||
                p.Barcode.ToLower().Contains(term));
        }

        if (query.CategoryId is not null)
        {
            products = products.Where(p => p.CategoryId == query.CategoryId);
        }

        if (query.BrandId is not null)
        {
            products = products.Where(p => p.BrandId == query.BrandId);
        }

        if (query.Status is not null)
        {
            products = products.Where(p => p.Status == query.Status);
        }

        // Toplam, sayfalama uygulanmadan önce hesaplanır.
        var total = await products.CountAsync();

        var rows = await ApplySort(products, query.Sort, query.Dir)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ProductDto>
        {
            Items = rows.Select(ToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException($"{id} numaralı ürün bulunamadı.");

        return ToDetailDto(product);
    }

    public async Task<ProductStatsDto> GetStatsAsync() => new()
    {
        Total = await _db.Products.CountAsync(),
        OutOfStock = await _db.Products.CountAsync(p => p.Stock == 0),
        LowStock = await _db.Products.CountAsync(p => p.Stock <= p.MinStock && p.Stock > 0)
    };

    public async Task<ProductDto> CreateAsync(CreateProductRequest request)
    {
        ValidateFields(request.Name, request.Sku, request.Price, request.CostPrice,
            request.Stock, request.MinStock, request.Unit, request.Status);

        await EnsureRelationsExistAsync(request.CategoryId, request.BrandId, request.SupplierId);
        await EnsureSkuIsAvailableAsync(request.Sku, excludeProductId: null);

        var now = DateTime.UtcNow;
        var product = new Product
        {
            Name = request.Name.Trim(),
            Sku = request.Sku.Trim(),
            Barcode = request.Barcode?.Trim() ?? "",
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            SupplierId = request.SupplierId,
            Price = request.Price,
            CostPrice = request.CostPrice,
            Stock = request.Stock,
            MinStock = request.MinStock,
            Unit = request.Unit,
            Status = request.Status,
            Description = request.Description?.Trim() ?? "",
            IsFeatured = request.IsFeatured,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Görsel adresi Id'den türetilir; Id ancak kayıt sonrasında bellidir.
        product.ImageUrl = BuildImageUrl(product.Id);
        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task<ProductDto> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await FindAsync(id);

        ValidateFields(request.Name, request.Sku, request.Price, request.CostPrice,
            request.Stock, request.MinStock, request.Unit, request.Status);

        await EnsureRelationsExistAsync(request.CategoryId, request.BrandId, request.SupplierId);
        await EnsureSkuIsAvailableAsync(request.Sku, excludeProductId: id);

        product.Name = request.Name.Trim();
        product.Sku = request.Sku.Trim();
        product.Barcode = request.Barcode?.Trim() ?? "";
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.SupplierId = request.SupplierId;
        product.Price = request.Price;
        product.CostPrice = request.CostPrice;
        product.Stock = request.Stock;
        product.MinStock = request.MinStock;
        product.Unit = request.Unit;
        product.Status = request.Status;
        product.Description = request.Description?.Trim() ?? "";
        product.IsFeatured = request.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task<ProductDto> UpdateStockAsync(int id, UpdateStockRequest request)
    {
        if (request.Stock < 0)
        {
            throw new ValidationException("Stok negatif olamaz.");
        }

        var product = await FindAsync(id);

        product.Stock = request.Stock;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var product = await FindAsync(id);

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
    }

    private async Task<Product> FindAsync(int id)
        => await _db.Products.FirstOrDefaultAsync(p => p.Id == id)
           ?? throw new NotFoundException($"{id} numaralı ürün bulunamadı.");

    /// <summary>Yanıt için ürünü kategori ve marka adlarıyla birlikte yeniden okur.</summary>
    private async Task<ProductDto> LoadDtoAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstAsync(p => p.Id == id);

        return ToDto(product);
    }

    /// <summary>sort=name|price|stock|updatedAt, dir=asc|desc. Tanınmayan değerde ada göre sıralanır.</summary>
    private static IQueryable<Product> ApplySort(IQueryable<Product> products, string? sort, string? dir)
    {
        var descending = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);

        var ordered = sort?.Trim().ToLowerInvariant() switch
        {
            "price" => descending ? products.OrderByDescending(p => p.Price) : products.OrderBy(p => p.Price),
            "stock" => descending ? products.OrderByDescending(p => p.Stock) : products.OrderBy(p => p.Stock),
            "updatedat" => descending ? products.OrderByDescending(p => p.UpdatedAt) : products.OrderBy(p => p.UpdatedAt),
            _ => descending ? products.OrderByDescending(p => p.Name) : products.OrderBy(p => p.Name)
        };

        // Eşit değerlerde sayfalar arası tutarlılık için ikincil anahtar.
        return ordered.ThenBy(p => p.Id);
    }

    private static void ValidateFields(string name, string sku, int price, int costPrice,
        int stock, int minStock, ProductUnit unit, ProductStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException("Ürün adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new ValidationException("Stok kodu (sku) zorunludur.");
        }

        if (price < 0)
        {
            throw new ValidationException("Fiyat negatif olamaz.");
        }

        if (costPrice < 0)
        {
            throw new ValidationException("Maliyet negatif olamaz.");
        }

        if (stock < 0)
        {
            throw new ValidationException("Stok negatif olamaz.");
        }

        if (minStock < 0)
        {
            throw new ValidationException("Minimum stok negatif olamaz.");
        }

        if (!Enum.IsDefined(unit))
        {
            throw new ValidationException("Geçersiz birim değeri.");
        }

        if (!Enum.IsDefined(status))
        {
            throw new ValidationException("Geçersiz durum değeri.");
        }
    }

    private async Task EnsureRelationsExistAsync(int categoryId, int brandId, int supplierId)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == categoryId))
        {
            throw new ValidationException($"{categoryId} numaralı kategori bulunamadı.");
        }

        if (!await _db.Brands.AnyAsync(b => b.Id == brandId))
        {
            throw new ValidationException($"{brandId} numaralı marka bulunamadı.");
        }

        if (!await _db.Suppliers.AnyAsync(s => s.Id == supplierId))
        {
            throw new ValidationException($"{supplierId} numaralı tedarikçi bulunamadı.");
        }
    }

    /// <summary>Aynı stok kodu birden fazla üründe kullanılamaz.</summary>
    private async Task EnsureSkuIsAvailableAsync(string sku, int? excludeProductId)
    {
        var normalized = sku.Trim();
        var isTaken = await _db.Products.AnyAsync(p => p.Sku == normalized && p.Id != excludeProductId);

        if (isTaken)
        {
            throw new ConflictException($"'{normalized}' stok kodu başka bir üründe kullanılıyor.");
        }
    }

    internal static string BuildImageUrl(int productId) => $"https://picsum.photos/seed/{productId}/400/400";

    /// <summary>Detay yanıtı: liste alanlarına ek olarak PUT gövdesinin gerektirdiği alanlar.</summary>
    private static ProductDetailDto ToDetailDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Sku = p.Sku,
        Barcode = p.Barcode,
        ImageUrl = p.ImageUrl,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        BrandId = p.BrandId,
        BrandName = p.Brand?.Name ?? "",
        Price = p.Price,
        Stock = p.Stock,
        MinStock = p.MinStock,
        Unit = p.Unit,
        Status = p.Status,
        IsFeatured = p.IsFeatured,
        UpdatedAt = p.UpdatedAt,
        CostPrice = p.CostPrice,
        SupplierId = p.SupplierId,
        Description = p.Description
    };

    private static ProductDto ToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Sku = p.Sku,
        Barcode = p.Barcode,
        ImageUrl = p.ImageUrl,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        BrandId = p.BrandId,
        BrandName = p.Brand?.Name ?? "",
        Price = p.Price,
        Stock = p.Stock,
        MinStock = p.MinStock,
        Unit = p.Unit,
        Status = p.Status,
        IsFeatured = p.IsFeatured,
        UpdatedAt = p.UpdatedAt
    };
}
