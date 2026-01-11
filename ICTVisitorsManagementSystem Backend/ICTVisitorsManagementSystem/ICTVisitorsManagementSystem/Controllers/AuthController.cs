using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using ICTVisitorsManagementSystem.Models.DTOs;
using ICTVisitorsManagementSystem.Services.Interfaces;
using System.Threading.Tasks;
using System;

namespace ICTVisitorsManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ✅ User Registration
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.Register(dto);
            if (result == "User registered successfully")
                return Ok(new { message = result });

            return BadRequest(new { message = result });
        }

        // ✅ Standard Email/Password Login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.Login(dto);
            if (result.StartsWith("Invalid"))
                return Unauthorized(new { message = result });

            return Ok(new { token = result });
        }

        // ✅ Google Login: Validate token and send OTP
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.IdToken))
                    return BadRequest(new { message = "ID token is required" });

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
                if (payload == null || string.IsNullOrWhiteSpace(payload.Email))
                    return Unauthorized(new { message = "Invalid Google token payload" });

                var email = payload.Email;
                Console.WriteLine($"✅ Google token validated for: {email}");

                await _authService.LoginWithGoogle(email); // Send OTP via email
                return Ok(new { message = "OTP sent to your email", requiresOtp = true });
            }
            catch (InvalidJwtException ex)
            {
                Console.WriteLine("InvalidJwtException: " + ex.Message);
                return Unauthorized(new { message = "Invalid Google token: " + ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Google login error: " + ex.Message);
                return StatusCode(500, new { message = "Internal server error during Google login", detail = ex.Message });
            }

        }

        // ✅ Facebook Login
        [HttpPost("facebook-login")]
        public async Task<IActionResult> FacebookLogin([FromBody] FacebookLoginRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.AccessToken)) return BadRequest("Access token required");

            try 
            {
                using var client = new System.Net.Http.HttpClient();
                // Call Facebook Graph API to get user info
                var response = await client.GetAsync($"https://graph.facebook.com/me?fields=email,name&access_token={dto.AccessToken}");
                
                if (!response.IsSuccessStatusCode)
                {
                    return Unauthorized(new { message = "Invalid Facebook access token" });
                }

                var content = await response.Content.ReadAsStringAsync();
                var fbUser = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(content); // Use dynamic or a specific DTO
                
                string email = fbUser.email;
                string name = fbUser.name;
                string facebookId = fbUser.id;

                if (string.IsNullOrWhiteSpace(email))
                {
                    // Fallback: Use a unique placeholder if email is missing
                    if (!string.IsNullOrWhiteSpace(facebookId))
                    {
                        email = $"{facebookId}@facebook.users";
                    }
                    else
                    {
                        return BadRequest(new { message = "Could not retrieve Email or ID from Facebook." });
                    }
                }

                Console.WriteLine($"✅ Facebook token validated for: {email}");

                Console.WriteLine($"✅ Facebook token validated for: {email}");

                // Now returns JWT token directly
                string token = await _authService.LoginWithFacebook(email, facebookId, name);
                
                return Ok(new { token, requiresOtp = false, email, name });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Facebook login error: {ex.Message}");
                return StatusCode(500, "Error validating Facebook token");
            }
        }

        [HttpPost("tiktok-login")]
        public async Task<IActionResult> TikTokLogin([FromBody] TikTokLoginRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.AuthCode)) return BadRequest("Auth code required");

            try 
            {
                var result = await _authService.LoginWithTikTok(dto.AuthCode, dto.CodeVerifier);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ Apple Login
        [HttpPost("apple-login")]
        public async Task<IActionResult> AppleLogin([FromBody] AppleLoginRequest dto)
        {
            // MOCK VALIDATION: Verify Apple Identity Token
            if (string.IsNullOrWhiteSpace(dto.IdentityToken)) return BadRequest("Identity token required");

            var email = "apple_user@example.com"; 
            
            await _authService.LoginWithApple(email);
            return Ok(new { message = "OTP sent to your email", requiresOtp = true, email });
        }

        // ✅ Google OTP Verification
        [HttpPost("google-verify-otp")]
        public async Task<IActionResult> GoogleVerifyOtp([FromBody] GoogleOtpVerificationRequest dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.IdToken) || string.IsNullOrWhiteSpace(dto.Otp))
                    return BadRequest(new { message = "ID token and OTP are required" });

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
                if (payload == null || string.IsNullOrWhiteSpace(payload.Email))
                    return Unauthorized(new { message = "Invalid Google token payload" });

                var email = payload.Email;
                Console.WriteLine($"🔐 Verifying OTP for Google user: {email}");

                var token = await _authService.VerifyOtp(email, dto.Otp);
                if (token == "Invalid OTP" || token == "User not found")
                    return Unauthorized(new { message = token });

                return Ok(new { token });
            }
            catch (InvalidJwtException ex)
            {
                Console.WriteLine("InvalidJwtException: " + ex.Message);
                return Unauthorized(new { message = "Invalid Google token: " + ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ OTP verification error: " + ex.Message);
                return StatusCode(500, new { message = "Internal server error during OTP verification", detail = ex.Message });
            }
        }

        // ✅ Email-based OTP Verification (for any login)
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] OtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
                return BadRequest(new { message = "Email and OTP are required" });

            var result = await _authService.VerifyOtp(dto.Email, dto.Otp);
            if (result == "Invalid OTP" || result == "User not found")
                return Unauthorized(new { message = result });

            return Ok(new { token = result });
        }
        // ✅ Resend OTP for Google Login
        [HttpPost("google-resend-otp")]
        public async Task<IActionResult> GoogleResendOtp([FromBody] GoogleLoginRequest dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.IdToken))
                    return BadRequest(new { message = "ID token is required" });

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
                if (payload == null || string.IsNullOrWhiteSpace(payload.Email))
                    return Unauthorized(new { message = "Invalid Google token payload" });

                var email = payload.Email;
                Console.WriteLine($"🔁 Resending OTP to: {email}");

                await _authService.LoginWithGoogle(email); // Re-send OTP
                return Ok(new { message = "OTP resent to your email" });
            }
            catch (InvalidJwtException ex)
            {
                Console.WriteLine("InvalidJwtException: " + ex.Message);
                return Unauthorized(new { message = "Invalid Google token: " + ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Resend OTP error: " + ex.Message);
                return StatusCode(500, new { message = "Internal server error during OTP resend", detail = ex.Message });
            }

        }

        // ✅ Forgot Password - Send Reset Link
        [HttpPost("request-password-reset")]
        public async Task<IActionResult> RequestReset([FromBody] ForgotPasswordDto model)
        {
            var result = await _authService.SendResetLinkAsync(model.Email);
            return Ok(new { message = result });
        }

        // ✅ Forgot Password - Verify Token and Set New Password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            var success = await _authService.ResetPasswordAsync(model.Token, model.NewPassword);
            return success
                ? Ok(new { message = "Password updated successfully" })
                : BadRequest(new { message = "Invalid or expired token" });
        }
    }
}
