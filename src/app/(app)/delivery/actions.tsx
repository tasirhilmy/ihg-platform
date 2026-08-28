"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Loader2, Bike, CheckCircle2 } from "lucide-react";
import { assignDeliveryAgent, markDeliveryStatus } from "@/server/actions/delivery";
import { toast } from "sonner";

export function DeliveryRowActions({
  deliveryId,
  agents,
  currentAgentId,
}: {
  deliveryId: string;
  agents: { id: string; name: string }[];
  currentAgentId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAssign = (agentId: string) => {
    startTransition(async () => {
      try {
        await assignDeliveryAgent({ id: deliveryId, agentId });
        toast.success("Agent assigned");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentAgentId ?? ""}
        onChange={(e) => e.target.value && handleAssign(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        disabled={isPending}
      >
        <option value="">Assign…</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  );
}

export function AgentDeliveryActions({ deliveryId, status }: { deliveryId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next: Record<string, { label: string; target: "OUT_FOR_DELIVERY" | "DELIVERED"; icon: any } | null> = {
    READY: { label: "Picked up", target: "OUT_FOR_DELIVERY", icon: Bike },
    OUT_FOR_DELIVERY: { label: "Delivered", target: "DELIVERED", icon: CheckCircle2 },
  };

  const action = next[status];
  if (!action) return null;

  const handle = () => {
    startTransition(async () => {
      try {
        await markDeliveryStatus({ id: deliveryId, status: action.target });
        toast.success(action.label);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <Button onClick={handle} size="sm" variant="accent" disabled={isPending}>
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <action.icon className="h-3 w-3" />}
      {action.label}
    </Button>
  );
}
