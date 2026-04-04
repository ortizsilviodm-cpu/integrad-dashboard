/* integrad-dashboard/src/theme/tokens.ts */

// 🎨 IntegraD Design Tokens
// Centraliza la paleta institucional y estilos base
// para mantener coherencia entre dashboard, app móvil y docs.

export const TOKENS = {
  // Colores institucionales
  COLOR_PRIMARY: "#2F42AD", // Azul IntegraD
  COLOR_SECONDARY: "#A984FF", // Violeta de acento
  COLOR_ACCENT: "#74D4CC", // Turquesa del logo

  // Colores complementarios
  COLOR_TEXT: "#3C4262", // Texto principal
  COLOR_TEXT_MUTED: "#6B7280", // Texto secundario
  COLOR_BACKGROUND: "#F2F6FE", // Fondo claro institucional
  COLOR_SIDEBAR_BG: "#2F42AD", // Fondo del menú lateral
  COLOR_CARD_BG: "#FFFFFF", // Fondo de tarjetas

  // Estados (semáforo clínico)
  COLOR_SUCCESS: "#16A34A", // Verde (controlado)
  COLOR_WARNING: "#FACC15", // Amarillo (precaución)
  COLOR_ERROR: "#DC2626", // Rojo (alerta)

  // Estructura y detalles visuales
  COLOR_WHITE: "#FFFFFF",

  // Bordes
  BORDER_RADIUS: "16px",
  BORDER_COLOR: "#E5E7EB",
  BORDER_DEFAULT: "1px solid #E5E7EB",

  // Sombras
  // Default: suave, equivalente al look actual de la ficha clínica
  SHADOW_CARD: "0 4px 12px rgba(15, 23, 42, 0.06)",
  // Alternativa elevada para casos puntuales (si hace falta)
  SHADOW_CARD_ELEVATED: "0 10px 25px rgba(15, 23, 42, 0.08)",

  // Tipografía
  TYPOGRAPHY_MANROPE: "'Manrope', sans-serif",
} as const;
