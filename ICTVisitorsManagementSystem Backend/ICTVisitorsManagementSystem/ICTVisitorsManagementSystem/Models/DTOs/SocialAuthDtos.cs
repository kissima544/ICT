using System.ComponentModel.DataAnnotations;

namespace ICTVisitorsManagementSystem.Models.DTOs
{
    public class FacebookLoginRequest
    {
        [Required]
        public string AccessToken { get; set; }
    }

    public class TikTokLoginRequest
    {
        [Required]
        public string AuthCode { get; set; }
        public string CodeVerifier { get; set; }
    }

    public class AppleLoginRequest
    {
        [Required]
        public string IdentityToken { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
