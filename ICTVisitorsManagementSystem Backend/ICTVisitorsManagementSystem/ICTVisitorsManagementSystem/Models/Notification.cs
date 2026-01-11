using System;

namespace ICTVisitorsManagementSystem.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string SenderEmail { get; set; }
        public string ReceiverEmail { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; } = false;
        public int? ParentId { get; set; } // For threading
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
