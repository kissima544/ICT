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
                IsGoogleUser = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return "User registered successfully";
        }

        // Standard login for normal (non-Google) users
        public async Task<string> Login(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username == dto.Username && !u.IsGoogleUser);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Pass_word))
                return "Invalid credentials";

            return GenerateJwtToken(user);
        }

        // Google login step 1 – register if not exist, then send OTP
        public async Task<string> LoginWithGoogle(string email, string googleId = null)
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
                    GoogleId = googleId
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var otp = GenerateOtp();
            emailOtps[email] = otp;

            await _emailOtpService.SendOtpAsync(email, otp);
            return "OTP sent to email";
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
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email ?? "")
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
