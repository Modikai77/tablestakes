import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto mt-12 max-w-xl p-8 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-[var(--muted)]">That record is not in the library.</p>
      <Link className="button mt-5" href="/">
        Back to library
      </Link>
    </div>
  );
}

