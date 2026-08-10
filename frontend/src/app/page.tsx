"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthControls from "@/components/AuthControls";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import type { RecordItem } from "@/types/record";
import { getRecords } from "@/lib/records";
import { RECORD_CATEGORIES, type RecordCategory } from "@/lib/record-categories";

export default function HomePage() {
  const { isSignedIn, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <main className="page-shell flex items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Opening Record Keep…</p>
      </main>
    );
  }

  return isSignedIn ? <RecordsWorkspace /> : <LandingPage />;
}

function LandingPage() {
  return (
    <main className="page-shell !pt-16">
      <header className="flex min-h-[62vh] justify-center pb-24 text-center">
        <div className="max-w-4xl">

          <h1 className="display-title mt-6 !font-bold">
            Keeping you organised
          </h1>

          <p className="lede mx-auto mt-7">
            Keep policies, warranties, licences, subscriptions and their
            supporting documents together in one private, organised space.
          </p>

          <div className="mt-9 flex justify-center">
            <AuthControls />
          </div>
        </div>
      </header>

      <section className="border-t border-[var(--line)] py-14">
        <p className="eyebrow text-center">Everything in one place</p>

        <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-14">
          <LandingFeature
            title="Keep the essentials"
            description="Save providers, reference numbers, important dates, costs and notes without digging through email and documents."
          />
          <LandingFeature
            title="Digital paperwork"
            description="Upload policies, receipts, warranties and supporting files to access them anywhere."
          />
          <LandingFeature
            title="Stay informed"
            description="Get reminders when payments are coming up. Never get caught by forgotten subscription fees and renewals again."
          />
        </div>
      </section>

      <section className="flex flex-col items-center gap-8 border-t border-[var(--line)] py-14 text-center">
        <div className="flex flex-col items-center">
          <h2 className="page-title mt-4 max-w-xl">Sign up and take control of your life today.</h2>
        </div>
        <AuthControls />
      </section>
    </main>
  );
}

function LandingFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article>
      <h2 className="section-title">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </article>
  );
}

function RecordsWorkspace() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"" | RecordCategory>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getRecords(
          {
            category: selectedCategory || undefined,
            signal: controller.signal,
          },
        );
        setRecords(data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load records:", loadError);
        setError("Could not load your records. Please refresh the page and try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecords();

    return () => controller.abort();
  }, [selectedCategory]);

  return (
    <main className="page-shell !pt-14">
      <header className="mb-16 flex items-start justify-between gap-8">
        <div>
          <h1 className="page-title mt-4 !font-bold">Your records</h1>
          <Link href="/records/new" className="button-primary mt-6">
            Add record
          </Link>
        </div>
        <AuthControls />
      </header>

      <section>
        <div className="mb-6 flex flex-col gap-5 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Saved records</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {records.length > 0
                ? `${records.length} saved ${records.length === 1 ? "record" : "records"}`
                : "A clear view of what matters."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as "" | RecordCategory)
              }
              className="field category-filter min-w-44 !py-2 text-sm"
            >
              <option value="">All categories</option>
              {RECORD_CATEGORIES.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>

          </div>
        </div>

        {isLoading ? (
          <div className="quiet-state">
            <p className="text-[var(--muted)]">Loading your archive…</p>
          </div>
        ) : error ? (
          <div className="quiet-state">
            <h3 className="section-title">Unable to load your archive</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">{error}</p>
          </div>
        ) : records.length === 0 ? (
          selectedCategory ? (
            <div className="quiet-state">
              <h3 className="section-title">Nothing filed here yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                There are no {selectedCategory.toLowerCase()} records yet. Try
                another category or add a new record.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="button-secondary mt-5"
              >
                Show all categories
              </button>
            </div>
          ) : (
            <div className="quiet-state">
              <h3 className="section-title">A clean slate</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                Create your first record to start tracking a policy, warranty,
                licence, subscription or other important document.
              </p>
              <Link href="/records/new" className="button-primary mt-6">
                Create your first record
              </Link>
            </div>
          )
        ) : (
          <div>
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="group block border-b border-[var(--line)] py-6 transition first:pt-1 hover:pl-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-[1.35rem] font-bold tracking-[-0.025em] group-hover:text-[var(--accent)]">
                      {record.title}
                    </h3>
                    {record.category && (
                      <p className="mt-2 text-xs font-bold tracking-[0.09em] text-[var(--accent)] uppercase">
                        {record.category}
                      </p>
                    )}
                    {record.provider && (
                      <p className="mt-1 text-sm text-[var(--muted)]">{record.provider}</p>
                    )}
                  </div>
                  {record.amount !== null && (
                    <p className="shrink-0 font-serif text-lg">
                      ${record.amount.toFixed(2)}
                    </p>
                  )}
                </div>

                {record.description && (
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    {record.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold tracking-[0.02em] text-[var(--muted)]">
                  {record.referenceNumber && (
                    <span>Reference: {record.referenceNumber}</span>
                  )}
                  {record.expiryDate && (
                    <span>
                      Expires: {new Date(record.expiryDate).toLocaleDateString("en-AU")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
