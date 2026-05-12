# Bitácora PHVA — Followup/Caseload UX Operacional

**Número:** 111
**Fecha:** 11-05-2026
**Módulo:** Followup/Caseload
**Objetivo:** Evolución UX operacional — de experiencia basada en eventos técnicos hacia experiencia operacional humana

---

## 1. Contexto

Se trabajó sobre la evolución del módulo Followup/Caseload desde una experiencia basada en eventos técnicos hacia una experiencia operacional humana.

El módulo anterior mostraba al usuario profesional datos densos, técnicos, con terminología de backend (eventos, severity levels, adherencia como métricas crudas). La necesidad identificada fue transformar la superficie en una guía operacional que priorizara:

- **OperationalCase**: Caso operacional como unidad de coordinación
- **Operational Narrative**: Narrativa operacional dominante (qué está pasando, por qué importa, qué hacer)
- **Human Timeline**: Línea de tiempo narrativa con hitos易懂s
- **Ownership**: Responsabilidad clara (quién tiene el caso, estado operativo)
- **Action Hierarchy**: Qué acción tomar ahora (próximo paso)
- **Intervention Summary**: Resumen operacional del panel de intervención
- **Risk Brief**: Estratificación de riesgo concisa

Esta evolución responde a la necesidad de que el profesional de salud pueda entender rápidamente el estado de sus pacientes sin necesidad de interpretar datos técnicos.

---

## 2. Planificar — Objetivos

| Objetivo | Descripción |
|----------|-------------|
| Mejorar claridad operacional | Que el Caseload muestre casos como unidades de coordinación clínica, no solo eventos técnicos |
| Reducir ruido técnico visible | Ocultar etiquetas, enums, keys técnicos de la vista del profesional |
| Priorizar motivo humano del caso | El "por qué" del caso debe ser dominante sobre el "qué técnico" |
| Mejorar comprensión del workspace | El workspace del paciente debe narrar la situación, no solo listar eventos |
| Iniciar refactor seguro del Intervention Panel | Introducir componentes de resumen sin romper la navegación existente |
| Mantener compatibilidad legacy | Preservar funcionalidad existente mientras se introduce la nueva capa |

---

## 3. Hacer — Commits y cambios realizados

### 3.1 Caseload con OperationalCase real

**Cambios:**
- `src/logic/caseload.logic.ts`: Se implementó `buildOperationalCase()` que transforma eventos en un caso operacional con:
  - `patient`: información del paciente
  - `operationalStatus`: estado operativo textual ("Paciente con varias alertas recientes")
  - `dominantReason`: motivo dominante del caso
  - `priority`: prioridad operacional
  - `recentReopenCount`: cantidad de reaperturas recientes

**Resultado:** Caseload ahora muestra OperationalCase real cuando hay datos disponibles.

### 3.2 Caseload prioriza motivo operacional humano

**Cambios:**
- Se modificó la renderización en `FollowupCaseloadPage.tsx` para mostrar `operationalCase.operationalStatus` y `operationalCase.dominantReason` como texto dominante.
- Se agregó `fetchOperationalCases()` en `api/followup.ts` para obtener casos operacionales filtrados por patientId.

**Resultado:** La bandeja muestra el motivo humano primero, no la categoría técnica.

### 3.3 Navegación incorpora operationalCaseId

**Cambios:**
- Se actualizó `FollowupCaseloadPage.tsx` para pasar `operationalCaseId` en la navegación hacia el workspace.

**Resultado:** El workspace recibe el caso operacional como parámetro de navegación.

### 3.4 Workspace incorpora OperationalNarrative

**Cambios:**
- Nuevo componente: `src/components/followup/OperationalNarrative.tsx`
- Este componente renderiza un card dominante con:
  - Paciente y estado operativo
  - Motivo del caso
  - Prioridad sugerida
  - Cantidad de reaperturas recientes
