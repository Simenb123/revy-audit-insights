import React from 'react';
import { useSubHeader } from './SubHeaderContext';
import GlobalSubHeader from './GlobalSubHeader';

const SubHeaderHost: React.FC = () => {
  const { node } = useSubHeader();
  if (node) return <>{node}</>;
  return <GlobalSubHeader />;
};

export default SubHeaderHost;
