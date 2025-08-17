import { Navigate, useParams } from 'react-router-dom';

// Redirect old client-specific investment routes to new global resource routes
export const InvestmentSecuritiesRedirect = () => {
  return <Navigate to="/resources/securities/catalog" replace />;
};

export const InvestmentPricesRedirect = () => {
  return <Navigate to="/resources/securities/prices" replace />;
};

export const InvestmentCurrenciesRedirect = () => {
  return <Navigate to="/resources/currencies" replace />;
};