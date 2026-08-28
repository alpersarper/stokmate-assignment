namespace StokMate.Api.Models;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public int SortOrder { get; set; }
}

public class BrandDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string City { get; set; } = "";
}
