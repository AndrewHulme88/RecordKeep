import { getRecords } from "@/lib/records";

export default async function HomePage() {
  const records = await getRecords();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">RecordKeep</h1>
        <p className="mt-2 text-gray-600">
          Keep track of your important records and upcoming dates.
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your records</h2>

          <button
            type="button"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Add record
          </button>
        </div>

        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <h3 className="font-semibold">No records yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create your first record to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {record.title}
                    </h3>

                    {record.provider && (
                      <p className="mt-1 text-sm text-gray-600">
                        {record.provider}
                      </p>
                    )}
                  </div>

                  {record.amount !== null && (
                    <p className="font-medium">
                      ${record.amount.toFixed(2)}
                    </p>
                  )}
                </div>

                {record.description && (
                  <p className="mt-4 text-sm text-gray-700">
                    {record.description}
                  </p>
                )}

                {record.expiryDate && (
                  <p className="mt-4 text-sm">
                    Expires:{" "}
                    {new Date(record.expiryDate).toLocaleDateString("en-AU")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}