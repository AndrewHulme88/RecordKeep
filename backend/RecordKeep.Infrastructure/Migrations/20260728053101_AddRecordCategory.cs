using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecordKeep.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecordCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Records",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Records");
        }
    }
}
