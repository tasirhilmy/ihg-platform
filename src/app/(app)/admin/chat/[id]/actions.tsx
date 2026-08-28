"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updateSessionStatus } from "@/server/actions/chat";
import { toast } from "sonner";

export function SessionActions({ sessionId, currentStatus }: { sessionId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = (status: "RESOLVED" | "ESCALATED" | "OPEN") => {
    startTransition(async () => {
      try {
        await updateSessionStatus({ id: sessionId, status });
        toast.success("Status updated");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "OPEN" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle("ESCALATED")}
            disabled={isPending}
          >
            Escalate
          </Button>
          <Button
            size="sm"
            variant="accent"
            onClick={() => handle("RESOLVED")}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark resolved
          </Button>
        </>
      )}
      {currentStatus !== "OPEN" && (
        <Button size="sm" variant="outline" onClick={() => handle("OPEN")} disabled={isPending}>
          Reopen
        </Button>
      )}
    </div>
  );
}
