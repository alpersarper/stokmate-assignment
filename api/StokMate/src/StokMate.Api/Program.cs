using System.Reflection;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StokMate.Api.Auth;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Services;

const string corsPolicyName = "StokMateCors";

var builder = WebApplication.CreateBuilder(args);

// Port sabit: 5080. Tüm ağ arayüzleri (0.0.0.0) dinlenir; böylece API'ye hem
// localhost'tan hem de emülatör/fiziksel cihazdan makinenin yerel IP'si ile erişilebilir.
builder.WebHost.UseUrls("http://0.0.0.0:5080");

// Bellek içi veritabanı: kurulum gerektirmez, uygulama kapanınca veriler silinir.
builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("StokMate"));

// Erişim anahtarları süreç belleğinde tutulur; bu yüzden tek örnek olmalı.
builder.Services.AddSingleton<TokenService>();

// Servisler arayüzsüz, somut sınıf olarak kaydedilir.
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<LookupService>();

builder.Services.AddControllers();

// Model bağlama hataları da düz metin dönsün. AddControllers()'tan SONRA gelmeli ki
// varsayılan ProblemDetails (JSON) üreticisinin üzerine yazsın.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = _ => new ContentResult
    {
        StatusCode = StatusCodes.Status400BadRequest,
        ContentType = "text/plain; charset=utf-8",
        Content = "İstek geçersiz veya eksik alan içeriyor."
    };
});

// Ürün okuma uçları için oturum başına hız sınırı (assignment kararı, docs/DECISIONS.md).
// İstemci tarafındaki yenileme korumaları güvenlik sınırı değildir; olağandışı sıklıkta
// tekrarlanan yenileme istekleri sunucu tarafında da bağımsız olarak sınırlanır.
// Sınır bilinçli olarak cömerttir: 10 saniyede 60 istek — normal kullanım (15 sn liste
// yoklaması, 10 sn detay yoklaması, bekleme süreli manuel yenilemeler, sayfalama) buna
// asla yaklaşmaz; yalnızca kötüye kullanım niteliğindeki istek döngüleri yakalanır.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var response = context.HttpContext.Response;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds)
                .ToString(System.Globalization.CultureInfo.InvariantCulture);
        }
        // Hata gövdeleri projedeki diğer hatalarla aynı biçimde: Türkçe düz metin.
        response.ContentType = "text/plain; charset=utf-8";
        await response.WriteAsync("Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.", cancellationToken);
    };
    options.AddPolicy(RateLimitPolicies.ProductReads, httpContext =>
    {
        // Bölümleme anahtarı erişim anahtarıdır (yoksa IP): bir istemcinin
        // taşkını diğer oturumların limitini tüketmez.
        var authorization = httpContext.Request.Headers.Authorization.ToString();
        var partitionKey = string.IsNullOrEmpty(authorization)
            ? $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}"
            : $"token:{authorization}";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromSeconds(10),
            QueueLimit = 0,
        });
    });
});

// Web ve mobil istemcilerin sorunsuz bağlanabilmesi için CORS tamamen serbest.
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy => policy
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StokMate API",
        Version = "v1",
        Description = "Stok yönetimi case study API'si. Fiyat alanları KURUŞ cinsindendir (1999 = 19,99 TL)."
    });

    // Swagger arayüzündeki "Authorize" düğmesi için opak Bearer anahtarı tanımı.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        In = ParameterLocation.Header,
        Description = "/auth/login yanıtındaki accessToken değerini girin."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    // Controller'lardaki XML özet yorumları Swagger'da açıklama olarak görünür.
    var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// Örnek veriler uygulama açılışında yüklenir.
using (var scope = app.Services.CreateScope())
{
    DbSeeder.Seed(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}

// En dışta: alttaki tüm hataları düz metin yanıta çevirir.
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseCors(corsPolicyName);
// UseRouting'den SONRA gelmeli: politika uç noktaya (endpoint) göre seçilir.
app.UseRateLimiter();
app.MapControllers();

app.Run();
