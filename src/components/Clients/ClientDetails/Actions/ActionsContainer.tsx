import React from "react";
import AuditActionsTab from "../AuditActionsTab";

interface ActionsContainerProps {
  clientId: string;
  phase?: string;
}

const ActionsContainer: React.FC<ActionsContainerProps> = ({
  clientId,
  phase,
}) => {
  return <AuditActionsTab clientId={clientId} phase={phase} />;
};

export default ActionsContainer;
