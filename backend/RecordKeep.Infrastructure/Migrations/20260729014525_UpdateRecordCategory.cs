using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecordKeep.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRecordCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing rows are NULL; backfill before making the column required.
            migrationBuilder.Sql(
                """
                UPDATE "Records"
                SET "Category" = 'Other'
                WHERE "Category" IS NULL OR btrim("Category") = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Records",
                type: "text",
                nullable: false,
                defaultValue: "Other",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Records",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Other");
        }
    }
}
