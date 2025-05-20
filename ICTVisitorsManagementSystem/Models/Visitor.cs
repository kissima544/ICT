namespace ICTVisitorsManagementSystem.Models
{
    public class Visitor
    {
        public int Id { get; set; }
        public string Full_Name { get; set; }
        public string Program { get; set; }
        public string Student_Year { get; set; }
        public string Purpose { get; set; }
        public DateTime VisiteDate { get; set; }
        public TimeSpan Time_in { get; set; }
        public TimeSpan Time_out { get; set; }
    }

}
