/* integrad-dashboard\src\components\common\PatientAvatar.tsx */

import type { CSSProperties } from "react";

type Props = {
  fullName: string;
  severity: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getColor(severity: string): CSSProperties {
  const v = String(severity || "").toUpperCase().trim();

  if (v === "CRITICAL") {
    return {
      background: "#ef4444",
      color: "#ffffff",
    };
  }

  if (v === "HIGH" || v === "WARNING") {
    return {
      background: "#f97316",
      color: "#ffffff",
    };
  }

  return {
    background: "#22c55e",
    color: "#ffffff",
  };
}

export function PatientAvatar({ fullName, severity }: Props) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        ...getColor(severity),
      }}
    >
      {getInitials(fullName)}
    </div>
  );
}