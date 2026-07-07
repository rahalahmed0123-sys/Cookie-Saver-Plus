import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="font-mono flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-destructive">404</h1>
        <p className="text-lg text-muted-foreground">Session not found.</p>
        <Link href="/" className="mt-4 border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors">
          RETURN TO ROOT
        </Link>
      </div>
    </div>
  );
}
