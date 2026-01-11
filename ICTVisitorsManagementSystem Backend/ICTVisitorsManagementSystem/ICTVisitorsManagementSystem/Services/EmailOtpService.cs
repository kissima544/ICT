using ICTVisitorsManagementSystem.Services.Interfaces;
using System.Net.Mail;
using System.Net;
using System.IO;

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
                From = new MailAddress(_config["Email:From"], "ICT Visitors System"),
                Subject = $"{otp} is your verification code",
                Body = $@"
                <html>
                <body style=""margin: 0; padding: 0; background-color: #f1f5f9;"">
                    <div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;"">
                        <div style=""text-align: center; padding-bottom: 20px;"">
                            <h2 style=""color: #2563eb; margin: 0;"">ICT Visitors Management</h2>
                            <p style=""color: #64748b; font-size: 14px; margin-top: 5px;"">Secure Authentication</p>
                        </div>
                        <div style=""padding: 30px 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;"">
                            <p style=""color: #1e293b; font-size: 16px; margin-bottom: 20px;"">Hello,</p>
                            <p style=""color: #475569; font-size: 15px; margin-bottom: 30px;"">Use the code below to verify your login attempt. This code will expire soon.</p>
                            <div style=""font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; padding: 20px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px; display: inline-block; min-width: 200px;"">
                                {otp}
                            </div>
                        </div>
                        <div style=""margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;"">
                            <p>If you didn't request this code, you can safely ignore this email.</p>
                            <p style=""margin-top: 10px;"">&copy; {DateTime.Now.Year} ICT Visitors Management System</p>
                        </div>
                    </div>
                </body>
                </html>",
                IsBodyHtml = true
            };
            message.To.Add(email);

            await smtpClient.SendMailAsync(message);
        }

    }
}
