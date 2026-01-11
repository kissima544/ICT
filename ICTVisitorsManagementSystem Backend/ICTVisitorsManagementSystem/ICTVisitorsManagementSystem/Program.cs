using ICTVisitorsManagementSystem.Data;
using ICTVisitorsManagementSystem.Services;
using ICTVisitorsManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Validate Critical Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("YOUR_SQL_SERVER_CONNECTION_STRING"))
{
    Console.WriteLine("❌ ERROR: Connection String is missing or set to placeholder. Please update appsettings.json on the server.");
}

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Contains("YOUR_SUPER_SECURE_JWT_KEY"))
{
    Console.WriteLine("❌ ERROR: JWT Key is missing or set to placeholder. Please update appsettings.json on the server.");
}


// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add custom services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailOtpService, EmailOtpService>();
builder.Services.AddSingleton<IOtpService, OtpService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Add controllers and endpoints
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS (allow all origins for dev)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure JWT authentication
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]);
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };

    // ? Return proper JSON on 401
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse(); // skip default response

            var response = context.Response;
            response.StatusCode = 401;
            response.ContentType = "application/json";

            var error = new
            {
                status = 401,
                message = "Unauthorized: JWT token is missing or invalid."
            };

            await response.WriteAsync(JsonSerializer.Serialize(error));
        }
    };
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    options.CallbackPath = "/api/externalauth/google-callback";
    options.SaveTokens = true;
});

// Configure Swagger with JWT auth support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ICT Visitors API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter 'Bearer {your token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Enable Swagger in all environments for debugging
app.UseDeveloperExceptionPage(); 
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ICT Visitors API v1");
    c.RoutePrefix = "swagger"; 
});


app.UseHttpsRedirection();

app.UseCors("AllowAll"); // ? CORS must come before auth

app.UseAuthentication();
app.UseAuthorization();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Apply standard migrations
    try
    {
        db.Database.Migrate();
        Console.WriteLine("✅ Database Migrations applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ ERROR: Database Migration failed: {ex.Message}");
    }

    // Manual SQL migration for Visitor table changes (since EF CLI is unavailable)
    try 
    {
        var sql = @"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Department' AND Object_ID = Object_ID(N'Visitors'))
            BEGIN
                ALTER TABLE Visitors ADD Department nvarchar(MAX) NULL;
            END

            -- Ensure Time_in and Time_out are nvarchar (string)
            IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'Time_in' AND Object_ID = Object_ID(N'Visitors') AND system_type_id != 231)
            BEGIN
                ALTER TABLE Visitors ALTER COLUMN Time_in nvarchar(MAX) NULL;
            END

            IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'Time_out' AND Object_ID = Object_ID(N'Visitors') AND system_type_id != 231)
            BEGIN
                ALTER TABLE Visitors ALTER COLUMN Time_out nvarchar(MAX) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Rating' AND Object_ID = Object_ID(N'Visitors'))
            BEGIN
                ALTER TABLE Visitors ADD Rating int NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Photo' AND Object_ID = Object_ID(N'Visitors'))
            BEGIN
                ALTER TABLE Visitors ADD Photo nvarchar(MAX) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Email' AND Object_ID = Object_ID(N'Visitors'))
            BEGIN
                ALTER TABLE Visitors ADD Email nvarchar(MAX) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
            BEGIN
                CREATE TABLE Notifications (
                    Id int IDENTITY(1,1) PRIMARY KEY,
                    SenderEmail nvarchar(MAX) NOT NULL,
                    ReceiverEmail nvarchar(MAX) NOT NULL,
                    Message nvarchar(MAX) NOT NULL,
                    IsRead bit NOT NULL,
                    ParentId int NULL,
                    CreatedAt datetime2 NOT NULL
                );
            END
            ELSE
            BEGIN
                -- Alter existing table if it was just created with UserEmail
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'SenderEmail' AND Object_ID = Object_ID(N'Notifications'))
                BEGIN
                     -- Rename/Add columns strategy. Since it's dev, we can just add new ones.
                     -- Assuming UserEmail was the receiver
                     EXEC sp_rename 'Notifications.UserEmail', 'ReceiverEmail', 'COLUMN';
                     ALTER TABLE Notifications ADD SenderEmail nvarchar(MAX) DEFAULT 'System' WITH VALUES;
                     ALTER TABLE Notifications ADD ParentId int NULL;
                END
            END

            -- Create Departments table
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
            BEGIN
                CREATE TABLE Departments (
                    Id int IDENTITY(1,1) PRIMARY KEY,
                    Name nvarchar(MAX) NOT NULL,
                    IsActive bit NOT NULL DEFAULT 1,
                    CreatedAt datetime2 NOT NULL DEFAULT GETDATE()
                );
            END

            -- Create Programs table
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Programs')
            BEGIN
                CREATE TABLE Programs (
                    Id int IDENTITY(1,1) PRIMARY KEY,
                    Name nvarchar(MAX) NOT NULL,
                    IsActive bit NOT NULL DEFAULT 1,
                    CreatedAt datetime2 NOT NULL DEFAULT GETDATE()
                );
            END
        ";
        db.Database.ExecuteSqlRaw(sql);
        Console.WriteLine("✅ Manual SQL Migration applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Manual SQL Migration warning: {ex.Message}");
    }
}

app.MapControllers();

app.Run();
