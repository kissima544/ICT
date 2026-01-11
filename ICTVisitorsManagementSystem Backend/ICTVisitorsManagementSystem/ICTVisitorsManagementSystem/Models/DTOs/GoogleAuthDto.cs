namespace ICTVisitorsManagementSystem.Models.DTOs
{
    public class GoogleLoginRequest
    {
        public string IdToken { get; set; }
    }
    public class GoogleOtpVerificationRequest
    {
        public string IdToken { get; set; }
        public string Otp { get; set; }
    }
}
