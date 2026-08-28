"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, ChefHat, Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/server/actions/orders";
import { toast } from "sonner";

export function KitchenTicketActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next: Record<string, { label: string; status: "PREPARING" | "READY" | "SERVED"; icon: any; variant: any } | null> = {
    PLACED: { label: "Accept", status: "PREPARING", icon: Play, variant: "default" },
    CONFIRMED: { label: "Start cooking", status: "PREPARING", icon: ChefHat, variant: "default" },
    PREPARING: { label: "Mark ready", status: "READY", icon: CheckCircle2, variant: "accent" },
    READY: { label: "Mark served", status: "SERVED", icon: CheckCircle2, variant: "accent" },
  };

  const action = next[currentStatus];
  if (!action) return null;

  const handle = () => {
    startTransition(async () => {
      try {
        await updateOrderStatus({ id: orderId, status: action.status });
        toast.success(`Order ${action.status.toLowerCase()}`);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <Button
      onClick={handle}
      disabled={isPending}
      variant={action.variant}
      size="sm"
      className="w-full"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <action.icon className="h-3 w-3" />}
      {action.label}
    </Button>
  );
}
