using Microsoft.EntityFrameworkCore;
using StokMate.Api.Auth;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Models;

namespace StokMate.Api.Services;

/// <summary>Giriş, anahtar yenileme ve çıkış işlemleri.</summary>
public class AuthService
{
    /// <summary>Yenileme anahtarının geçerlilik süresi.</summary>
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthService(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("E-posta ve şifre zorunludur.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Kullanıcı yok ve şifre yanlış durumları aynı mesajı döner; hangi e-postanın
        // kayıtlı olduğu dışarıya sızdırılmaz.
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordSalt, user.PasswordHash))
        {
            throw new UnauthorizedException("E-posta veya şifre hatalı.");
        }

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ValidationException("Yenileme anahtarı zorunludur.");
        }

        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == request.RefreshToken);

        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Yenileme anahtarı geçersiz veya süresi dolmuş.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == stored.UserId)
                   ?? throw new UnauthorizedException("Yenileme anahtarı geçersiz veya süresi dolmuş.");

        // Rotasyon: kullanılan anahtar iptal edilir, yerine yenisi verilir.
        // Böylece çalınan bir anahtar en fazla bir kez kullanılabilir.
        stored.RevokedAt = DateTime.UtcNow;

        return await IssueTokensAsync(user);
    }

    public async Task LogoutAsync(string refreshToken, int userId)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && t.UserId == userId);

        // Çıkış her koşulda başarılı sayılır; anahtar zaten iptalse hata verilmez.
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        // Erişim anahtarları bellekte tutulduğu için oturumu gerçekten kapatmak adına
        // kullanıcının açık anahtarları da düşürülür.
        _tokenService.RevokeAllForUser(userId);
    }

    public async Task<UserDto> GetMeAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        return ToDto(user);
    }

    /// <summary>Kullanıcı için yeni bir erişim + yenileme anahtarı çifti üretir.</summary>
    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var (accessToken, expiresAt) = _tokenService.Issue(user.Id);

        var refreshToken = new RefreshToken
        {
            Token = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime)
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = expiresAt,
            User = ToDto(user)
        };
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName
    };
}
