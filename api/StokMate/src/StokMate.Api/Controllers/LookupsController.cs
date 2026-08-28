using Microsoft.AspNetCore.Mvc;
using StokMate.Api.Auth;
using StokMate.Api.Models;
using StokMate.Api.Services;

namespace StokMate.Api.Controllers;

[ApiController]
[BearerAuth]
public class LookupsController : ControllerBase
{
    private readonly LookupService _lookupService;

    public LookupsController(LookupService lookupService)
    {
        _lookupService = lookupService;
    }

    /// <summary>Kategori listesi.</summary>
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
        => await _lookupService.GetCategoriesAsync();

    /// <summary>Marka listesi.</summary>
    [HttpGet("brands")]
    public async Task<ActionResult<List<BrandDto>>> GetBrands()
        => await _lookupService.GetBrandsAsync();

    /// <summary>Tedarikçi listesi.</summary>
    [HttpGet("suppliers")]
    public async Task<ActionResult<List<SupplierDto>>> GetSuppliers()
        => await _lookupService.GetSuppliersAsync();
}
