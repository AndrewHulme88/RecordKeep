using RecordKeep.Api.Contracts.Documents;

namespace RecordKeep.Api.Validation;

public static class DocumentRequestValidator
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly string[] AllowedContentTypes =
    [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    public static Dictionary<string, string[]> ValidateUploadUrlRequest(
        CreateDocumentUploadUrlRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            errors["fileName"] = ["File name is required."];
        }
        else if (request.FileName.Length > 255)
        {
            errors["fileName"] = ["File name cannot exceed 255 characters."];
        }

        if (string.IsNullOrWhiteSpace(request.ContentType))
        {
            errors["contentType"] = ["Content type is required."];
        }
        else if (!AllowedContentTypes.Contains(
            request.ContentType,
            StringComparer.OrdinalIgnoreCase))
        {
            errors["contentType"] =
            [
                "Only PDF, JPEG, and PNG files are supported."
            ];
        }

        if (request.SizeBytes <= 0)
        {
            errors["sizeBytes"] = ["File size must be greater than zero."];
        }
        else if (request.SizeBytes > MaxFileSizeBytes)
        {
            errors["sizeBytes"] = ["File size cannot exceed 10 MB."];
        }

        return errors;
    }
}