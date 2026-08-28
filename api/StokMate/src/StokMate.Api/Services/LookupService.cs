using Microsoft.EntityFrameworkCore;
using StokMate.Api.Data;
using StokMate.Api.Models;

namespace StokMate.Api.Services;

/// <summary>Ürün formlarında ve filtrelerde kullanılan sabit listeler.</summary>
public class LookupService
{
    private readonly AppDbContext _db;

    public LookupService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _db.Categories
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            SortOrder = c.SortOrder
        }).ToList();
    }

    public async Task<List<BrandDto>> GetBrandsAsync()
    {
        var brands = await _db.Brands.OrderBy(b => b.Name).ToListAsync();

        return brands.Select(b => new BrandDto
        {
            Id = b.Id,
            Name = b.Name
        }).ToList();
    }

    public async Task<List<SupplierDto>> GetSuppliersAsync()
    {
        var suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();

        return suppliers.Select(s => new SupplierDto
        {
            Id = s.Id,
            Name = s.Name,
            ContactName = s.ContactName,
            Phone = s.Phone,
            Email = s.Email,
            City = s.City
        }).ToList();
    }
}
