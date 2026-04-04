/* integrad-dashboard/src/theme/ui.ts */

import { TOKENS } from "./tokens";

/**
 * Estilos UI reutilizables (fundación).
 * Regla: no depende de features; solo tokens y patrones repetidos.
 */
export const UI = {
  cardTitleH3: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827",
  } as const,

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8rem",
  } as const,

  thRow: {
    textAlign: "left",
    borderBottom: TOKENS.BORDER_DEFAULT,
    background: "#f9fafb",
  } as const,

  td: {
    padding: 6,
  } as const,

  mutedText: {
    color: TOKENS.COLOR_TEXT_MUTED,
  } as const,

  errorText: {
    color: "#b91c1c",
  } as const,
};
