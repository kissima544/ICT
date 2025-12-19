using ICTVisitorsManagementSystem.Models.DTOs;

namespace ICTVisitorsManagementSystem.Services.Interfaces
{
    public interface IAuthService
    {
        Task<string> Register(RegisterDto dto);
        Task<string> Login(LoginDto dto);
        Task<string> LoginWithGoogle(string email, string googleId = null);
        Task<string> VerifyOtp(string email, string otp);
        Task<string> SendResetLinkAsync(string email);
        Task<bool> ResetPasswordAsync(string token, string newPassword);

    }
}
