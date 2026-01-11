using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Models;
using ICTVisitorsManagementSystem.Models.DTOs;
using ICTVisitorsManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace ICTVisitorsManagementSystem.Controllers
{
    // Ensure only Admins can access
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public AdminController(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest(new { message = "Username already exists" });

            var user = new User
            {
                Full_Name = dto.Full_Name,
                Email = dto.Email,
                Username = dto.Username,
                Pass_word = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                IsGoogleUser = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAction(
                User.Identity?.Name ?? "Admin",
                "Create",
                "Users",
                $"Created new account: {user.Username} ({user.Role})",
                "success",
                Request.HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new { message = "User created successfully" });
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalStaff = await _context.Users.CountAsync(u => u.Role == "Staff");
            var activeAdmins = await _context.Users.CountAsync(u => u.Role == "Admin");
            var totalVisitors = await _context.Visitors.CountAsync();
            
            // Basic system health check
            var systemHealthy = true; // Could be expanded with DB connectivity check

            return Ok(new
            {
                totalStaff,
                activeAdmins,
                totalVisitors,
                systemStatus = systemHealthy ? "Online" : "Degraded",
                alerts = 0 // Mocked for now
            });
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .ToListAsync();
            return Ok(logs);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return Ok(settings);
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] List<SystemSetting> settings)
        {
            foreach (var setting in settings)
            {
                var existing = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == setting.Key);
                if (existing != null)
                {
                    existing.Value = setting.Value;
                }
                else
                {
                    _context.SystemSettings.Add(setting);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Full_Name, u.Email, u.Username, u.Role })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost("users/promote/{id}")]
        public async Task<IActionResult> PromoteToAdmin(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found");

            user.Role = "Admin";
            await _context.SaveChangesAsync();

            await _auditLogService.LogAction(
                User.Identity?.Name ?? "Admin",
                "Promote",
                "Users",
                $"Promoted {user.Username} to Admin",
                "success",
                Request.HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new { message = "User promoted to Admin" });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAction(
                User.Identity?.Name ?? "Admin",
                "Delete",
                "Users",
                $"Deleted user {user.Username}",
                "warning",
                Request.HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new { message = "User deleted" });
        }
    }
}
