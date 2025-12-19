using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Models;

namespace ICTVisitorsManagementSystem.Controllers
{
    //[Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class VisitorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VisitorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/visitors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Visitor>>> GetVisitors()
        {
            return await _context.Visitors.ToListAsync();
        }

        // GET: api/visitors/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Visitor>> GetVisitor(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);

            if (visitor == null)
                return NotFound("Visitor not found");

            return visitor;
        }

        // GET: api/visitors/search?query=value
        // GET: api/visitors/search?query=value&page=1&pageSize=10&fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Visitor>>> SearchVisitors(
            [FromQuery] string? Search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest("Page and pageSize must be greater than 0.");

            var visitorsQuery = _context.Visitors.AsQueryable();

            // Filter by query string
            if (!string.IsNullOrWhiteSpace(Search))
            {
                var loweredQuery = Search.ToLower();
                visitorsQuery = visitorsQuery.Where(v =>
                    v.Full_Name.ToLower().Contains(loweredQuery) ||
                    v.Program.ToLower().Contains(loweredQuery) ||
                    v.Purpose.ToLower().Contains(loweredQuery));
            }

            // Filter by date range
            if (fromDate.HasValue)
                visitorsQuery = visitorsQuery.Where(v => v.VisiteDate >= fromDate.Value);
            if (toDate.HasValue)
                visitorsQuery = visitorsQuery.Where(v => v.VisiteDate <= toDate.Value);

            // Pagination
            var totalRecords = await visitorsQuery.CountAsync();
            var results = await visitorsQuery
                .OrderByDescending(v => v.VisiteDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                page,
                pageSize,
                totalRecords,
                totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
                results
            });
        }



        // POST: api/visitors
        [HttpPost]
        public async Task<ActionResult<Visitor>> AddVisitor(Visitor visitor)
        {
            _context.Visitors.Add(visitor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVisitor), new { id = visitor.Id }, visitor);
        }

        // PUT: api/visitors/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVisitor(int id, Visitor updatedVisitor)
        {
            if (id != updatedVisitor.Id)
                return BadRequest("Visitor ID mismatch");

            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound("Visitor not found");

            visitor.Full_Name = updatedVisitor.Full_Name;
            visitor.Program = updatedVisitor.Program;
            visitor.Student_Year = updatedVisitor.Student_Year;
            visitor.Purpose = updatedVisitor.Purpose;
            visitor.VisiteDate = updatedVisitor.VisiteDate;
            visitor.Time_in = updatedVisitor.Time_in;
            visitor.Time_out = updatedVisitor.Time_out;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/visitors/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisitor(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound("Visitor not found");

            _context.Visitors.Remove(visitor);
            await _context.SaveChangesAsync();

            return Ok("Visitor deleted successfully");
        }
    }
}
