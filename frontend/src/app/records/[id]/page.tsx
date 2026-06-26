import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecordById } from "@/lib/records";

type RecordDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecordDetailsPage({
  params,
}: RecordDetailsPageProps) {
  const { id } = await params;
  const record = await getRecordById(id);

  if (!record) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        Back to records
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{record.title}</h1>

          {record.provider && (
            <p className="mt-2 text-gray-600">{record.provider}</p>
          )}
        </div>

        <Link
          href={`/records/${record.id}/edit`}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Edit
        </Link>
      </div>

      <section className="mt-8 space-y-6 rounded-lg border p-6">
        <Detail label="Description" value={record.description} />
        <Detail label="Reference number" value={record.referenceNumber} />

        <Detail
          label="Start date"
          value={
            record.startDate
              ? new Date(record.startDate).toLocaleDateString("en-AU")
              : null
          }
        />

        <Detail
          label="Expiry date"
          value={
            record.expiryDate
              ? new Date(record.expiryDate).toLocaleDateString("en-AU")
              : null
          }
        />

        <Detail
          label="Amount"
          value={
            record.amount !== null
              ? `$${record.amount.toFixed(2)}`
              : null
          }
        />
      </section>
    </main>
  );
}

type DetailProps = {
  label: string;
  value: string | null;
};

function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1">{value || "Not provided"}</p>
    </div>
  );
}