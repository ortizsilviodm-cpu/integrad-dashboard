/* integrad-dashboard/src/pages/CaseloadPage.tsx */

import CaseloadView from "../views/caseload/CaseloadView";

type CaseloadPageProps = {
  onOpenWorkspace?: (input: {
    patientId: string;
    followupEventId?: string | null;
    caseSummary?: string | null;
  }) => void;
};

export default function CaseloadPage({
  onOpenWorkspace,
}: CaseloadPageProps) {
  return <CaseloadView onOpenWorkspace={onOpenWorkspace} />;
}
