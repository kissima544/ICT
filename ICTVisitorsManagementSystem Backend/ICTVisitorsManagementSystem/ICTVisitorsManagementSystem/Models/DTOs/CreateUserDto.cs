namespace ICTVisitorsManagementSystem.Models.DTOs
{
    public class CreateUserDto
    {
        public string Full_Name { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } = "Staff";
    }
}
