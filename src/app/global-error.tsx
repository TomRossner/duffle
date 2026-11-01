"use client";

import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong.</h1>
        <p>The page could not be loaded. Try it again.</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
