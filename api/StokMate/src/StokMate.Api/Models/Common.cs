namespace StokMate.Api.Models;

/// <summary>Sayfalanmış liste yanıtı.</summary>
public class PagedResult<T>
{
    /// <summary>Geçerli sayfadaki kayıtlar.</summary>
    public List<T> Items { get; set; } = new();

    /// <summary>Filtrelere uyan toplam kayıt sayısı (sayfalama öncesi).</summary>
    public int Total { get; set; }

    /// <summary>Geçerli sayfa numarası (1'den başlar).</summary>
    public int Page { get; set; }

    /// <summary>Sayfa başına kayıt sayısı.</summary>
    public int PageSize { get; set; }
}
