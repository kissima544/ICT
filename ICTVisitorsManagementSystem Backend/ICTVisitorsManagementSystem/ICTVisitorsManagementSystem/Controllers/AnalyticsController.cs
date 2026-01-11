using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ICTVisitorsManagementSystem.Data;

namespace ICTVisitorsManagementSystem.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var today = DateTime.Today;
            var visitors = await _context.Visitors.ToListAsync();
            
            var stats = new
            {
                TotalVisitorsToday = visitors.Count(v => v.VisiteDate.Date == today),
                ActiveNow = visitors.Count(v => string.IsNullOrEmpty(v.Time_out) && v.VisiteDate.Date == today),
                OccupancyRate = 65, // Formula could be (ActiveNow / Capacity) * 100
                PeakHour = "2:00 PM"
            };
            return Ok(stats);
        }

        [HttpGet("happiness")]
        public async Task<IActionResult> GetHappinessScore()
        {
            var ratings = await _context.Visitors
                .Where(v => v.Rating.HasValue && !string.IsNullOrEmpty(v.Department))
                .GroupBy(v => v.Department)
                .Select(g => new
                {
                    department = g.Key,
                    averageRating = Math.Round(g.Average(v => v.Rating.Value), 1),
                    totalReviews = g.Count()
                })
                .ToListAsync();

            return Ok(ratings);
        }

        [HttpGet("chart-data")]
        public IActionResult GetChartData()
        {
            // Simulated hourly data for "Today"
            var data = new[]
            {
                new { time = "08:00", visitors = 5, predicted = 4 },
                new { time = "09:00", visitors = 12, predicted = 15 },
                new { time = "10:00", visitors = 25, predicted = 22 },
                new { time = "11:00", visitors = 18, predicted = 25 },
                new { time = "12:00", visitors = 15, predicted = 18 },
                new { time = "13:00", visitors = 8, predicted = 10 },
                new { time = "14:00", visitors = 22, predicted = 25 },
                new { time = "15:00", visitors = 30, predicted = 28 },
                new { time = "16:00", visitors = 15, predicted = 12 },
                new { time = "17:00", visitors = 5, predicted = 6 }
            };
            return Ok(data);
        }
    }
}
