import { StatsBar } from "@/components/StatsBar";
import { SessionTable } from "@/components/SessionTable";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <StatsBar />
        
        <div className="mb-4">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            // Session_Registry
          </h2>
        </div>
        
        <SessionTable />
      </div>
    </div>
  );
}
