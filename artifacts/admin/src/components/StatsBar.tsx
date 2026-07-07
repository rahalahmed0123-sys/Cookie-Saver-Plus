import { useListSessions, getListSessionsQueryKey } from "@workspace/api-client-react";
import { Activity, ShieldAlert, Cpu } from "lucide-react";
import { CreateSessionDialog } from "./CreateSessionDialog";

export function StatsBar() {
  const { data: sessions } = useListSessions({
    query: { queryKey: getListSessionsQueryKey() },
  });

  const totalSessions = sessions?.length || 0;
  const activeSessions = sessions?.filter((s) => s.isActive).length || 0;
  const hasNoActive = totalSessions > 0 && activeSessions === 0;

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" />
            NETFLIXY_ADMIN
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            v1.0.0 // SESSION_CONTROLLER
          </p>
        </div>
        <div>
          <CreateSessionDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary text-secondary-foreground rounded-sm">
              <Activity className="w-5 h-5 opacity-70" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase">Vaulted Sessions</p>
              <p className="text-2xl font-mono">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className={`border p-4 flex items-center justify-between transition-colors ${hasNoActive ? 'border-destructive bg-destructive/5' : 'border-border bg-card'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-sm ${hasNoActive ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
              {hasNoActive ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <p className={`text-xs font-mono uppercase ${hasNoActive ? 'text-destructive' : 'text-muted-foreground'}`}>
                Active Sessions
              </p>
              <p className={`text-2xl font-mono ${hasNoActive ? 'text-destructive' : 'text-primary'}`}>
                {activeSessions} <span className="text-sm text-muted-foreground">/ {totalSessions}</span>
              </p>
            </div>
          </div>
          {hasNoActive && (
            <div className="text-right">
              <p className="text-xs text-destructive font-mono font-bold animate-pulse">WARNING</p>
              <p className="text-[10px] text-destructive/80 font-mono uppercase">Extension inoperative</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