- Se integró en `PatientWorkspaceView.tsx` como primer elemento del workspace.

**Resultado:** El workspace ahora muestra una narrativa operacional dominante antes de listar eventos.

### 3.5 Workspace incorpora HumanTimeline

**Cambios:**
- Nuevo componente: `src/components/followup/HumanTimeline.tsx`
- Renderiza una línea de tiempo vertical con:
  - Hitos del paciente (último contacto, última medición, última intervención)
  - Eventos narrativos formateados
  - Acciones tomadas
- Se integró en `PatientWorkspaceView.tsx` debajo de la narrativa operacional.

**Resultado:** Timeline horizontal/denso transformado en narrativa vertical understandable.

### 3.6 Workspace incorpora Ownership + próxima acción

**Cambios:**
- `src/logic/caseload.logic.ts`: Se implementó `buildOwnershipAndNextAction()` que retorna:
  - `responsibleName`: nombre del responsable del caso
  - `statusText`: estado operativo textual
  - `nextActionText`: qué hacer ahora
  - `pendingItemText`: pendiente operativo si existe

- Nuevo componente: `src/components/followup/OperationalActionSummary.tsx`
- Renderiza 3 columnas: Responsable, Próxima acción, Pendiente operativo
- Se integró debajo de la narrativa operacional en el workspace

**Resultado:** El profesional ve claramente quién tiene el caso y qué debe hacer.

### 3.7 Intervention Panel incorpora InterventionSummary

**Cambios:**
- Nuevo componente: `src/components/followup/InterventionSummary.tsx`
- Resumen operacional simplificado que muestra:
  - Estado operativo (pendiente, en gestión, controlado, escalado)
  - Severidad
  - Descripción del caso
  - "Qué hacer ahora" basado en severidad y categoría
  - Información adicional (tipo, adherencia)

- Se integró al inicio del `InterventionPanel.tsx`

**Resultado:** El panel de intervención muestra primero un resumen operacional, no datos técnicos densos.

### 3.8 Intervention Panel incorpora RiskBrief

**Cambios:**
- Nuevo componente: `src/components/followup/RiskBrief.tsx`
- Resumen conciso de estratificación de riesgo que muestra:
  - Riesgo base con color
  - Riesgo dinámico con color
  - Prioridad sugerida
  - Primeros 3 criterios activados (con "+N más" si hay más)

- Se integró debajo del InterventionSummary en `InterventionPanel.tsx`

**Resultado:** El riesgo se presenta de forma concisa y con colores, no como datos técnicos crudos.

---

## 4. Verificar — Estado de verificación

| Verificación | Estado | Notas |
|--------------|--------|-------|
| `npm run build` | ✅ OK | Build exitoso |
| TypeScript | ✅ Limpio | Sin errores de tipo |
| Tests | ✅ Sin regresiones | 4 fallos preexistentes (no relacionados con estos cambios) |
| Navegación Caseload → Workspace → Intervention | ✅ Preservada | Funcionalidad intacta |
| Compatibilidad legacy | ✅ Preservada | Los pacientes sin OperationalCase siguen mostrando fallback de eventos |

---

## 5. Actuar — Conclusión

El módulo Followup/Caseload avanzó significativamente en su evolución UX:

- **Antes**: Dashboard de eventos técnicos, lista densa de alertas, panel de intervención con información cruda
- **Después**: Superficie operacional humana donde el profesional ve casos, narrativas, ownership, acciones y resúmenes operativos

Esta es una **mejora incremental segura**. La nueva capa operacional coexistió con la existente sin romper nada. El usuario profesional ahora tiene una experiencia que prioriza el "qué está pasando" y "qué debo hacer" sobre la interpretación de datos técnicos.

El módulo aún no está terminado — quedan secciones densas por refactorizar — pero ya hay una capa visible de coordinación clínica-operacional que mejora la usabilidad del sistema.

---

## 6. Deuda técnica

### A. InterventionPanel.tsx sigue siendo archivo legacy grande

