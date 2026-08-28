using Microsoft.EntityFrameworkCore;

namespace StokMate.Api.Data;

/// <summary>
/// Uygulamanın veritabanı bağlamı. Bellek içi (InMemory) sağlayıcı ile çalışır;
/// uygulama kapandığında tüm veriler kaybolur.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Product> Products => Set<Product>();
}
