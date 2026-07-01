using RecordKeep.Api.Contracts.Records;

namespace RecordKeep.Api.Validation;

public static class RecordRequestValidator
{
    public static Dictionary<string, string[]> Validate(CreateRecordRequest request)
    {
        return ValidateFields(
            request.Title,
            request.Provider,
            request.ReferenceNumber,
            request.StartDate,
            request.ExpiryDate,
            request.Amount);
    }

    public static Dictionary<string, string[]> Validate(UpdateRecordRequest request)
    {
        return ValidateFields(
            request.Title,
            request.Provider,
            request.ReferenceNumber,
            request.StartDate,
            request.ExpiryDate,
            request.Amount);
    }

    public static Dictionary<string, string[]> ValidateFields(
        string title,
        string? provider,
        string? referenceNumber,
        DateOnly? startDate,
        DateOnly? expiryDate,
        decimal? amount)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = ["Title is required."];
        }
        else if (title.Length > 200)
        {
            errors["title"] = ["Title cannot exceed 200 characters."];
        }

        if (provider?.Length > 200)
        { 
            errors["provider"] = ["Provider cannot exceed 200 characters."];
        }

        if (referenceNumber?.Length > 100)
        {
            errors["referenceNumber"] = ["Reference number cannot exceed 100 characters."];
        }

        if (amount < 0)
        {
            errors["amount"] = ["Amount cannot be negative."];
        }

        if (
            startDate.HasValue &&
            expiryDate.HasValue &&
            expiryDate < startDate
        )
        {
            errors["expiryDate"] = ["Expiry date cannot be before the start date."];
        }

        return errors;
    }
}