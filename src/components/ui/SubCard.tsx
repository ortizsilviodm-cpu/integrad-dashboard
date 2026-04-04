import type { CSSProperties, ReactNode } from "react";
import { Card } from "./Card";

type SubCardTone = "default" | "muted";

export type SubCardProps = {
  children?: ReactNode;
  padding?: number | string; // default: 12
  tone?: SubCardTone; // default: "default"
  bordered?: boolean; // default: true
  className?: string;
  style?: CSSProperties;
};

export function SubCard({
  children,
  padding = 12,
  tone = "default",
  bordered = true,
  className,
  style,
}: SubCardProps) {
  const background = tone === "muted" ? "#f9fafb" : "#ffffff";

  return (
    <Card
      padding={padding}
      shadow={false}
      variant={bordered ? "outlined" : "flat"}
      className={className}
      style={{
        background,
        borderRadius: 14,
        border: bordered ? "1px solid #e5e7eb" : "none",
        ...style,
      }}
    >
      {children}
    </Card>
  );
}
