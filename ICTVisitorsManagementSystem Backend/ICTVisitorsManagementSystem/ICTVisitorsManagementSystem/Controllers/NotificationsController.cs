using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Models;

namespace ICTVisitorsManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications?email=user@example.com
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required");

            // For Admin: Fetch all messages involving Admin OR System messages (to see context)
            if (email.Equals("admin@ict.com", StringComparison.OrdinalIgnoreCase))
            {
                return await _context.Notifications
                    .Where(n => n.ReceiverEmail == email || 
                                n.SenderEmail == email || 
                                n.SenderEmail == "System")
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();
            }

            // For Students: Fetch messages sent TO them
            return await _context.Notifications
                .Where(n => n.ReceiverEmail == email)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // POST: api/notifications/reply
        [HttpPost("reply")]
        public async Task<IActionResult> Reply([FromBody] Notification reply)
        {
            if (string.IsNullOrEmpty(reply.SenderEmail) || string.IsNullOrEmpty(reply.ReceiverEmail) || string.IsNullOrEmpty(reply.Message))
                return BadRequest("Invalid message data");

            reply.CreatedAt = DateTime.Now;
            reply.IsRead = false;
            
            _context.Notifications.Add(reply);
            await _context.SaveChangesAsync();

            return Ok(reply);
        }

        // PUT: api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
