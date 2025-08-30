import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { User } from 'lucide-react'

interface PersonNodeProps {
  data: {
    label: string
    birth_year?: number
    country_code?: string
  }
}

export const PersonNode: React.FC<PersonNodeProps> = ({ data }) => {
  return (
    <div className="
      min-w-[180px] p-3 rounded-lg border-2 border-border bg-secondary/50 
      text-secondary-foreground shadow-md hover:shadow-lg transition-shadow
    ">
      <Handle type="target" position={Position.Top} className="!bg-secondary" />
      
      <div className="flex items-center gap-2 mb-1">
        <User size={16} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Person</span>
      </div>
      
      <div className="font-semibold text-sm leading-tight mb-1">
        {data.label}
      </div>
      
      <div className="flex gap-2 text-xs text-muted-foreground">
        {data.birth_year && (
          <span>Født: {data.birth_year}</span>
        )}
        {data.country_code && (
          <span className="font-mono">{data.country_code}</span>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-secondary" />
    </div>
  )
}