import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateSession,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Terminal } from "lucide-react";

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  cookieValue: z.string().min(1, "Cookie value is required"),
});

type FormValues = z.infer<typeof schema>;

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSession = useCreateSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      cookieValue: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createSession.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          toast({
            title: "Session created",
            description: `Session "${data.label}" added to the vault.`,
          });
          setOpen(false);
          reset();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to inject session.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono" size="sm">
          <Plus className="w-4 h-4" />
          INJECT SESSION
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            NEW_SESSION_INJECTION
          </DialogTitle>
          <DialogDescription className="font-mono text-xs opacity-70">
            Provide an identifiable label and paste the raw Netscape cookie format or a valid token.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="label" className="font-mono uppercase text-xs text-muted-foreground">
              Identifier
            </Label>
            <Input
              id="label"
              placeholder="e.g. Account-Alpha-01"
              className="font-mono bg-background"
              autoComplete="off"
              {...register("label")}
            />
            {errors.label && (
              <p className="text-xs text-destructive font-mono mt-1">
                {errors.label.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cookieValue" className="font-mono uppercase text-xs text-muted-foreground">
              Payload (Cookie Data)
            </Label>
            <Textarea
              id="cookieValue"
              placeholder="PASTE_RAW_DATA_HERE"
              className="font-mono bg-background min-h-[200px] resize-y"
              {...register("cookieValue")}
            />
            {errors.cookieValue && (
              <p className="text-xs text-destructive font-mono mt-1">
                {errors.cookieValue.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={isSubmitting || createSession.isPending}
              className="font-mono"
            >
              ABORT
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createSession.isPending}
              className="font-mono bg-primary text-primary-foreground hover:bg-primary/90"
            >
              EXECUTE_INJECTION
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
