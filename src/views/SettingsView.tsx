/* integrad-dashboard/src/views/SettingsView.tsx */

export default function SettingsView() {
  return (
    <section className="app-table">
      {/* Encabezado consistente con el resto de vistas */}
      <header className="section-header">
        <h2>Configuración</h2>
        <p className="chart-subtitle">
          Preferencias del profesional y parámetros del panel IntegraD.
        </p>
      </header>

      <div
        className="chart-placeholder"
        style={{
          textAlign: "center",
          padding: "1.5rem 1rem",
          lineHeight: 1.5,
        }}
      >
        Próximamente: configuración de umbrales de glucemia, alertas,
        notificaciones y vistas favoritas.
      </div>
    </section>
  );
}
