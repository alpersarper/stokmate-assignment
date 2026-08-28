namespace StokMate.Api.Common;

/// <summary>
/// Boru hattındaki tüm hataları yakalar ve düz metin (text/plain) yanıta çevirir.
/// Bilinen hata tipleri kendi durum kodlarını alır; beklenmeyen hatalarda istemciye
/// iç detay sızdırılmaz, ayrıntı yalnızca sunucu günlüğüne yazılır.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, message) = Map(ex);

            if (statusCode == StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(ex, "Beklenmeyen hata: {Method} {Path}", context.Request.Method, context.Request.Path);
            }

            // Yanıt gövdesi akmaya başladıysa durum kodu/gövde artık değiştirilemez.
            if (context.Response.HasStarted)
            {
                throw;
            }

            // Response.Clear() bilinçli olarak çağrılmaz: CORS middleware'inin eklediği
            // başlıkları silerdi ve tarayıcı hata yanıtını istemciye hiç ulaştıramazdı.
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "text/plain; charset=utf-8";
            context.Response.ContentLength = null;

            await context.Response.WriteAsync(message);
        }
    }

    /// <summary>Hata tipini HTTP durum kodu ve istemciye gösterilecek mesaja eşler.</summary>
    private static (int StatusCode, string Message) Map(Exception ex) => ex switch
    {
        NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
        ValidationException => (StatusCodes.Status400BadRequest, ex.Message),
        UnauthorizedException => (StatusCodes.Status401Unauthorized, ex.Message),
        ConflictException => (StatusCodes.Status409Conflict, ex.Message),
        _ => (StatusCodes.Status500InternalServerError, "Beklenmeyen bir hata oluştu.")
    };
}
