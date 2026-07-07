import { useQueryClient } from "@tanstack/react-query";
import {
  useListSessions,
  getListSessionsQueryKey,
  useUpdateSession,
  useDeleteSession,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date";
import { Trash2, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type Session } from "@workspace/api-client-react";
import { useRef } from "react";

export function SessionTable() {
  const { data: sessions, isLoading, error } = useListSessions({
    query: { queryKey: getListSessionsQueryKey() },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const handleToggle = (session: Session, checked: boolean) => {
    // Optimistic UI could be implemented here via queryClient setQueryData
    updateSession.mutate(
      { id: session.id, data: { isActive: checked } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData<Session[]>(getListSessionsQueryKey(), (old) =>
            old ? old.map((s) => (s.id === session.id ? updated : s)) : old
          );
          toast({
            title: "Session updated",
            description: `Session "${session.label}" is now ${checked ? "active" : "inactive"}.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update session state.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = (session: Session) => {
    deleteSession.mutate(
      { id: session.id },
      {
        onSuccess: () => {
          queryClient.setQueryData<Session[]>(getListSessionsQueryKey(), (old) =>
            old ? old.filter((s) => s.id !== session.id) : old
          );
          toast({
            title: "Session removed",
            description: `Session "${session.label}" was deleted.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete session.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-muted-foreground font-mono">
        <span className="animate-pulse">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-destructive/20 bg-destructive/10 text-destructive font-mono gap-4">
        <ShieldAlert className="w-8 h-8" />
        <p>System Failure: Unable to fetch sessions.</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="w-full border border-dashed border-border flex flex-col items-center justify-center p-16 text-muted-foreground font-mono">
        <p>No sessions configured. Inject a cookie to begin.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-border bg-card">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-secondary text-secondary-foreground border-b border-border font-mono">
          <tr>
            <th className="px-4 py-3 w-12 text-center">Status</th>
            <th className="px-4 py-3 min-w-[200px]">Label</th>
            <th className="px-4 py-3 min-w-[300px]">Payload Signature</th>
            <th className="px-4 py-3">Injected At</th>
            <th className="px-4 py-3 w-16 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="font-mono text-sm divide-y divide-border">
          {sessions.map((session) => (
            <tr
              key={session.id}
              className={`hover:bg-muted/30 transition-colors ${
                session.isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <td className="px-4 py-3 text-center align-middle">
                <Switch
                  checked={session.isActive}
                  onCheckedChange={(checked) => handleToggle(session, checked)}
                  disabled={updateSession.isPending && updateSession.variables?.id === session.id}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {session.label}
              </td>
              <td className="px-4 py-3 font-mono text-xs opacity-70">
                {session.cookieValue.length > 40
                  ? session.cookieValue.substring(0, 40) + "..."
                  : session.cookieValue}
              </td>
              <td className="px-4 py-3 whitespace-nowrap opacity-70">
                {formatDate(session.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="font-sans">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Purge session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the session
                        labeled <span className="font-mono text-foreground">{session.label}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(session)}
                      >
                        Purge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
