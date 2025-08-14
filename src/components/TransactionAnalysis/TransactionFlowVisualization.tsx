import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AccountFlowNode, AccountFlowEdge } from '@/services/transactionFlowService';
import { Badge } from '@/components/ui/badge';

interface TransactionFlowVisualizationProps {
  nodes: AccountFlowNode[];
  edges: AccountFlowEdge[];
  width?: number;
  height?: number;
}

// Custom node component for accounts
const AccountNode = ({ data }: { data: any }) => {
  const getAuditAreaColor = (auditArea: string) => {
    const colors: Record<string, string> = {
      'sales': '#22c55e',
      'receivables': '#3b82f6', 
      'purchases': '#f59e0b',
      'payables': '#ef4444',
      'inventory': '#8b5cf6',
      'cash': '#06b6d4',
      'bank': '#0891b2',
      'payroll': '#84cc16',
      'expenses': '#f97316',
      'other': '#6b7280'
    };
    return colors[auditArea] || '#6b7280';
  };

  const totalFlow = data.totalInflow + data.totalOutflow;
  const netFlow = data.totalInflow - data.totalOutflow;
  const isSource = data.totalOutflow > data.totalInflow;

  return (
    <div 
      className="px-4 py-3 border-2 rounded-lg bg-white shadow-md min-w-[200px]"
      style={{ borderColor: getAuditAreaColor(data.auditArea) }}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant="outline" 
          style={{ 
            backgroundColor: getAuditAreaColor(data.auditArea) + '20',
            borderColor: getAuditAreaColor(data.auditArea),
            color: getAuditAreaColor(data.auditArea)
          }}
        >
          {data.auditArea}
        </Badge>
        {Math.abs(netFlow) > 10000 && (
          <Badge variant={isSource ? "destructive" : "success"}>
            {isSource ? 'Kilde' : 'Mål'}
          </Badge>
        )}
      </div>
      
      <div className="font-medium text-sm mb-1">
        {data.accountNumber}
      </div>
      <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {data.accountName}
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Inn:</span>
          <span className="font-medium text-green-600">
            {data.totalInflow.toLocaleString('no-NO')} kr
          </span>
        </div>
        <div className="flex justify-between">
          <span>Ut:</span>
          <span className="font-medium text-red-600">
            {data.totalOutflow.toLocaleString('no-NO')} kr
          </span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span>Netto:</span>
          <span className={`font-medium ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netFlow.toLocaleString('no-NO')} kr
          </span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  account: AccountNode,
};

export const TransactionFlowVisualization: React.FC<TransactionFlowVisualizationProps> = ({
  nodes: flowNodes,
  edges: flowEdges,
  width = 800,
  height = 600
}) => {
  
  const { nodes, edges } = useMemo(() => {
    // Konverter til React Flow format
    const maxFlow = Math.max(...flowNodes.map(n => n.totalInflow + n.totalOutflow));
    
    // Opprett noder
    const reactFlowNodes: Node[] = flowNodes.map((node, index) => {
      const totalFlow = node.totalInflow + node.totalOutflow;
      const size = Math.max(80, Math.min(200, (totalFlow / maxFlow) * 150 + 80));
      
      // Posisjonering basert på audit area og flyt
      const auditAreaIndex = ['sales', 'receivables', 'cash', 'bank', 'purchases', 'payables', 'inventory', 'payroll', 'expenses', 'other'].indexOf(node.auditArea);
      const x = (auditAreaIndex % 4) * 250 + Math.random() * 50;
      const y = Math.floor(auditAreaIndex / 4) * 200 + Math.random() * 50;

      return {
        id: node.accountNumber,
        type: 'account',
        position: { x, y },
        data: {
          ...node,
          size
        },
        style: {
          width: size,
          height: 'auto'
        }
      };
    });

    // Opprett edges
    const reactFlowEdges: Edge[] = flowEdges.map((edge, index) => {
      const getEdgeColor = (riskLevel: string) => {
        switch (riskLevel) {
          case 'high': return '#ef4444';
          case 'medium': return '#f59e0b';
          default: return '#6b7280';
        }
      };

      const strokeWidth = Math.max(1, Math.min(8, edge.totalAmount / 100000));

      return {
        id: `${edge.fromAccount}_${edge.toAccount}`,
        source: edge.fromAccount,
        target: edge.toAccount,
        type: 'smoothstep',
        animated: edge.isUnusual,
        style: {
          stroke: getEdgeColor(edge.riskLevel),
          strokeWidth
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(edge.riskLevel)
        },
        label: `${edge.totalAmount.toLocaleString('no-NO', { notation: 'compact' })} kr`,
        labelStyle: {
          fontSize: '11px',
          fontWeight: edge.isUnusual ? 'bold' : 'normal',
          fill: edge.isUnusual ? '#ef4444' : '#374151'
        },
        data: {
          totalAmount: edge.totalAmount,
          transactionCount: edge.transactionCount,
          averageAmount: edge.averageAmount,
          isUnusual: edge.isUnusual,
          riskLevel: edge.riskLevel
        }
      };
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }, [flowNodes, flowEdges]);

  const [reactFlowNodes, setNodes] = useNodesState(nodes);
  const [reactFlowEdges, setEdges] = useEdgesState(edges);

  return (
    <div style={{ width, height }} className="border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ backgroundColor: '#f8fafc' }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md border text-xs space-y-1">
        <div className="font-medium mb-2">Tegnforklaring</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-400"></div>
          <span>Normal flyt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span>Middels risiko</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span>Høy risiko</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-red-500 animate-pulse"></div>
          <span>Uvanlig flyt</span>
        </div>
      </div>
    </div>
  );
};