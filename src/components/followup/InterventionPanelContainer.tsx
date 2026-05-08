import type { ReactNode } from "react";
import type { FollowupEventRow, RiskStratificationV1 } from "../../api/followup";
import { InterventionPanel } from "./InterventionPanel";

type InterventionPanelContainerProps = {
  open: boolean;
  event: FollowupEventRow | null;
  onClose: () => void;
  riskStratification: RiskStratificationV1 | null;
  riskLoading: boolean;
  riskError: string | null;
  historyContent: ReactNode;
  children: ReactNode;
};

export default function InterventionPanelContainer({
  open,
  event,
  onClose,
  riskStratification,
  riskLoading,
  riskError,
  historyContent,
  children,
}: InterventionPanelContainerProps) {
  return (
    <InterventionPanel
      open={open}
      event={event}
      onClose={onClose}
      riskStratification={riskStratification}
      riskLoading={riskLoading}
      riskError={riskError}
      historyContent={historyContent}
    >
      {children}
    </InterventionPanel>
  );
}
