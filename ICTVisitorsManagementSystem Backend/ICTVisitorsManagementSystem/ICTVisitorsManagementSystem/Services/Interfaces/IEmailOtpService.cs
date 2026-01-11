namespace ICTVisitorsManagementSystem.Services.Interfaces
{
    public interface IEmailOtpService
    {
        Task SendOtpAsync(string email, string otp);

    }
}
