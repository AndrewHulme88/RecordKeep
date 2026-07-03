using Microsoft.EntityFrameworkCore;
using RecordKeep.Domain.Records;
using RecordKeep.Domain.Documents;

namespace RecordKeep.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Record> Records => Set<Record>();

    public DbSet<RecordDocument> RecordDocuments => Set<RecordDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}