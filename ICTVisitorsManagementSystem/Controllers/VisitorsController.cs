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
