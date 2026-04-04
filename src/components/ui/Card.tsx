/* integrad-dashboard/src/components/ui/Card.tsx */

import React, { forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { TOKENS } from "../../theme/tokens";

type CardVariant = "default" | "flat" | "outlined";

export type CardProps<T extends ElementType = "div"> = {
  as?: T;
  children?: ReactNode;

  /** Variantes visuales */
  variant?: CardVariant;

  /** Padding interno del card (default: 16px) */
  padding?: number | string;

  /** Permite desactivar sombra */
  shadow?: boolean;

  className?: string;
  style?: CSSProperties;
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "children" | "style" | "className"
>;

/**
 * Card — Componente base reutilizable
 * - Encapsula estilos repetidos (background, radius, shadow, borde)
 * - Usa TOKENS como fuente de verdad
 * - Default pensado para producción: look estable y consistente
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    as,
    children,
    variant = "default",
    padding = 16,
    shadow = true,
    className,
    style,
    ...rest
  },
  ref
) {
  const Component = (as || "div") as ElementType;

  const base: CSSProperties = {
    background: TOKENS.COLOR_CARD_BG,
    borderRadius: TOKENS.BORDER_RADIUS,
    padding,
    boxShadow: shadow ? TOKENS.SHADOW_CARD : "none",
  };

  const variants: Record<CardVariant, CSSProperties> = {
    default: {
      border: "none",
    },
    flat: {
      border: "none",
      boxShadow: "none",
    },
    outlined: {
      border: TOKENS.BORDER_DEFAULT,
      boxShadow: shadow ? TOKENS.SHADOW_CARD : "none",
    },
  };

  return (
    <Component
      ref={ref as any}
      className={className}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
});
