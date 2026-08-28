"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight, Loader2, CheckCircle2, Play, BedDouble } from "lucide-react";
import { HOUSEKEEPING_TASK_LABEL, getStatusVariant } from "@/lib/enums";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { updateHousekeepingStatus } from "@/server/actions/housekeeping";

interface Task {
  id: string;
  taskType: string;
  priority: string;
  status: string;
  notes: string | null;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  room: { id: string; roomNumber: string; roomType: string; floor: number };
  assignee: { id: string; name: string } | null;
  booking: { code: string; guestName: string } | null;
}

interface BoardProps {
  tasks: Task[];
  staff: { id: string; name: string }[];
  canUpdate: boolean;
}

export function HousekeepingBoard({ tasks, staff, canUpdate }: BoardProps) {
  const columns = [
    { id: "PENDING", label: "Pending", color: "border-amber-300" },
    { id: "IN_PROGRESS", label: "In progress", color: "border-sky-300" },
    { id: "COMPLETED", label: "Completed", color: "border-emerald-300" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) =>
          col.id === "COMPLETED"
            ? ["COMPLETED", "INSPECTED"].includes(t.status)
            : t.status === col.id
        );
        return (
          <div key={col.id} className={`rounded-xl border-t-4 ${col.color} bg-slate-50 p-3`}>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-brand">{col.label}</h3>
              <Badge variant="secondary">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                  No tasks
                </div>
              ) : (
                colTasks.map((t) => (
                  <TaskCard key={t.id} task={t} staff={staff} canUpdate={canUpdate} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, staff, canUpdate }: { task: Task; staff: { id: string; name: string }[]; canUpdate: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? "");

  const handleStart = () => {
    startTransition(async () => {
      try {
        await updateHousekeepingStatus({ id: task.id, status: "IN_PROGRESS", assigneeId });
        toast.success("Task started");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await updateHousekeepingStatus({ id: task.id, status: "COMPLETED" });
        toast.success("Task completed");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  const handleAssign = (newId: string) => {
    setAssigneeId(newId);
    startTransition(async () => {
      try {
        await updateHousekeepingStatus({ id: task.id, status: task.status as any, assigneeId: newId });
        toast.success("Assigned");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-brand" />
            <span className="font-mono text-sm font-bold text-brand">#{task.room.roomNumber}</span>
            {task.priority === "URGENT" && <Badge variant="danger" className="text-[10px]">URGENT</Badge>}
            {task.priority === "HIGH" && <Badge variant="warning" className="text-[10px]">HIGH</Badge>}
          </div>
        </div>
        <p className="text-xs font-medium text-slate-700">
          {HOUSEKEEPING_TASK_LABEL[task.taskType as keyof typeof HOUSEKEEPING_TASK_LABEL] ?? task.taskType}
        </p>
        {task.booking && (
          <p className="text-[11px] text-slate-500">
            For: {task.booking.guestName} ({task.booking.code})
          </p>
        )}
        {task.notes && <p className="text-[11px] italic text-slate-500">{task.notes}</p>}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          {task.scheduledFor && formatTime(task.scheduledFor)}
          {task.completedAt && <span className="ml-1 text-emerald-600">· done {formatTime(task.completedAt)}</span>}
        </div>
        {canUpdate && (
          <div className="space-y-1.5 pt-1">
            <select
              value={assigneeId}
              onChange={(e) => handleAssign(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
              disabled={isPending}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {task.status === "PENDING" && (
                <Button size="sm" variant="outline" onClick={handleStart} disabled={isPending} className="h-7 flex-1 text-xs">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Start
                </Button>
              )}
              {(task.status === "IN_PROGRESS" || task.status === "PENDING") && (
                <Button size="sm" variant="accent" onClick={handleComplete} disabled={isPending} className="h-7 flex-1 text-xs">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Complete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
