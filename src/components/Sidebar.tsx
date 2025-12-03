/* integrad-dashboard/src/components/Sidebar.tsx */

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
  Brain,
  BarChart3,
  Pill,
  Stethoscope, // ⭐ Ambulatorios
  ClipboardList, // ⭐ Enrolamiento (formulario)
} from "lucide-react";

import "./Sidebar.css";

import logoFull from "../assets/logo-integrad-full.png";
import logoIso from "../assets/logo-integrad-iso.png";

const DEMO_MODE =
  (import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";

/* ================================
   SectionKey (secciones del menú)
================================= */
export type SectionKey =
  | "dashboard"
  | "patients"
  | "enrollment" // ⭐ Enrolamiento (formulario)
  | "enrollments" // ⭐ NUEVO: Listado de enrolamientos
  | "alerts"
  | "dispenses"
  | "audit"
  | "medications"
  | "settings"
  | "iaPredictiva"
  | "ambulatory"
  | "economicsDemo";

type MenuItem = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  key: SectionKey;
};

const baseMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { icon: Users, label: "Pacientes", key: "patients" },
  {
    icon: ClipboardList,
    label: "Enrolamiento",
    key: "enrollment",
  },
  {
    icon: FileText,
    label: "Enrolamientos",
    key: "enrollments",
  },
  { icon: Bell, label: "Alertas", key: "alerts" },
  { icon: Package, label: "Dispensas", key: "dispenses" },
  { icon: Pill, label: "Medicación", key: "medications" },
  { icon: Stethoscope, label: "Ambulatorios", key: "ambulatory" },
  { icon: FileText, label: "Auditoría", key: "audit" },
  { icon: Settings, label: "Configuración", key: "settings" },
  { icon: Brain, label: "IA Predictiva", key: "iaPredictiva" },
];

const menuItems: MenuItem[] = DEMO_MODE
  ? [
      ...baseMenuItems,
      {
        icon: BarChart3,
        label: "Impacto Económico",
        key: "economicsDemo",
      },
    ]
  : baseMenuItems;

interface SidebarProps {
  activeSection: SectionKey;
  onSelect: (section: SectionKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  const ToggleIcon = isCollapsed ? ChevronsRight : Menu;

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo">
            {isCollapsed ? (
              <img src={logoIso} alt="IntegraD" className="sidebar-logo-iso" />
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

        <button
          className="sidebar-toggle"
          onClick={handleToggle}
          aria-label={isCollapsed ? "Desplegar menú" : "Colapsar menú"}
          aria-pressed={isCollapsed}
        >
          <ToggleIcon />
        </button>
      </div>

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

      <div className="sidebar-footer">
        <button className="sidebar-item sidebar-logout" type="button">
          <LogOut size={20} />
          <span className="sidebar-item-label">Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
