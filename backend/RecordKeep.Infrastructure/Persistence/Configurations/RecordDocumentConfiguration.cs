using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecordKeep.Domain.Documents;

namespace RecordKeep.Infrastructure.Persistence.Configurations;

public sealed class RecordDocumentConfiguration : IEntityTypeConfiguration<RecordDocument>
{
    public void Configure(EntityTypeBuilder<RecordDocument> builder)
    {
        builder.HasKey(document => document.Id);
        builder.Property(document => document.UserId).IsRequired().HasMaxLength(100);
        builder.Property(document => document.OriginalFileName).IsRequired().HasMaxLength(100);
        builder.Property(document => document.ObjectKey).IsRequired().HasMaxLength(1024);
        builder.Property(document => document.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(document => document.SizeBytes).IsRequired();
        builder.Property(document => document.CreatedAtUtc).IsRequired();
        builder.HasOne(document => document.Record)
            .WithMany(record => record.Documents)
            .HasForeignKey(document => document.RecordId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(document => document.RecordId);
        builder.HasIndex(document => document.UserId);
        builder.HasIndex(document => document.ObjectKey).IsUnique();
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_RecordDocuments_SizeBytes_Positive", "\"SizeBytes\" > 0");
        });
    }
}