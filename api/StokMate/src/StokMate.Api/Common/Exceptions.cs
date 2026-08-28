namespace StokMate.Api.Common;

/// <summary>İstenen kayıt bulunamadı. ExceptionMiddleware tarafından 404'e çevrilir.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }
}

/// <summary>İstek geçersiz veri içeriyor. ExceptionMiddleware tarafından 400'e çevrilir.</summary>
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message)
    {
    }
}

/// <summary>Kimlik doğrulama başarısız. ExceptionMiddleware tarafından 401'e çevrilir.</summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

/// <summary>Kayıt mevcut bir veriyle çakışıyor. ExceptionMiddleware tarafından 409'a çevrilir.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
