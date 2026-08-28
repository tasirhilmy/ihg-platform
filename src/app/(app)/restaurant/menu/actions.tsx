"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { toggleMenuItemAvailability } from "@/server/actions/menu";

export function MenuItemActions({ item }: { item: { id: string; name: string; price: number; isAvailable: boolean } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);

  const handleToggle = (val: boolean) => {
    setIsAvailable(val);
    startTransition(async () => {
      try {
        await toggleMenuItemAvailability({ id: item.id, isAvailable: val });
        toast.success(val ? "Available" : "Marked unavailable");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
        setIsAvailable(!val);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{isAvailable ? "Available" : "Hidden"}</span>
      <Switch
        checked={isAvailable}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}
