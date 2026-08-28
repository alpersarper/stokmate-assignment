using System.Collections.Concurrent;

namespace StokMate.Api.Auth;

/// <summary>
/// Opak (GUID) erişim anahtarları üretir ve süreç belleğinde tutar.
/// Anahtarlar bellekte tutulduğu için DI'a singleton olarak kaydedilir;
/// uygulama yeniden başladığında tüm oturumlar düşer.
/// </summary>
public class TokenService
{
    /// <summary>Erişim anahtarının geçerlilik süresi.</summary>
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);

    private readonly ConcurrentDictionary<string, AccessToken> _tokens = new();

    private record AccessToken(int UserId, DateTime ExpiresAt);

    /// <summary>Kullanıcı için yeni bir erişim anahtarı üretir.</summary>
    public (string Token, DateTime ExpiresAt) Issue(int userId)
    {
        var token = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.Add(AccessTokenLifetime);

        _tokens[token] = new AccessToken(userId, expiresAt);
        return (token, expiresAt);
    }

    /// <summary>Anahtar geçerliyse kullanıcı Id'sini, değilse null döner.</summary>
    public int? Validate(string token)
    {
        if (!_tokens.TryGetValue(token, out var entry))
        {
            return null;
        }

        if (entry.ExpiresAt <= DateTime.UtcNow)
        {
            // Süresi dolmuş anahtar bellekte tutulmaz.
            _tokens.TryRemove(token, out _);
            return null;
        }

        return entry.UserId;
    }

    /// <summary>Kullanıcının tüm erişim anahtarlarını düşürür (çıkış yapıldığında).</summary>
    public void RevokeAllForUser(int userId)
    {
        foreach (var pair in _tokens.Where(p => p.Value.UserId == userId))
        {
            _tokens.TryRemove(pair.Key, out _);
        }
    }
}
