import React, { useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { fetchOwnershipGraph } from '@/services/shareholders'

interface OwnershipGraphProps {
  rootOrgnr: string
  onCompanySelect: (orgnr: string) => void
}

export const OwnershipGraph: React.FC<OwnershipGraphProps> = ({ rootOrgnr, onCompanySelect }) => {
  const [direction, setDirection] = useState<'up' | 'down' | 'both'>('both')
  const [depth, setDepth] = useState(2)
  const [year, setYear] = useState(new Date().getFullYear() - 1)

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['ownership-graph', rootOrgnr, year, direction, depth],
    queryFn: () => fetchOwnershipGraph({ orgnr: rootOrgnr, year, direction, depth }),
    enabled: !!rootOrgnr
  })

  if (!rootOrgnr) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Velg et selskap fra søkeresultatet for å vise eierstruktur
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        Laster eierstruktur...
      </div>
    )
  }

  const nodes = graphData?.nodes?.map(node => ({
    id: node.id,
    type: 'default',
    position: { x: Math.random() * 500, y: Math.random() * 300 },
    data: { 
      label: node.label,
      ...node.data
    }
  })) || []

  const edges = graphData?.edges?.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    data: edge.data
  })) || []

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Label>Retning:</Label>
          <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Opp</SelectItem>
              <SelectItem value="down">Ned</SelectItem>
              <SelectItem value="both">Begge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>Dybde:</Label>
          <Select value={depth.toString()} onValueChange={(v) => setDepth(parseInt(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map(d => (
                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>År:</Label>
          <Input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          style={{ backgroundColor: "#F7F9FB" }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}