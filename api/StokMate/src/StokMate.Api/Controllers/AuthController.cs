using Microsoft.AspNetCore.Mvc;
using StokMate.Api.Auth;
using StokMate.Api.Models;
using StokMate.Api.Services;

namespace StokMate.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    /// <summary>E-posta ve şifre ile giriş yapar, anahtar çifti döner.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        => await _authService.LoginAsync(request);

    /// <summary>Yenileme anahtarını yeni bir anahtar çiftiyle değiştirir.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
        => await _authService.RefreshAsync(request);

    /// <summary>Oturumu kapatır ve yenileme anahtarını iptal eder.</summary>
    [BearerAuth]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken, HttpContext.GetUserId());
        return NoContent();
    }

    /// <summary>Oturum açmış kullanıcının bilgilerini döner.</summary>
    [BearerAuth]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
        => await _authService.GetMeAsync(HttpContext.GetUserId());
}
