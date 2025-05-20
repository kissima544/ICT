using ICTVisitorsManagementSystem.Models.DTOs;
namespace ICTVisitorsManagementSystem.Services.Interfaces
{
    using ICTVisitorsManagementSystem.Models.DTOs;

    public interface IAuthService
    {
        Task<string> Register(RegisterDto dto);
        Task<string> Login(LoginDto dto);
    }

}
