using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;

namespace ICTVisitorsManagementSystem.Services
{
    public interface IAuditLogService
    {
        Task LogAction(string username, string action, string module, string details, string status, string ipAddress);
    }

    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;

        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAction(string username, string action, string module, string details, string status, string ipAddress)
        {
            var log = new AuditLog
            {
                Username = username,
                Action = action,
                Module = module,
                Details = details,
                Status = status,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
