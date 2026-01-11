using ICTVisitorsManagementSystem.Models.DTOs;
using ICTVisitorsManagementSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace ICTVisitorsManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TwoFactorController : ControllerBase
    {
        private readonly TwoFactorService _2faService;
        private static Dictionary<string, string> UserSecrets = new(); // In-memory for testing

        public TwoFactorController()
        {
            _2faService = new TwoFactorService();
        }

        [HttpPost("setup")]
        public IActionResult Setup2FA([FromBody] string email)
        {
            var secret = _2faService.GenerateSecretKey();
            UserSecrets[email] = secret;

            var uri = _2faService.GenerateQRCodeUri(email, secret);
            var qrCodeImage = _2faService.GenerateQRCodeImage(uri);

            return Ok(new { secret, qrCodeImage });
        }

        [HttpPost("verify")]
        public IActionResult Verify2FA([FromBody] TwoFactorDto dto)
        {
            if (UserSecrets.TryGetValue(dto.Email, out var secret))
            {
                var isValid = _2faService.ValidateCode(secret, dto.Code);
                if (isValid) return Ok(new { verified = true });
            }
            return Unauthorized();
        }

        [HttpPost("disable")]
        public IActionResult Disable2FA([FromBody] string email)
        {
            UserSecrets.Remove(email);
            return Ok("2FA disabled");
        }
    }
}
