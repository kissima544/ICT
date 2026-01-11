using ICTVisitorsManagementSystem.Models;
using ICTVisitorsManagementSystem.Models.DTOs;
using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Net.Http;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace ICTVisitorsManagementSystem.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailOtpService _emailOtpService;

        // In-memory OTP storage for Google login (not persistent)
        private static readonly ConcurrentDictionary<string, string> emailOtps = new();

        public AuthService(AppDbContext context, IConfiguration config, IEmailOtpService emailOtpService)
        {
            _context = context;
            _config = config;
            _emailOtpService = emailOtpService;
        }

        // Register a new user (for normal login only)
        public async Task<string> Register(RegisterDto dto)
        {
            if (_context.Users.Any(u => u.Username == dto.Username))
                return "Username already exists";

            var user = new User
            {
                Full_Name = dto.Full_Name,
                Email = dto.Email,
                Username = dto.Username,
                Pass_word = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsGoogleUser = false,
                Role = "Student"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return "User registered successfully";
        }

        // Standard login for normal (non-Google) users
        public async Task<string> Login(LoginDto dto)
        {
            Console.WriteLine($"[DEBUG] Login attempt for: {dto.Username}");

            // Hardcoded Admin for testing (Case-insensitive check)
            if (dto.Username?.ToLower() == "admin" && dto.Password == "admin123")
            {
                Console.WriteLine("[DEBUG] Hardcoded Admin detected!");
                var adminUser = new User 
                { 
                    Id = 999, 
                    Username = "admin", 
                    Full_Name = "System Admin",
                    Email = "admin@ict.com", 
                    Role = "Admin" 
                };
                return GenerateJwtToken(adminUser);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username == dto.Username && !u.IsGoogleUser);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Pass_word))
                return "Invalid credentials";

            return GenerateJwtToken(user);
        }

        // Google login step 1 – register if not exist, then send OTP
        public async Task<string> LoginWithGoogle(string email, string? googleId = null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsGoogleUser);

            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    Username = email,
                    Full_Name = email.Split('@')[0],
                    Pass_word = "",
                    IsGoogleUser = true,
                    GoogleId = googleId,
                    Role = "Student"
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var otp = GenerateOtp();
            emailOtps[email] = otp;

            await _emailOtpService.SendOtpAsync(email, otp);
            return "OTP sent to email";
        }

        // Facebook Login - Direct Token (No OTP)
        public async Task<string> LoginWithFacebook(string email, string? facebookId = null, string? name = null)
        {
            var user = await GetOrCreateSocialUser(email, facebookId, "Facebook", name);
            return GenerateJwtToken(user);
        }

        // TikTok Login
        public async Task<string> LoginWithTikTok(string code, string codeVerifier)
        {
            var clientKey = _config["Authentication:TikTok:ClientKey"];
            var clientSecret = _config["Authentication:TikTok:ClientSecret"];
            
            using var client = new HttpClient();
            
            // 1. Exchange Code for Access Token
            var tokenValues = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("client_key", clientKey),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("code", code),
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("redirect_uri", "https://companionate-yadiel-uncapitalized.ngrok-free.dev/login"),
                new KeyValuePair<string, string>("code_verifier", codeVerifier)
            };

            var tokenContent = new FormUrlEncodedContent(tokenValues);
            var tokenResponse = await client.PostAsync("https://open.tiktokapis.com/v2/oauth/token/", tokenContent);
            
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var error = await tokenResponse.Content.ReadAsStringAsync();
                throw new Exception($"TikTok Token Error: {error}");
            }

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            dynamic tokenData = Newtonsoft.Json.JsonConvert.DeserializeObject(tokenJson);
            string accessToken = tokenData.access_token;
            string openId = tokenData.open_id;

            // 2. Get User Info
            var userResponse = await client.GetAsync($"https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name&access_token={accessToken}");
            
            if (!userResponse.IsSuccessStatusCode)
            {
                 throw new Exception("Failed to fetch TikTok user info");
            }
            
            var userJson = await userResponse.Content.ReadAsStringAsync();
            dynamic userDataObj = Newtonsoft.Json.JsonConvert.DeserializeObject(userJson);
            dynamic userRef = userDataObj.data.user;

            string name = userRef.display_name ?? "TikTok User";
            string userOpenId = userRef.open_id;

             // 3. Login or Register
             // Using OpenID as unique identifier, fake email
             string placeholderEmail = $"{userOpenId}@tiktok.users";
             
             var user = await GetOrCreateSocialUser(placeholderEmail, userOpenId, "TikTok", name);
             return GenerateJwtToken(user);
        }

        // Apple Login
        public async Task<string> LoginWithApple(string email, string? appleId = null)
        {
            var user = await GetOrCreateSocialUser(email, appleId, "Apple");
            // Send OTP
            var otp = GenerateOtp();
            emailOtps[email] = otp;
            await _emailOtpService.SendOtpAsync(email, otp);
            return "OTP sent to email";
        }

        private async Task<User> GetOrCreateSocialUser(string email, string? socialId, string provider, string? name = null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsGoogleUser);

            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    Username = email,
                    Full_Name = !string.IsNullOrWhiteSpace(name) ? name : email.Split('@')[0], 
                    Pass_word = "",
                    IsGoogleUser = true, 
                    GoogleId = socialId, 
                    Role = "Student"
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            return user;
        }

        // Google login step 2 – verify OTP
        public async Task<string> VerifyOtp(string email, string otp)
        {
            if (emailOtps.TryGetValue(email, out string storedOtp) && storedOtp == otp)
            {
                emailOtps.TryRemove(email, out _);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null) return "User not found";

                return GenerateJwtToken(user);
            }

            return "Invalid OTP";
        }

        // Send password reset link for normal login users only
        public async Task<string> SendResetLinkAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsGoogleUser);
            if (user == null) return "User not found.";

            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            user.PasswordResetToken = token;
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            var resetUrl = $"http://127.0.0.1:5500/pages/reset-password.html?token={Uri.EscapeDataString(token)}";

            var message = $@"
                <h3>Password Reset Request</h3>
                <p>Click the button below to reset your password:</p>
                <a href='{resetUrl}' style='
                    background-color:#4CAF50;
                    color:white;
                    padding:10px 20px;
                    text-decoration:none;
                    border-radius:5px;
                    display:inline-block;'>Reset Password</a>
                <p>This link will expire in 15 minutes.</p>";

            await _emailOtpService.SendOtpAsync(email, message);
            return "Reset link sent to your email.";
        }

        // Reset password using token from email
        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token && u.ResetTokenExpires > DateTime.UtcNow);

            if (user == null)
            {
                Console.WriteLine($"Token not found or expired: {token}");
                return false;
            }

            user.Pass_word = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _context.SaveChangesAsync();
            return true;
        }

        // Generate JWT token
        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing in configuration");
            var key = Encoding.ASCII.GetBytes(jwtKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email ?? ""),
                    new Claim(ClaimTypes.Role, user.Role ?? "Staff")
                }),
                Expires = DateTime.UtcNow.AddHours(3),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Generate a 6-digit OTP
        private string GenerateOtp()
        {
            return new Random().Next(100000, 999999).ToString();
        }
    }
}
