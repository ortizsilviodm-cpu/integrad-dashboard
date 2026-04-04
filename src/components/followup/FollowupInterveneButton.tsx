import type { CSSProperties } from "react";
import type { FollowupEventRow } from "../../api/followup";

type FollowupInterveneButtonProps = {
  event: FollowupEventRow;
  onClick?: (event: FollowupEventRow) => void;
  loading?: boolean;
};

const buttonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(47, 66, 173, 1)",
  background: "var(--color-primary, #2f42ad)",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};

function isInterventionEligible(event: FollowupEventRow): boolean {
  const severity = String(event.severity || "").toUpperCase().trim();

  if (event.status === "CLOSED") {
    return false;
  }

  return severity === "HIGH" || severity === "CRITICAL";
}

export function FollowupInterveneButton({
  event,
  onClick,
  loading = false,
}: FollowupInterveneButtonProps) {
  if (!isInterventionEligible(event)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      disabled={loading}
      style={{
        ...buttonStyle,
        cursor: loading ? "not-allowed" : buttonStyle.cursor,
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading ? "Interviniendo…" : "Intervenir"}
    </button>
  );
}