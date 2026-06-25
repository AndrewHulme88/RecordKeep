using Microsoft.EntityFrameworkCore;
using RecordKeep.Domain.Records;

namespace RecordKeep.Infrastructure.Persistence;

public class ApplicationDbContext
    : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Record> Records => Set<Record>();
}