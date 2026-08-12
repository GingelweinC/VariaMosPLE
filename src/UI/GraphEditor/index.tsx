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
import ElementNode, { convertElementToNode, convertNodeToElement } from "./ElementNode";
import ProjectService from "../../Application/Project/ProjectService";
import ReificationNode, { convertReificationToNode, convertNodeToReification } from "./ReificationNode";
import RelationEdge, { convertRelationToEdge } from "./RelationEdge";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";

export default function GraphEditor({
  projectService,
}: Readonly<{
  projectService: ProjectService;
}>): JSX.Element {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setNodes([
      ...projectService.currentModel.elements.map((element) =>
        convertElementToNode(projectService.currentLanguage.Elements, element),
      ),
      ...projectService.currentModel.reifications.map((reification) =>
        convertReificationToNode(
          projectService.currentLanguage.Reifications,
          reification,
        ),
      ),
    ]);
    setEdges(
      projectService.currentModel.relationships.map((relation) =>
        convertRelationToEdge(
          projectService.currentLanguage.Relationships,
          relation,
        ),
      ),
    );
  }, [projectService.currentLanguage, projectService.currentModel]);

  const nodeTypes: NodeTypes = {
    element: ElementNode,
    reification: ReificationNode,
  };
  const edgeTypes: EdgeTypes = {
    relation: RelationEdge,
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => 
      setNodes((nodesSnapshot) => {
        const updatedNodes = applyNodeChanges(
          changes,
          nodesSnapshot,
        );

        changes.forEach((change) => {
          console.log("change", change);
          if (change.type === "add") {
            return;
          }

          if (change.type === "remove") {
            const node = nodesSnapshot.find(
              (node) => node.id === change.id,
            );

            if (!node) {
              return;
            }

            if (node.type === "element") {
              projectService.currentModel.elements =
                projectService.currentModel.elements.filter(
                  (element) => element.id !== node.id,
                );
            } else if (node.type === "reification") {
              projectService.currentModel.reifications =
                projectService.currentModel.reifications.filter(
                  (reification) => reification.id !== node.id,
                );
            }

            return;
          }

          const node = updatedNodes.find(
            (node) => node.id === change.id,
          );

          if (!node) {
            return;
          }

          if (node.type === "element") {
            const element = convertNodeToElement(node);

            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              element,
            );
            console.log("updated model", projectService.currentModel);
            console.log("updated element", element);
            console.log("updated project", projectService.project);
          } else if (node.type === "reification") {
            convertNodeToReification(node);
          }
        });

        return updatedNodes;
      }),
    [projectService],
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
      <SideBar
        elementTypes={projectService.currentLanguage.Elements}
        reificationTypes={projectService.currentLanguage.Reifications}
        addElement={(element: Element) => {
          const node = convertElementToNode(
            projectService.currentLanguage.Elements,
            element,
          );

          projectService.currentModel.elements.push(element);

          projectService.raiseEventCreatedElement(
            projectService.currentModel,
            element,
          );

          setNodes((nodesSnapshot) => [
            ...nodesSnapshot,
            node,
          ]);
        }}
        addReification={(reification: Reification) => {
          const node = convertReificationToNode(
            projectService.currentLanguage.Reifications,
            reification,
          );

          projectService.currentModel.reifications.push(reification);

          setNodes((nodesSnapshot) => [
            ...nodesSnapshot,
            node,
          ]);
        }}
      />
    </div>
  );
}