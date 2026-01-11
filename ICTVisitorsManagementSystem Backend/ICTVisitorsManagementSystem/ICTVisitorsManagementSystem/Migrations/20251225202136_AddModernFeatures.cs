using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ICTVisitorsManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddModernFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VisitToken",
                table: "Visitors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VisitToken",
                table: "Visitors");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
