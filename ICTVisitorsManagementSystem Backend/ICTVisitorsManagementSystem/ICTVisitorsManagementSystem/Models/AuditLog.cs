using System;

namespace ICTVisitorsManagementSystem.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int? UserId { get; set; }
        public string Username { get; set; }
        public string Action { get; set; }
        public string Module { get; set; }
        public string Details { get; set; }
        public string Status { get; set; } // Success, Warning, Error, Info
        public string IpAddress { get; set; }
    }
}
