namespace StokMate.Api.Common;

/// <summary>Program.cs'te tanımlanan hız sınırı politikalarının adları.</summary>
public static class RateLimitPolicies
{
    /// <summary>
    /// Ürün okuma uçları (liste, detay, istatistik) için oturum başına sınır.
    /// Yenilenebilir veri yüzeylerinin kötüye kullanım sıklığındaki tekrarlı
    /// isteklerine karşı sunucu tarafı koruma (assignment kararı).
    /// </summary>
    public const string ProductReads = "product-reads";
}
