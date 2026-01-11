using System.Text.Json.Serialization;

namespace ICTVisitorsManagementSystem.Models
{
    public class Visitor
    {
        public int Id { get; set; }
        public string Full_Name { get; set; }
        public string Program { get; set; }
        public string Student_Year { get; set; }
        public string Purpose { get; set; }
        public string? Department { get; set; }
        public string? Email { get; set; }
        public DateTime VisiteDate { get; set; } = DateTime.Now;
        public string? Time_in { get; set; }
        public string? Time_out { get; set; }
        
        // Unique token for QR code check-in
        public string? VisitToken { get; set; }

        // Feedback rating (1-5)
        public int? Rating { get; set; }

        // Base64 encoded selfie
        [JsonPropertyName("photo")]
        public string? Photo { get; set; }
    }
}
