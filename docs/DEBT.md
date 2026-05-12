# Registro de Deuda Técnica — IntegraD

> Este documento registra la deuda técnica identificada durante el desarrollo del proyecto.
> Objetivo: mantener visibilidad de lo que queda por resolver y priorizarla en futuros sprints.

---

## Deuda Técnica Acumulada

### TD-001: InterventionPanel.tsx — Archivo legacy超大

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Alta |
| **Origen** | Evolución UX Operacional Followup/Caseload |
| **Tamaño actual** | ~1735 líneas |
| **Riesgo** | Alto para refactors profundos sin extracción previa |
| **Impacto** | Dificulta mantenimiento y evolución del panel de intervención |

**Descripción:**
El archivo InterventionPanel.tsx creció orgánicamente con múltiples secciones anidadas (riskCardStyle, interpretation, timeline, actions). Cualquier intento de envolver bloques grandes o agregar colapsables sin extracción previa rompe la estructura.

**Plan de resolución (7 extracciones):**
1. Extraer `RiskDetailsTechnicalSection` (~400 líneas - la más densa)
2. Extraer `ClinicalInterpretationSection` 
3. Extraer `InterventionActionsSection`
4. Extraer `TechnicalEvidenceSection`
5. Mover estilos inline (~300 líneas) a archivo de estilos
6. Mover helpers de traducción semántica a `logic/`
7. Crear colapsable "Ver detalles técnicos" después de extracciones

---

### TD-002: Caseload fallback legacy sin OperationalCase

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Aggregation v0.1 no genera suficientes OperationalCase |
| **Dependencia** | Aggregation v0.2 |

**Descripción:**
Pacientes sin OperationalCase aún muestran eventos técnicos en lugar de narrativa operacional. El Caseload tiene fallback a modo legacy que no refleja la nueva experiencia UX.

**Plan de resolución:**
- Completar Aggregation v0.2 para generar más OperationalCase
- Crear casos operacionales para escenarios: onboarding, contactabilidad, riesgo glucémico
- Diseñar fallback apropiado o indicador de "sin caso operacional"

---

### TD-003: Intervention Panel — Densidad técnica en secciones profundas

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Derivado de TD-001 |
| **Dependencia** | Requiere resolución de TD-001 |

**Descripción:**
Las subsecciones de "Orientación clínica y operativa" muestran demasiados datos técnicos (raw labels, keys, enums). El usuario profesional ve información que no necesita ver.

**Plan de resolución:**
- Aplicar el patrón de InterventionSummary y RiskBrief a otras secciones
- Implementar colapsable "Ver detalles técnicos" después de extracciones de TD-001

---

### TD-004: Tests con fallos preexistentes

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Previo a la evolución UX actual |
| **Tests afectados** | 4 tests fallando (no relacionados con cambios actuales) |

**Descripción:**
Existen 4 tests unitarios/e2e que fallan actualmente. No fueron causados por los cambios de la evolución UX operacional, pero reducen la confianza en la suite de tests.

**Plan de resolución:**
- Investigar origen de los 4 fallos
- Documentar si son bugs reales o tests obsoletos
- Corregir o marcar como skipped con justificación

---

### TD-005: Estilos inline en componentes

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Baja |
| **Origen** | Desarrollo rápido inicial |

**Descripción:**
Múltiples componentes tienen estilos inline que dificultan mantenimiento y consistencia.

**Plan de resolución:**
- Migrar a CSS Modules o Tailwind cuando corresponda
- Crear archivo de temas/constantes para colores y spacings

---

### TD-006: GlucoseChart.tsx — Componente 超大 sin separación

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Alta |
| **Origen** | Desarrollo inicial |
| **Tamaño actual** | ~899 líneas |
| **Riesgo** | Un archivo hace demasiado: renderizado, cálculos, tipos, helpers |

**Descripción:**
El componente GlucoseChart.tsx tiene ~899 líneas haciendo renderizado de gráficos, cálculos de tendencias, formatting de datos, y tipos todos en el mismo archivo. Violación del principio de responsabilidad única.

**Plan de resolución:**
- Extraer lógica de cálculos a `src/utils/glucose/calculations.ts`
- Extraer lógica de formatting a `src/utils/glucose/formatters.ts`
- Extraer tipos a `src/types/glucose.types.ts`
- Dejar en el componente solo la renderización con Chart.js/Recharts

---

### TD-007: M5SnapshotCard.tsx — Componente de vista clínica muy grande

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Alta |
| **Origen** | Desarrollo inicial |
| **Tamaño actual** | ~803 líneas |

**Descripción:**
El archivo M5SnapshotCard.tsx contiene múltiples secciones de información clínica (M5, historia, medicamentos, alertas) en un solo componente. Dificulta mantenimiento y testing.

**Plan de resolución:**
- Extraer sub-secciones a componentes independientes: `M5Card.tsx`, `PatientHistoryCard.tsx`, `MedicationsCard.tsx`, `AlertsCard.tsx`
- Crear compose pattern para integrar en vista

---

### TD-008: EducatorInterventionPanel.tsx — Panel de educadores duplicado

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Desarrollo paralelo sin reutilización |
| **Tamaño actual** | ~513 líneas |

