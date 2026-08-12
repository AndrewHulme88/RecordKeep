using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecordKeep.Domain.Documents;

namespace RecordKeep.Infrastructure.Persistence.Configurations;

public sealed class DocumentExtractionConfiguration : IEntityTypeConfiguration<DocumentExtraction>
{
    public void Configure(EntityTypeBuilder<DocumentExtraction> builder)
    {
        builder.HasKey(extraction => extraction.Id);
        builder.Property(extraction => extraction.UserId).IsRequired().HasMaxLength(100);
        builder.Property(extraction => extraction.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);
        builder.Property(extraction => extraction.Provider).HasMaxLength(100);
        builder.Property(extraction => extraction.ModelName).HasMaxLength(100);
        builder.Property(extraction => extraction.SchemaVersion).IsRequired().HasMaxLength(30);
        builder.Property(extraction => extraction.ExtractedFieldsJson).HasColumnType("jsonb");
        builder.Property(extraction => extraction.EvidenceJson).HasColumnType("jsonb");
        builder.Property(extraction => extraction.RawResultJson).HasColumnType("jsonb");
        builder.Property(extraction => extraction.ErrorCode).HasMaxLength(100);
        builder.Property(extraction => extraction.CreatedAtUtc).IsRequired();

        builder.HasOne(extraction => extraction.Document)
            .WithMany(document => document.Extractions)
            .HasForeignKey(extraction => extraction.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(extraction => new { extraction.DocumentId, extraction.CreatedAtUtc });
        builder.HasIndex(extraction => new { extraction.UserId, extraction.Status });
    }
}
