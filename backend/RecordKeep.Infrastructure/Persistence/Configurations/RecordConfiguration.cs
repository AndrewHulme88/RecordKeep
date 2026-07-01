using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Infrastructure.Persistence.Configurations;

public sealed class RecordConfiguration : IEntityTypeConfiguration<RecordEntity>
{
    // Validation configuration for records at database level
    public void Configure(EntityTypeBuilder<RecordEntity> builder)
    {
        builder.HasKey(record => record.Id);
        builder.Property(record => record.UserId).IsRequired().HasMaxLength(100);
        builder.Property(record => record.Title).IsRequired().HasMaxLength(200);
        builder.Property(record => record.Provider).HasMaxLength(200);
        builder.Property(record => record.Description).HasMaxLength(2000);
        builder.Property(record => record.ReferenceNumber).HasMaxLength(100);
        builder.Property(record => record.Amount).HasPrecision(18, 2);
        builder.HasIndex(record => record.UserId);

        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_Records_Amount_NonNegative", 
                "\"Amount\" IS NULL OR \"Amount\" >= 0");

            table.HasCheckConstraint(
                "CK_Records_ExpiryDate_After_StartDate",
                "\"StartDate\" IS NULL OR " +
                "\"ExpiryDate\" IS NULL OR " +
                "\"ExpiryDate\" >= \"StartDate\"");
        });
    }
}