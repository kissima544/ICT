using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Models;

namespace ICTVisitorsManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProgramsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProgramsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/programs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AcademicProgram>>> GetPrograms()
        {
            return await _context.Programs
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        // GET: api/programs/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AcademicProgram>> GetProgram(int id)
        {
            var program = await _context.Programs.FindAsync(id);

            if (program == null)
                return NotFound();

            return program;
        }

        // POST: api/programs
        [HttpPost]
        public async Task<ActionResult<AcademicProgram>> CreateProgram(AcademicProgram program)
        {
            if (string.IsNullOrWhiteSpace(program.Name))
                return BadRequest("Program name is required");

            program.CreatedAt = DateTime.Now;
            program.IsActive = true;

            _context.Programs.Add(program);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProgram), new { id = program.Id }, program);
        }

        // PUT: api/programs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProgram(int id, AcademicProgram program)
        {
            if (id != program.Id)
                return BadRequest();

            _context.Entry(program).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProgramExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/programs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProgram(int id)
        {
            var program = await _context.Programs.FindAsync(id);
            if (program == null)
                return NotFound();

            // Soft delete
            program.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProgramExists(int id)
        {
            return _context.Programs.Any(e => e.Id == id);
        }
    }
}
