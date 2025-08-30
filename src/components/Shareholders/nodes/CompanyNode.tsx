import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Building2 } from 'lucide-react'

interface CompanyNodeProps {
  data: {
    label: string
    orgnr?: string
    isRoot?: boolean
  }
}

export const CompanyNode: React.FC<CompanyNodeProps> = ({ data }) => {
  return (
    <div className={`
      min-w-[180px] p-3 rounded-lg border-2 bg-card text-card-foreground shadow-md
      ${data.isRoot ? 'border-primary bg-primary/5' : 'border-border'}
      hover:shadow-lg transition-shadow
    `}>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={16} className={data.isRoot ? 'text-primary' : 'text-muted-foreground'} />
        <span className="text-xs font-medium text-muted-foreground">Selskap</span>
      </div>
      
      <div className="font-semibold text-sm leading-tight mb-1">
        {data.label}
      </div>
      
      {data.orgnr && (
        <div className="text-xs text-muted-foreground font-mono">
          {data.orgnr}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}