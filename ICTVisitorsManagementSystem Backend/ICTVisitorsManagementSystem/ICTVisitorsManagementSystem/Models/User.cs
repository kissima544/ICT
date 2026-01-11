namespace ICTVisitorsManagementSystem.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Full_Name { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Pass_word { get; set; }

        // To support Google login
        public bool IsGoogleUser { get; set; } = false;

        // ✅ Optionally, store Google's unique ID
        public string? GoogleId { get; set; }

        public string? PasswordResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }

        // Role-based access control
        public string Role { get; set; } = "Staff"; // Admin, Staff, Security

    }
}
