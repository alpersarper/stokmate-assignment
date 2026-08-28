using System.Security.Cryptography;
using System.Text;

namespace StokMate.Api.Auth;

/// <summary>
/// Kullanıcıya özel salt + SHA256 ile şifre özeti üretir.
/// Not: Gerçek bir üründe PBKDF2/BCrypt gibi yavaş bir algoritma tercih edilir;
/// burada ek bağımlılık getirmemek için SHA256 kullanılmıştır.
/// </summary>
public static class PasswordHasher
{
    /// <summary>Kullanıcı oluşturulurken bir kez üretilen rastgele salt.</summary>
    public static string CreateSalt() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

    public static string Hash(string password, string salt)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(salt + password)));

    /// <summary>Şifreyi doğrular. Karşılaştırma zamanlama saldırılarına karşı sabit sürelidir.</summary>
    public static bool Verify(string password, string salt, string expectedHash)
        => CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(Hash(password, salt)),
            Encoding.UTF8.GetBytes(expectedHash));
}
