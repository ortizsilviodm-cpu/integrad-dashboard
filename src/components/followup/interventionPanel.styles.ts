import type { CSSProperties } from "react";

// InterventionPanel.tsx - Estilos extraidos
// Objetivo: reducir tamanio del componente y mejorar mantenibilidad

export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.48)",
  backdropFilter: "blur(8px)",
  zIndex: 9998,
};

export const panelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "calc(100vw - 84px)",
  maxWidth: "none",
  height: "100vh",
  background: "#f8fafc",
  borderLeft: "1px solid #e5e7eb",
  boxShadow: "-24px 0 56px rgba(15, 23, 42, 0.28)",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
};

export const headerStyle: CSSProperties = {
  padding: "20px 24px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  background: "#ffffff",
};

export const bodyStyle: CSSProperties = {
  padding: 24,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

export const topGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

export const middleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

export const sectionCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#ffffff",
};

export const interpretationStyle: CSSProperties = {
  ...sectionCardStyle,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
};

export const alertStyle: CSSProperties = {
  ...sectionCardStyle,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
};

export const listStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

export const listRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

export const historyCardStyle: CSSProperties = {
  ...sectionCardStyle,
  padding: 16,
};

export const historyBodyStyle: CSSProperties = {
  ...listStyle,
  minHeight: 56,
};

export const leftColumnStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

export const rightColumnStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

export const criticalGlucoseContextStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.5,
};

export const glucoseTrendStyle: CSSProperties = {
  marginBottom: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
};

export const timelineHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

export const timelineTitleBlockStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

export const timelineToggleButtonStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 12,
};

export const timelineMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

export const timelineItemLeftStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 6,
};

export const timelineBadgeBaseStyle: CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

export const timelineFooterNoteStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#6b7280",
};

export const riskCardStyle: CSSProperties = {
  ...sectionCardStyle,
  background: "#f8fafc",
};

export const riskGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

export const pillBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

export const riskMetaGridStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: 13,
  color: "#374151",
  lineHeight: 1.5,
};

export const riskListStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

export const riskListRowStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "grid",
  gap: 6,
};