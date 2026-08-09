import Link from "next/link";

export default function RecordNotFound() {
    return (
        <main className="page-shell page-shell--narrow quiet-state !mt-12">
            <h1 className="page-title">Record not found</h1>

            <p className="mt-3 text-gray-600">
                This record may have been deleted or does not exist.
            </p>

            <Link
                href="/"
                className="button-primary mt-6"
            >
                Return to Dashboard
            </Link>
        </main>
    );
}
