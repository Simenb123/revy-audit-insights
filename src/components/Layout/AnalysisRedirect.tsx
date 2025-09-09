import { useParams, Navigate } from 'react-router-dom';

const AnalysisRedirect = () => {
  const { clientId } = useParams<{ clientId: string }>();
  
  if (!clientId) {
    return <Navigate to="/clients" replace />;
  }
  
  return <Navigate to={`/clients/${clientId}/analysis`} replace />;
};

export default AnalysisRedirect;