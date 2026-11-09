import { Badge } from "@/components/ui/card";
import { statusById } from "@/lib/reference-data";
import type { AssignmentState, Priority, StatusBucket, StatusId } from "@/lib/types";

const bucketTone: Record<StatusBucket, "blue" | "saffron" | "violet" | "green" | "slate"> = {
  new: "blue", in_progress: "saffron", pending: "violet", resolved: "green", closed: "slate",
};
export const bucketLabel: Record<StatusBucket, string> = {
  new: "New", in_progress: "In progress", pending: "Pending", resolved: "Resolved", closed: "Closed",
};

export function StatusBadge({ status }: { status: StatusId }) {
  const s = statusById(status);
  return <Badge tone={bucketTone[s.bucket]} dot>{s.label}</Badge>;
}

const pTone: Record<Priority, "red" | "saffron" | "blue" | "slate"> = { critical: "red", high: "saffron", medium: "blue", low: "slate" };
export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={pTone[priority]} className="capitalize">{priority}</Badge>;
}

const aLabel: Record<AssignmentState, [string, "slate" | "saffron" | "green" | "violet"]> = {
  draft: ["Draft", "slate"],
  awaiting_assignment: ["Awaiting assignment", "saffron"],
  assigned: ["Assigned", "green"],
  transfer_pending: ["Transfer pending", "violet"],
};
export function AssignmentBadge({ state }: { state: AssignmentState }) {
  const [l, t] = aLabel[state];
  return <Badge tone={t}>{l}</Badge>;
}

export const bucketColors: Record<StatusBucket, string> = {
  new: "#2563eb", in_progress: "#f39a32", pending: "#6d4fd6", resolved: "#138a50", closed: "#94a3b8",
};
