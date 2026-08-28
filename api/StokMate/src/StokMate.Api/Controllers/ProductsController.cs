using Microsoft.AspNetCore.Mvc;
using StokMate.Api.Auth;
using StokMate.Api.Models;
using StokMate.Api.Services;

namespace StokMate.Api.Controllers;

[ApiController]
[Route("products")]
[BearerAuth]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    /// <summary>Filtrelenebilir, sıralanabilir ve sayfalanabilir ürün listesi.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetList([FromQuery] ProductQuery query)
        => await _productService.GetListAsync(query);

    /// <summary>Stok durumu özeti.</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ProductStatsDto>> GetStats()
        => await _productService.GetStatsAsync();

    /// <summary>Yeni ürün oluşturur.</summary>
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductRequest request)
        => StatusCode(StatusCodes.Status201Created, await _productService.CreateAsync(request));

    /// <summary>Ürünün tüm alanlarını günceller.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductRequest request)
        => await _productService.UpdateAsync(id, request);

    /// <summary>Yalnızca stok miktarını günceller.</summary>
    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult<ProductDto>> UpdateStock(int id, [FromBody] UpdateStockRequest request)
        => await _productService.UpdateStockAsync(id, request);

    /// <summary>Ürünü siler.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _productService.DeleteAsync(id);
        return NoContent();
    }
}
