import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { fetchOwnershipGraph } from '@/services/shareholders'
import { CompanyNode } from './nodes/CompanyNode'
import { PersonNode } from './nodes/PersonNode'
import { getLayoutedElements, findRootNodes, calculateNodeLevels } from './utils/layoutUtils'

interface OwnershipGraphProps {
  rootOrgnr: string
  onCompanySelect: (orgnr: string) => void
}

const nodeTypes = {
  company: CompanyNode,
  person: PersonNode,
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

  // Transform data to React Flow format and apply layout
  const { nodes, edges } = useMemo(() => {
    if (!graphData?.nodes || !graphData?.edges) {
      return { nodes: [], edges: [] }
    }

    const initialNodes: Node[] = graphData.nodes.map(node => ({
      id: node.id,
      type: node.type === 'company' ? 'company' : 'person',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: { 
        label: node.label,
        orgnr: node.orgnr,
        isRoot: node.orgnr === rootOrgnr,
        ...node.data
      },
      measured: { width: 200, height: 80 }
    }))

    const initialEdges: Edge[] = graphData.edges.map(edge => ({
      id: edge.id || `${edge.source}-${edge.target}`,
      source: edge.source || edge.from,
      target: edge.target || edge.to,
      label: `${edge.percentage?.toFixed(1)}%` || edge.label,
      type: 'smoothstep',
      animated: false,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      labelStyle: { 
        fill: 'hsl(var(--foreground))', 
        fontSize: 12, 
        fontWeight: 600 
      },
      labelBgStyle: { 
        fill: 'hsl(var(--background))', 
        stroke: 'hsl(var(--border))',
        strokeWidth: 1
      }
    }))

    // Apply layout directly in the same useMemo to avoid extra re-renders
    if (initialNodes.length === 0) return { nodes: [], edges: [] }
    return getLayoutedElements(initialNodes, initialEdges, 'TB')
  }, [graphData, rootOrgnr])

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges)

  // Update flow state when data changes (only when necessary)
  useEffect(() => {
    setFlowNodes(nodes)
    setFlowEdges(edges)
  }, [nodes, edges])

  // Handle node clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.orgnr && typeof node.data.orgnr === 'string' && node.data.orgnr !== rootOrgnr) {
      onCompanySelect(node.data.orgnr as string)
    }
  }, [onCompanySelect, rootOrgnr])

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
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <Background 
            color="hsl(var(--muted-foreground))" 
            gap={20} 
            size={1}
          />
          <Controls />
          <MiniMap 
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--muted) / 0.6)"
            style={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))'
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}