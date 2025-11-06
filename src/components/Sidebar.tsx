/* integrad-dashboard\src\components\Sidebar.tsx */

import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Bell,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronsRight,
} from "lucide-react";

import "./Sidebar.css";

/**
 * Ajustá estas rutas según dónde tengas las imágenes:
 * - si están en src/assets → "../assets/logo-integrad-full.png"
 * - si están en public     → "/logo-integrad-full.png"
 */
import logoFull from "../assets/logo-integrad-full.png";
import logoIso from "../assets/logo-integrad-iso.png";

type MenuKey = "dashboard" | "patients" | "alerts" | "dispenses" | "audit" | "settings";

type MenuItem = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  key: MenuKey;
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { icon: Users, label: "Pacientes", key: "patients" },
  { icon: Bell, label: "Alertas", key: "alerts" },
  { icon: Package, label: "Dispensas", key: "dispenses" },
  { icon: FileText, label: "Auditoría", key: "audit" },
  { icon: Settings, label: "Configuración", key: "settings" },
];

interface SidebarProps {
  activeSection: MenuKey;
  onSelect: (section: MenuKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  const ToggleIcon = isCollapsed ? ChevronsRight : Menu;

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Header con logo + botón menú */}
      <div className="sidebar-header">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo">
            {/* Logo IntegraD: iso cuando está colapsado, full cuando está expandido */}
            {isCollapsed ? (
              <img
                src={logoIso}
                alt="IntegraD"
                className="sidebar-logo-iso"
              />
            ) : (
              <div className="sidebar-logo-full-wrap">
                <img
                  src={logoFull}
                  alt="IntegraD"
                  className="sidebar-logo-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón hamburguesa debajo del logo */}
        <button
          className="sidebar-toggle"
          onClick={handleToggle}
          aria-label={isCollapsed ? "Desplegar menú" : "Colapsar menú"}
          aria-pressed={isCollapsed}
        >
          <ToggleIcon />
        </button>
      </div>

      {/* Menú principal */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;

          return (
            <button
              key={item.key}
              className={`sidebar-item ${isActive ? "is-active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <Icon size={20} />
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer: salir */}
      <div className="sidebar-footer">
        <button className="sidebar-item sidebar-logout">
          <LogOut size={20} />
          <span className="sidebar-item-label">Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
