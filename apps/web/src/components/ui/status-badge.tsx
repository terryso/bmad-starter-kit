import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "error" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  pending: "badge-pending",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusStyles[status], className)}>
      {children}
    </span>
  );
}
