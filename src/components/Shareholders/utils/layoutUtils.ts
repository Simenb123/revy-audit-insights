import dagre from 'dagre'
import { Node, Edge } from '@xyflow/react'

export interface LayoutedElements {
  nodes: Node[]
  edges: Edge[]
}

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB'
): LayoutedElements => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.measured?.width || 200, 
      height: node.measured?.height || 80 
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.measured?.width || 200) / 2,
        y: nodeWithPosition.y - (node.measured?.height || 80) / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export const findRootNodes = (nodes: Node[], edges: Edge[]): string[] => {
  const hasIncomingEdge = new Set(edges.map(edge => edge.target))
  return nodes
    .filter(node => !hasIncomingEdge.has(node.id))
    .map(node => node.id)
}

export const calculateNodeLevels = (nodes: Node[], edges: Edge[], rootId: string): Map<string, number> => {
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  
  const dfs = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    levels.set(nodeId, level)
    
    const childEdges = edges.filter(edge => edge.source === nodeId)
    childEdges.forEach(edge => {
      dfs(edge.target, level + 1)
    })
  }
  
  dfs(rootId, 0)
  return levels
}