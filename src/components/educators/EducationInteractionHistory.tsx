/* integrad-dashboard/src/components/educators/EducationInteractionHistory.tsx */

import type { CSSProperties } from "react";

import type { EducationInteractionItem } from "../../types/educators.types";
import {
  formatInteractionTypeLabel,
  formatLastUpdateLabel,
} from "../../logic/educators.logic";

type EducationInteractionHistoryProps = {
  interactions: EducationInteractionItem[];
  loading?: boolean;
  error?: string | null;
};

export default function EducationInteractionHistory({
  interactions,
  loading = false,
  error = null,
}: EducationInteractionHistoryProps) {
  if (error) {
    return <div style={styles.errorBox}>{error}</div>;
  }

  if (loading) {
    return <div style={styles.emptyBox}>Cargando historial educativo...</div>;
  }

  if (interactions.length === 0) {
    return <div style={styles.emptyBox}>No hay interacciones registradas.</div>;
  }

  return (
    <div style={styles.list}>
      {interactions.map((interaction) => (
        <article key={interaction.id} style={styles.item}>
          <div style={styles.itemHeader}>
            <span style={styles.typeBadge}>
              {formatInteractionTypeLabel(interaction.type)}
            </span>
            <span style={styles.dateLabel}>
              {formatLastUpdateLabel(interaction.createdAt)}
            </span>
          </div>

          <p style={styles.note}>{interaction.note}</p>
        </article>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  item: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#ffffff",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontSize: 12,
    fontWeight: 600,
  },
  dateLabel: {
    fontSize: 12,
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  note: {
    margin: 0,
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyBox: {
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: 14,
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 14,
  },
};