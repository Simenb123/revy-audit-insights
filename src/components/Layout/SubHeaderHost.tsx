import React from 'react';
import { useSubHeader } from './SubHeaderContext';

const SubHeaderHost: React.FC = () => {
  const { node } = useSubHeader();
  if (!node) return null;
  return <>{node}</>;
};

export default SubHeaderHost;