**Descripción:**
Existe un EducatorInterventionPanel.tsx que parece duplicar funcionalidad del InterventionPanel.tsx de Followup. Potencial código duplicado entre ambos módulos.

**Plan de resolución:**
- Analizar superposición entre ambos paneles
- Extraer componentes compartidos a carpeta común `src/components/common/`
- Unificar patrones de intervención

---

### TD-009: Hooks muy grandes (useEducatorWorkspace, usePatientClinicalFull)

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Hooks que acumulan responsabilidad |

**Descripción:**
- `useEducatorWorkspace.ts`: ~307 líneas
- `usePatientClinicalFull.ts`: ~271 líneas

Estos hooks manejan múltiples responsabilidades (fetching, transformación, estado, efectos). violan el principio de responsabilidad única.

**Plan de resolución:**
- Extraer lógica de transformación a archivos `logic/`
- Crear hooks específicos por responsabilidad (usePatientFetch, usePatientTransform, usePatientState)
- Reducir complejidad por hook

---

### TD-010: API patients.ts — Archivo de API muy grande

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Crecimiento orgánico del API |
| **Tamaño actual** | ~704 líneas |

**Descripción:**
El archivo `src/api/patients.ts` tiene ~704 líneas con múltiples endpoints. Dificulta navegación y mantenimiento.

**Plan de resolución:**
- Dividir en archivos por dominio: `patients/search.ts`, `patients/details.ts`, `patients/clinical.ts`, `patients/enrollments.ts`
- Mantener barrel file `src/api/patients/index.ts` que re-exporta

---

### TD-011: Cobertura de tests insuficiente

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Media |
| **Origen** | Desarrollo rápido sin tests |

**Descripción:**
Múltiples componentes no tienen tests:
- GlucoseChart.tsx (899 líneas)
- M5SnapshotCard.tsx (803 líneas)
- EducatorInterventionPanel.tsx
- EducatorPatientsTable.tsx
- CaseloadGlobalView.tsx
- HumanTimeline.tsx
- OperationalNarrative.tsx
- Y ~20+ componentes más

**Plan de resolución:**
- Priorizar componentes críticos (los más usados)
- Agregar tests de renderizado básico para componentes nuevos
- Crear integración con testing-library

---

### TD-012: Duplicación de tipos entre API y UI

| Atributo | Detalle |
|----------|---------|
| **Estado** | Pendiente |
| **Severidad** | Baja |
| **Origen** | Tipos definidos en API y duplicados en UI |

**Descripción:**
Los tipos de respuesta de API se duplican en componentes de UI sin transformación. Esto crea acoplamiento y dificulta cambios en el API.

**Plan de resolución:**
- Usar tipos del API directamente en la UI cuando sea posible
- Crear capa de transformación mínima cuando la UI requiera formatos diferentes
- Documentar convención de tipos

---

## Deuda Técnica por Área

### Frontend/Dashboard
- [ ] TD-001: InterventionPanel.tsx legacy
- [ ] TD-003: Densidad técnica en panel
- [ ] TD-005: Estilos inline
- [ ] TD-006: GlucoseChart.tsx muy grande
- [ ] TD-007: M5SnapshotCard.tsx muy grande
- [ ] TD-011: Cobertura de tests insuficiente

### Módulos/Educadores
- [ ] TD-008: EducatorInterventionPanel duplicado

### Hooks/Arquitectura
- [ ] TD-009: Hooks muy grandes
- [ ] TD-012: Duplicación de tipos

### Backend/API
- [ ] TD-002: Fallback legacy sin OperationalCase
- [ ] TD-010: API patients.ts muy grande

### Testing
- [ ] TD-004: 4 tests fallando

---

## Estado de Deuda Técnica

| ID | Descripción | Severidad | Estado | Dependencias |
|----|-------------|-----------|--------|--------------|
| TD-001 | InterventionPanel.tsx legacy | Alta | Pendiente | — |
| TD-002 | Fallback legacy sin OperationalCase | Media | Pendiente | Aggregation v0.2 |
| TD-003 | Densidad técnica en panel | Media | Pendiente | TD-001 |
| TD-004 | 4 tests fallando | Media | Pendiente | — |
| TD-005 | Estilos inline | Baja | Pendiente | — |
| TD-006 | GlucoseChart.tsx muy grande | Alta | Pendiente | — |
| TD-007 | M5SnapshotCard.tsx muy grande | Alta | Pendiente | — |
| TD-008 | EducatorInterventionPanel duplicado | Media | Pendiente | — |
| TD-009 | Hooks muy grandes | Media | Pendiente | — |
| TD-010 | API patients.ts muy grande | Media | Pendiente | — |
| TD-011 | Cobertura de tests insuficiente | Media | Pendiente | — |
| TD-012 | Duplicación de tipos | Baja | Pendiente | — |

---

## Historial de Registro

| Fecha | Registrado por | Notas |
|-------|---------------|-------|
| 11-05-2026 | Agent Teams Lite | Primera versión - incluye deuda de UX Operacional Followup/Caseload |
| 11-05-2026 | Agent Teams Lite | Expansión: +7 items (TD-006 a TD-012) - componentes grandes, hooks, API, tests |

---

*Documento vivo — actualizar conforme se identifica nueva deuda técnica.*