using OtpNet;
using QRCoder;

namespace ICTVisitorsManagementSystem.Services
{
    public class TwoFactorService
    {
        public string GenerateSecretKey()
        {
            var bytes = KeyGeneration.GenerateRandomKey(20);
            return Base32Encoding.ToString(bytes);
        }

        public string GenerateQRCodeUri(string email, string secret)
        {
            return $"otpauth://totp/ICTVisitors:{email}?secret={secret}&issuer=ICTVisitors";
        }

        public string GenerateQRCodeImage(string uri)
        {
            using var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(uri, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new Base64QRCode(qrCodeData);
            return qrCode.GetGraphic(20);
        }

        public bool ValidateCode(string secret, string code)
        {
            var totp = new Totp(Base32Encoding.ToBytes(secret));
            return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
        }
    }
}
