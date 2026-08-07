import "./index.css";
import "@xyflow/react/dist/style.css";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
} from "@xyflow/react";
import SideBar from "./SideBar";
import { useCallback, useEffect, useState } from "react";
import ElementNode, { convertElementToNode } from "./ElementNode";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import ReificationNode from "./ReificationNode";
import RelationEdge, { convertRelationToEdge } from "./RelationEdge";

const dummy_element_types = [
  {
    languageId: "7b4d9a3e-d5fe-4fd3-8598-1ea4fe09c050",
    uuid: "bfd05474-2935-4c08-a5a6-a57e51bf8c99",
    name: "My First Element",
    description: "The first element I create in The new Language Table",
    style: {
      fill: { type: "solid", value: "#ffffff" },
      font: { size: 12, color: "#000000" },
      stroke: { type: "solid", value: "#000000", width: 1 },
    },
    properties: {},
    constraint: "$$$$",
    createdAt: "2026-07-23T19:14:17.721Z",
    updatedAt: "2026-07-23T19:14:17.721Z",
  },
  {
    languageId: "7b4d9a3e-d5fe-4fd3-8598-1ea4fe09c050",
    uuid: "e9d35069-91c1-45de-a554-75ccfc9b761f",
    name: "My second Element",
    description: "see other description of first element",
    style: {
      fill: { type: "solid", value: "#ffffff" },
      font: { size: 12, color: "#000000" },
      stroke: { type: "solid", value: "#000000", width: 1 },
    },
    properties: {},
    constraint: "$$$",
    createdAt: "2026-07-23T19:14:34.120Z",
    updatedAt: "2026-07-23T19:14:34.120Z",
  },
];

export default function GraphEditor({
  projectService,
}: Readonly<{
  projectService: ProjectService;
}>): JSX.Element {
  const [currentModel, setCurrentModel] = useState<Model>(
    projectService.currentModel,
  );

  projectService.addSelectedModelListener((e: { model: Model }) => {
    setCurrentModel(e.model);
  });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setNodes(currentModel.elements.map(convertElementToNode));
    setEdges(currentModel.relationships.map(convertRelationToEdge));
  }, [currentModel]);

  const nodeTypes: NodeTypes = {
    element: ElementNode,
    reification: ReificationNode,
  };
  const edgeTypes: EdgeTypes = {
    relation: RelationEdge,
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  return (
    <div className="graph-editor">
      <div className="graph-container">
        <ReactFlow
          panOnDrag={[1, 2]}
          panOnScroll
          selectionOnDrag
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background variant={BackgroundVariant.Cross} color="gray" />
          <Controls />
          <MiniMap pannable />
        </ReactFlow>
      </div>
      <SideBar element_types={dummy_element_types} />
    </div>
  );
}
