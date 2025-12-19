using ICTVisitorsManagementSystem.Services.Interfaces;
using System.Net.Mail;
using System.Net;

namespace ICTVisitorsManagementSystem.Services
{
    public class EmailOtpService : IEmailOtpService
    {
        private readonly IConfiguration _config;

        public EmailOtpService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendOtpAsync(string email, string otp)
        {
            var smtpClient = new SmtpClient(_config["Email:SmtpHost"])
            {
                Port = int.Parse(_config["Email:SmtpPort"]),
                Credentials = new NetworkCredential(_config["Email:SmtpUser"], _config["Email:SmtpPass"]),
                EnableSsl = true,
            };

            var message = new MailMessage
            {
                From = new MailAddress(_config["Email:From"]),
                Subject = "Your Authentication Code",
                Body = $"Your Authentication code is: {otp}",
                IsBodyHtml = false
            };
            message.To.Add(email);

            await smtpClient.SendMailAsync(message);
        }
    }
}
