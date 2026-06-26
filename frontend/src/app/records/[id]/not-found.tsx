import Link from "next/link";

export default function RecordNotFound() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
            <h1 className="text-3xl font-bold">Record not found</h1>

            <p className="mt-3 text-gray-600">
                This record may have been deleted or does not exist.
            </p>

            <Link
                href="/"
                className="mt-6 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
                Return to Dashboard
            </Link>
        </main>
    );
}