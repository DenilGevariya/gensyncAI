"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// --- Custom Node component ---
function TurboNode({ data }) {
  return (
    <div className="p-4 rounded-xl shadow-lg bg-white border border-gray-200 w-64">
      <h3 className="font-semibold text-lg text-gray-800">{data.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{data.description}</p>
      {data.link && (
        <a
          href={data.link}
          target="_blank"
          className="mt-2 inline-block text-blue-500 text-sm underline"
        >
          Learn More
        </a>
      )}
      {/* Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// --- Branch Node (e.g., forks in roadmap) ---
function BranchNode({ data }) {
  return (
    <div className="p-4 rounded-xl shadow-lg bg-green-100 border border-green-300 w-64">
      <h3 className="font-semibold text-lg text-green-800">{data.title}</h3>
      <p className="text-sm text-green-700 mt-1">{data.description}</p>
      {data.link && (
        <a
          href={data.link}
          target="_blank"
          className="mt-2 inline-block text-green-700 text-sm underline"
        >
          Learn More
        </a>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  turbo: TurboNode,
  branch: BranchNode,
};

export default function RoadmapCanvas({ nodes, edges }) {
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => [...eds, params]),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      nodeTypes={nodeTypes}
    >
      <Background color="#aaa" gap={16} />
      <Controls />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
    </ReactFlow>
  );
}
