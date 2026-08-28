"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { markAllAlertsRead } from "@/server/actions/alerts";
import { toast } from "sonner";

export function MarkAllRead() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      try {
        await markAllAlertsRead();
        toast.success("All marked as read");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <Button onClick={handle} variant="outline" size="sm" disabled={isPending}>
      <Check className="h-4 w-4" />
      Mark all read
    </Button>
  );
}
