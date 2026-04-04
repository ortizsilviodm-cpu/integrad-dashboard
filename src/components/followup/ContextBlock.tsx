import type { CSSProperties } from "react";

type ContextBlockProps = {
  notes: string[];
};

const wrapperStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#ffffff",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#374151",
};

const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#6b7280",
};

export function ContextBlock({ notes }: ContextBlockProps) {
  return (
    <section style={wrapperStyle}>
      <h4 style={titleStyle}>Contexto humano</h4>

      {notes.length === 0 ? (
        <p style={emptyStyle}>Sin notas contextuales disponibles.</p>
      ) : (
        <ul style={listStyle}>
          {notes.map((note, index) => (
            <li key={`${note}-${index}`} style={{ marginBottom: 6 }}>
              {note}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}