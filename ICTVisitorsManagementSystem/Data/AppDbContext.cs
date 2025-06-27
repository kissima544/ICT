using Microsoft.EntityFrameworkCore;
using ICTVisitorsManagementSystem.Models;
using System.Collections.Generic;
namespace ICTVisitorsManagementSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Visitor> Visitors { get; set; }
    }
}
