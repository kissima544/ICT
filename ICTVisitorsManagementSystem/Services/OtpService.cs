using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace ICTVisitorsManagementSystem.Services;

public interface IOtpService
{
    string GenerateOtp(string email);
    bool VerifyOtp(string email, string otp);
}

public class OtpService : IOtpService
{
    private readonly ConcurrentDictionary<string, (string Code, DateTime ExpiresAt)> _otps = new();

    public string GenerateOtp(string email)
    {
        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        _otps[email] = (otp, DateTime.UtcNow.AddMinutes(5));
        return otp;
    }

    public bool VerifyOtp(string email, string otp)
    {
        if (_otps.TryGetValue(email, out var data) && data.Code == otp && data.ExpiresAt > DateTime.UtcNow)
        {
            _otps.TryRemove(email, out _);
            return true;
        }
        return false;
    }
}
