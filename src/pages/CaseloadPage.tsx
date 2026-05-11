/* integrad-dashboard/src/pages/CaseloadPage.tsx */

import CaseloadView from "../views/caseload/CaseloadView";
import type { CaseloadWorkspaceContext } from "../types/caseload.types";

type CaseloadPageProps = {
  onOpenWorkspace?: (input: CaseloadWorkspaceContext) => void;
};

export default function CaseloadPage({
  onOpenWorkspace,
}: CaseloadPageProps) {
  return <CaseloadView onOpenWorkspace={onOpenWorkspace} />;
}
