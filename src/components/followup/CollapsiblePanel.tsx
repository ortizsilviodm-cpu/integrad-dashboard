import { useState, type ReactNode } from "react";

type CollapsiblePanelProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  variant?: "default" | "subtle";
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#ffffff",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  cursor: "pointer",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const toggleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6b7280",
  padding: "4px 10px",
  borderRadius: 6,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  padding: 16,
};

/**
 * Componente genérico para secciones colapsables.
 * No conoce nada de lógica de negocio - solo maneja visibilidad.
 */
export function CollapsiblePanel({
  title,
  children,
  defaultExpanded = false,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={panelStyle}>
      <div style={headerStyle} onClick={() => setExpanded(!expanded)}>
        <span style={titleStyle}>{title}</span>
        <button
          type="button"
          style={toggleStyle}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {expanded && <div style={contentStyle}>{children}</div>}
    </div>
  );
}

export default CollapsiblePanel;