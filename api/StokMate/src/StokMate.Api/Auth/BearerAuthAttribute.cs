using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace StokMate.Api.Auth;

/// <summary>
/// "Authorization: Bearer &lt;token&gt;" başlığını doğrular. Başlık yoksa veya anahtar
/// geçersiz/süresi dolmuşsa action hiç çalışmadan 401 + düz metin döner.
/// Doğrulanan kullanıcı Id'si HttpContext.Items içine yazılır.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class BearerAuthAttribute : Attribute, IAuthorizationFilter
{
    private const string Scheme = "Bearer ";
    internal const string UserIdItemKey = "UserId";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var header = context.HttpContext.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(Scheme, StringComparison.OrdinalIgnoreCase))
        {
            context.Result = PlainTextUnauthorized("Yetkilendirme başlığı eksik veya hatalı.");
            return;
        }

        var token = header[Scheme.Length..].Trim();

        // TokenService singleton; istek kapsamından çözülür.
        var tokenService = context.HttpContext.RequestServices.GetRequiredService<TokenService>();
        var userId = tokenService.Validate(token);

        if (userId is null)
        {
            context.Result = PlainTextUnauthorized("Erişim anahtarı geçersiz veya süresi dolmuş.");
            return;
        }

        context.HttpContext.Items[UserIdItemKey] = userId.Value;
    }

    /// <summary>
    /// Hata gövdeleri düz metin olduğu için Unauthorized() yerine ContentResult döner
    /// (Unauthorized() gövdesiz kalır ve [ApiController] tarafından JSON'a çevrilirdi).
    /// </summary>
    private static ContentResult PlainTextUnauthorized(string message) => new()
    {
        StatusCode = StatusCodes.Status401Unauthorized,
        ContentType = "text/plain; charset=utf-8",
        Content = message
    };
}

public static class BearerAuthExtensions
{
    /// <summary>[BearerAuth] ile doğrulanmış kullanıcının Id'si.</summary>
    public static int GetUserId(this HttpContext context)
        => (int)context.Items[BearerAuthAttribute.UserIdItemKey]!;
}
