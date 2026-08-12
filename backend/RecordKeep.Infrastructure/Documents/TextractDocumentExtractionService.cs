using System.Text.Json;
using Amazon.Textract;
using Amazon.Textract.Model;
using Microsoft.Extensions.Options;
using RecordKeep.Application.Documents;

namespace RecordKeep.Infrastructure.Documents;

public sealed class TextractDocumentExtractionService(
    IAmazonTextract textract,
    IOptions<S3Options> s3Options) : IDocumentExtractionService
{
    private const string SchemaVersion = "1";

    private static readonly Query[] Queries =
    [
        new() { Alias = "title", Text = "What is the title or document type?" },
        new() { Alias = "provider", Text = "Who issued or provided this document?" },
        new() { Alias = "referenceNumber", Text = "What is the policy, account, invoice, or reference number?" },
        new() { Alias = "startDate", Text = "What is the start or issue date?" },
        new() { Alias = "expiryDate", Text = "What is the expiry or end date?" },
        new() { Alias = "amount", Text = "What is the total, premium, balance, or amount?" }
    ];

    public async Task<DocumentExtractionResult> ExtractAsync(
        DocumentExtractionRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await textract.AnalyzeDocumentAsync(
            new AnalyzeDocumentRequest
            {
                Document = new Document
                {
                    S3Object = new S3Object
                    {
                        Bucket = s3Options.Value.BucketName,
                        Name = request.ObjectKey
                    }
                },
                FeatureTypes = ["FORMS", "QUERIES", "LAYOUT"],
                QueriesConfig = new QueriesConfig { Queries = Queries.ToList() }
            },
            cancellationToken);

        var blocks = response.Blocks ?? [];
        var blocksById = blocks
            .Where(block => !string.IsNullOrWhiteSpace(block.Id))
            .ToDictionary(block => block.Id);

        var extractedFields = new Dictionary<string, string?>();
        var evidence = new Dictionary<string, object?>();

        foreach (var queryBlock in blocks.Where(block => block.BlockType?.Value == "QUERY"))
        {
            var alias = queryBlock.Query?.Alias;
            if (string.IsNullOrWhiteSpace(alias))
            {
                continue;
            }

            var answerId = (queryBlock.Relationships ?? [])
                .Where(relationship => relationship.Type?.Value == "ANSWER")
                .SelectMany(relationship => relationship.Ids ?? [])
                .FirstOrDefault();

            blocksById.TryGetValue(answerId ?? string.Empty, out var answer);
            extractedFields[alias] = answer?.Text;
            evidence[alias] = answer is null
                ? null
                : new { answer.Text, answer.Confidence, answer.Page };
        }

        var rawResult = new
        {
            response.AnalyzeDocumentModelVersion,
            response.DocumentMetadata?.Pages,
            Blocks = blocks.Select(block => new
            {
                block.Id,
                BlockType = block.BlockType?.Value,
                block.Text,
                block.Confidence,
                block.Page,
                EntityTypes = block.EntityTypes ?? [],
                Query = block.Query is null ? null : new { block.Query.Alias, block.Query.Text },
                Relationships = (block.Relationships ?? []).Select(relationship => new
                {
                    Type = relationship.Type?.Value,
                    Ids = relationship.Ids ?? []
                }),
                BoundingBox = block.Geometry?.BoundingBox is null
                    ? null
                    : new
                    {
                        block.Geometry.BoundingBox.Left,
                        block.Geometry.BoundingBox.Top,
                        block.Geometry.BoundingBox.Width,
                        block.Geometry.BoundingBox.Height
                    }
            })
        };

        return new DocumentExtractionResult(
            Provider: "Amazon Textract",
            ModelName: response.AnalyzeDocumentModelVersion,
            SchemaVersion,
            JsonSerializer.Serialize(extractedFields),
            JsonSerializer.Serialize(evidence),
            JsonSerializer.Serialize(rawResult));
    }
}
