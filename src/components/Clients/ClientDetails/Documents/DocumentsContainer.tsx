import React from "react";
import ClientDocumentManager from "@/components/ClientDocuments/ClientDocumentManager";

interface DocumentsContainerProps {
  clientId: string;
  clientName?: string;
}

const DocumentsContainer: React.FC<DocumentsContainerProps> = ({
  clientId,
  clientName,
}) => {
  return (
    <ClientDocumentManager
      clientId={clientId}
      clientName={clientName}
      enableAI
    />
  );
};

export default DocumentsContainer;
