import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Copy, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { resolveNodeType, styleByType } from './helpers';
import type { DraftRelation, DocumentNodeType, LegalCrossRef } from '@/types/legal-knowledge';

interface GraphViewProps {
  draftRelations: DraftRelation[];
  demoMode: boolean;
}

interface DetailPanelData {
  type: 'node' | 'edge';
  data: any;
}

const REF_TYPE_LABELS: Record<LegalCrossRef['ref_type'], string> = {
  clarifies: 'Utdyper',
  enabled_by: 'Hjemles i',
  implements: 'Implementerer',
  cites: 'Viser til',
  interprets: 'Tolker',
  applies: 'Anvender',
  mentions: 'Nevner'
};

const DOCTYPE_COLORS: Record<DocumentNodeType, string> = {
  lov: '#3B82F6',          // blue
  forskrift: '#10B981',    // green
  dom: '#8B5CF6',          // purple
  rundskriv: '#F59E0B',    // yellow
  forarbeid: '#6B7280',    // gray
  ukjent: '#9CA3AF'        // light gray
};

// Custom node component
const CustomNode: React.FC<{ data: any }> = ({ data }) => {
  const nodeType = resolveNodeType(data.anchor, data.docType);
  const style = styleByType(nodeType);
  
  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 bg-white min-w-48 max-w-64 ${style.border} ${style.bg}`}
      style={{ borderColor: DOCTYPE_COLORS[nodeType] }}
    >
      <div className="text-xs font-medium text-primary mb-1">
        {data.documentTitle}
      </div>
      <div className="text-sm font-semibold">
        § {data.provisionNumber}
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {data.provisionTitle}
      </div>
      {data.anchor && (
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          {data.anchor}
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const GraphView: React.FC<GraphViewProps> = ({ draftRelations, demoMode }) => {
  const { toast } = useToast();
  const [detailPanel, setDetailPanel] = useState<DetailPanelData | null>(null);

  // Generate nodes and edges from draft relations
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map();
    const edges: Edge[] = [];

    draftRelations.forEach((relation, index) => {
      // Source node
      const sourceId = `source-${relation.fromProvision.id}`;
      if (!nodeMap.has(sourceId)) {
        const sourceType = resolveNodeType(
          relation.fromProvision.anchor,
          relation.fromDocument.document_type_id
        );
        
        nodeMap.set(sourceId, {
          id: sourceId,
          type: 'custom',
          position: { x: 100, y: index * 150 + 100 },
          data: {
            documentTitle: relation.fromDocument.title,
            documentNumber: relation.fromDocument.document_number,
            provisionNumber: relation.fromProvision.provision_number,
            provisionTitle: relation.fromProvision.title,
            anchor: relation.fromProvision.anchor,
            docType: relation.fromDocument.document_type_id,
            sourceUrl: relation.fromDocument.source_url,
            provision: relation.fromProvision,
            document: relation.fromDocument
          }
        });
      }

      // Target node
      const targetId = `target-${relation.toProvision.id}`;
      if (!nodeMap.has(targetId)) {
        const targetType = resolveNodeType(
          relation.toProvision.anchor,
          relation.toDocument.document_type_id
        );
        
        nodeMap.set(targetId, {
          id: targetId,
          type: 'custom',
          position: { x: 500, y: index * 150 + 100 },
          data: {
            documentTitle: relation.toDocument.title,
            documentNumber: relation.toDocument.document_number,
            provisionNumber: relation.toProvision.provision_number,
            provisionTitle: relation.toProvision.title,
            anchor: relation.toProvision.anchor,
            docType: relation.toDocument.document_type_id,
            sourceUrl: relation.toDocument.source_url,
            provision: relation.toProvision,
            document: relation.toDocument
          }
        });
      }

      // Edge
      edges.push({
        id: `edge-${relation.tempId}`,
        source: sourceId,
        target: targetId,
        type: 'default',
        animated: true,
        label: REF_TYPE_LABELS[relation.refType],
        data: {
          relation,
          refType: relation.refType,
          refText: relation.refText
        },
        style: {
          stroke: DOCTYPE_COLORS[resolveNodeType(
            relation.fromProvision.anchor,
            relation.fromDocument.document_type_id
          )],
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: 12,
          fontWeight: 600,
        }
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    };
  }, [draftRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when draft relations change
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = useMemo(() => {
      const nodeMap = new Map();
      const edges: Edge[] = [];

      draftRelations.forEach((relation, index) => {
        // Source node
        const sourceId = `source-${relation.fromProvision.id}`;
        if (!nodeMap.has(sourceId)) {
          nodeMap.set(sourceId, {
            id: sourceId,
            type: 'custom',
            position: { x: 100, y: index * 150 + 100 },
            data: {
              documentTitle: relation.fromDocument.title,
              documentNumber: relation.fromDocument.document_number,
              provisionNumber: relation.fromProvision.provision_number,
              provisionTitle: relation.fromProvision.title,
              anchor: relation.fromProvision.anchor,
              docType: relation.fromDocument.document_type_id,
              sourceUrl: relation.fromDocument.source_url,
              provision: relation.fromProvision,
              document: relation.fromDocument
            }
          });
        }

        // Target node
        const targetId = `target-${relation.toProvision.id}`;
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, {
            id: targetId,
            type: 'custom',
            position: { x: 500, y: index * 150 + 100 },
            data: {
              documentTitle: relation.toDocument.title,
              documentNumber: relation.toDocument.document_number,
              provisionNumber: relation.toProvision.provision_number,
              provisionTitle: relation.toProvision.title,
              anchor: relation.toProvision.anchor,
              docType: relation.toDocument.document_type_id,
              sourceUrl: relation.toDocument.source_url,
              provision: relation.toProvision,
              document: relation.toDocument
            }
          });
        }

        // Edge
        edges.push({
          id: `edge-${relation.tempId}`,
          source: sourceId,
          target: targetId,
          type: 'default',
          animated: true,
          label: REF_TYPE_LABELS[relation.refType],
          data: {
            relation,
            refType: relation.refType,
            refText: relation.refText
          },
          style: {
            stroke: DOCTYPE_COLORS[resolveNodeType(
              relation.fromProvision.anchor,
              relation.fromDocument.document_type_id
            )],
            strokeWidth: 2,
          },
          labelStyle: {
            fontSize: 12,
            fontWeight: 600,
          }
        });
      });

      return {
        nodes: Array.from(nodeMap.values()),
        edges
      };
    }, [draftRelations]);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [draftRelations, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setDetailPanel({
      type: 'node',
      data: node.data
    });
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setDetailPanel({
      type: 'edge',
      data: edge.data
    });
  }, []);

  const handleCopyAnchor = (anchor: string) => {
    navigator.clipboard.writeText(anchor);
    toast({
      title: 'Kopiert',
      description: 'Anker kopiert til utklippstavlen.',
    });
  };

  const handleSendToRevy = (data: any) => {
    // Placeholder for Revy integration
    toast({
      title: 'Send til Revy',
      description: 'Denne funksjonen kommer snart.',
      variant: 'default'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Relasjonsgraf</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full border rounded-lg overflow-hidden">
            {draftRelations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Ingen relasjoner å visualisere</p>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    const nodeType = resolveNodeType(
                      node.data?.anchor as string, 
                      node.data?.docType as string
                    );
                    return DOCTYPE_COLORS[nodeType];
                  }}
                  maskColor="rgb(240, 240, 240, 0.6)"
                />
              </ReactFlow>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            <p className="text-sm font-medium mr-4">Fargekoder:</p>
            {Object.entries(DOCTYPE_COLORS).map(([type, color]) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs"
                style={{ borderColor: color, color }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {detailPanel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {detailPanel.type === 'node' ? 'Bestemmelse' : 'Relasjon'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailPanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailPanel.type === 'node' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{detailPanel.data.documentTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailPanel.data.documentNumber}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium">§ {detailPanel.data.provisionNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {detailPanel.data.provisionTitle}
                  </p>
                </div>

                {detailPanel.data.anchor && (
                  <div>
                    <p className="text-sm font-medium">Anker:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {detailPanel.data.anchor}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {detailPanel.data.sourceUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={detailPanel.data.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Åpne kilde
                      </a>
                    </Button>
                  )}
                  
                  {detailPanel.data.anchor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAnchor(detailPanel.data.anchor as string)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopier anker
                  </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendToRevy(detailPanel.data)}
                    disabled
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send til Revy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Relasjon</h4>
                  <Badge variant="secondary">
                    {REF_TYPE_LABELS[detailPanel.data.refType as LegalCrossRef['ref_type']]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Fra:</p>
                    <p className="text-sm">
                      {detailPanel.data.relation.fromDocument.title}
                    </p>
                    <p className="text-sm font-medium">
                      § {detailPanel.data.relation.fromProvision.provision_number}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Til:</p>
                    <p className="text-sm">
                      {detailPanel.data.relation.toDocument.title}
                    </p>
                    <p className="text-sm font-medium">
                      § {detailPanel.data.relation.toProvision.provision_number}
                    </p>
                  </div>
                </div>

                {detailPanel.data.refText && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notat:</p>
                    <p className="text-sm text-muted-foreground italic">
                      "{detailPanel.data.refText}"
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailPanel(null)}
                >
                  Lukk
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GraphView;