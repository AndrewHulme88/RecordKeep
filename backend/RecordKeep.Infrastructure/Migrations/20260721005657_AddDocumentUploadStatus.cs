using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecordKeep.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentUploadStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsUploaded",
                table: "RecordDocuments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsUploaded",
                table: "RecordDocuments");
        }
    }
}