- **Tamaño**: ~1735 líneas
- **Riesgo**: Alto para refactors profundos sin extracción previa
- **Reasoning**: El archivo contiene JSX denso con múltiples secciones anidadas (riskCardStyle, interpretation, timeline, actions). Envolver bloques grandes sin extraer primero componentes independientes rompería la estructura.

### B. Refactor futuro recomendado para InterventionPanel.tsx

Extracciones necesarias antes de intentar colapsables o reestructuración profunda:

1. **Extraer RiskDetailsTechnicalSection**
   - Contiene: "Resumen del caso", "Criterios aplicados", "Factores clínicos de base", "Override rules"
   - Reasoning: Esta sección es la más densa técnicamente (~400 líneas)

2. **Extraer ClinicalInterpretationSection**
   - Contiene: "Interpretación clínica", causa probable, relación con contexto reciente
   - Reasoning: Sección semántica que podría separarse del bloque técnico

3. **Extraer InterventionActionsSection**
   - Contiene: botones de acción, próximos pasos
   - Reasoning: Lógica de interacción separada del contenido informativo

4. **Extraer TechnicalEvidenceSection**
   - Contiene: datos fuente, explainability reasons, input sources
   - Reasoning: Esta información debe ser collapsible por defecto, no visible

5. **Mover estilos pesados a archivo de estilos**
   - Actualmente los estilos inline occupies ~300 líneas
   - Reasoning: Mantenerlos en el componente dificulta la lectura

6. **Mover helpers de traducción semántica a logic**
   - Funciones como `getRiskBandLabel()`, `getPriorityHintLabel()` deben estar en `logic/`
   - Reasoning: Separar lógica de presentación

7. **Crear colapsable "Ver detalles técnicos"**
   - Solo después de las extracciones anteriores
   - Reasoning: Con componentes separados, el colapsable es seguro y mantenible

### C. Caseload tiene fallback legacy

- **Situación**: Pacientes sin OperationalCase aún muestran eventos técnicos
- **Depende de**: Aggregation v0.2 para generar más OperationalCase
- **Recomendación**: Crear más casos operacionales para escenarios de onboarding, contactabilidad, riesgo glucémico

### D. Intervention Panel muestra densidad técnica en secciones profundas

- **Situación**: Las subsecciones de "Orientación clínica y operativa" siguen siendo técnicas
- **Depende de**: Refactor por secciones (item B)
- **Recomendación**: No intentar parches directos, seguir el plan de extracción

### E. Tests con fallos preexistentes

- **Situación**: 4 tests fallando (no relacionados con estos cambios)
- **Origen**: Previamente documentado en otras bitácoras
- **Recomendación**: Documentar como deuda separada si corresponde

---

## 7. Próximos pasos recomendados

1. **Mejorar Information Architecture del Intervention Panel**
   - Continuar el patrón de InterventionSummary y RiskBrief para otras secciones

2. **Diseñar refactor técnico seguro por extracción de secciones**
   - Seguir el plan de extracción detallado en deuda técnica (ítem B)

3. **Continuar Aggregation Evolution v0.2**
   - Generar más OperationalCase para覆盖率 de pacientes

4. **Mejorar Caseload para pacientes sin OperationalCase**
   - Diseñar fallback apropiado o indicador de "sin caso operacional"

5. **Revisar educadores/interdisciplinario como siguiente capa funcional**
   - Evaluar si el modelo operacional aplica a otros roles del sistema

---

## 8. Restricciones respetadas

- ✅ No se inventaron resultados no verificados
- ✅ No se declaró el panel como finalizado
- ✅ Se dejó claro que fue una mejora incremental segura
- ✅ El tono se mantiene técnico y profesional

---

**Documento generado:** 11-05-2026
**Autor:** Agent Teams Lite (SDD Workflow)
**Estado:** Parcial — checkpoint cerrado, evolución en curso