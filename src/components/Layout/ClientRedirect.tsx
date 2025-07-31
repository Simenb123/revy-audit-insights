import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const ClientRedirect = (): null => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we're on the base client route without a section, redirect to trial-balance
    if (clientId && location.pathname === `/clients/${clientId}`) {
      navigate(`/clients/${clientId}/trial-balance`, { replace: true });
    }
  }, [clientId, navigate, location.pathname]);

  return null;
};

export default ClientRedirect;