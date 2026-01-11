namespace ICTVisitorsManagementSystem.Models
{
    public class SystemSetting
    {
        public int Id { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
        public string Category { get; set; } // General, Security, Notifications, etc.
        public string Description { get; set; }
    }
}
