
import React from 'react'
import RevyAssistantCard from './RevyAssistantCard'
import { RevyContext } from '@/types/revio'

interface SimplifiedSidebarSectionProps {
  title: string
  description: string
  className?: string
  clientData?: { id: string }
  context?: RevyContext
}

const SimplifiedSidebarSection: React.FC<SimplifiedSidebarSectionProps> = ({
  title,
  description,
  className = '',
  clientData,
  context = 'general'
}) => {
  return (
    <RevyAssistantCard
      title={title}
      description={description}
      className={className}
      clientData={clientData}
      context={context}
    />
  )
}

export default SimplifiedSidebarSection;
