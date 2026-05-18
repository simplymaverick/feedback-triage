import type { Priority, Sentiment } from "../types";
import "./Badge.css";

type BadgeVariant = Sentiment | Priority | "default";

const variantClass: Record<BadgeVariant, string> = {
  positive: "badge--positive",
  neutral: "badge--neutral",
  negative: "badge--negative",
  P0: "badge--p0",
  P1: "badge--p1",
  P2: "badge--p2",
  P3: "badge--p3",
  default: "badge--default",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant] ?? variantClass.default}`}>
      {label}
    </span>
  );
}
