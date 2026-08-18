import "./index.css";
import "@xyflow/react/dist/style.css";

import {
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
import ElementNode, {
  convertElementToNode,
  convertNodeToElement,
} from "./ElementNode";
import ProjectService from "../../Application/Project/ProjectService";
import ReificationNode, {
  convertReificationToNode,
  convertNodeToReification,
} from "./ReificationNode";
import RelationEdge, { convertRelationToEdge } from "./RelationEdge";
import {
  ConnectingContextProvider,
  useConnectionContext,
} from "./ConnectionContext";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";
import ReificationEndpointEdge from "./ReificationEndpointEdge";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";

export default function GraphEditor({
  projectService,
}: Readonly<{
  projectService: ProjectService;
}>): JSX.Element {
  return (
    <ConnectingContextProvider>
      <GraphEditorContent projectService={projectService} />
    </ConnectingContextProvider>
  );
}

function GraphEditorContent({
  projectService,
}: Readonly<{
  projectService: ProjectService;
}>): JSX.Element {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { currentRelationType, setCurrentRelationType } =
    useConnectionContext();

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
    ReificationEndpoint: ReificationEndpointEdge,
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => {
        const updatedNodes = applyNodeChanges(changes, nodesSnapshot);

        changes.forEach((change) => {
          console.log("change", change);
          if (change.type === "add") {
            return;
          }

          if (change.type === "remove") {
            const node = nodesSnapshot.find((node) => node.id === change.id);

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

          const node = updatedNodes.find((node) => node.id === change.id);

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

  const onConnect: OnConnect = (params) => {
    if (currentRelationType !== null) {
      const newRelation = new Relationship(
        crypto.randomUUID(),
        "New " + currentRelationType.name,
        currentRelationType.uuid,
        params.source,
        params.target,
        [],
        0,
        Number.MAX_SAFE_INTEGER,
      );
      projectService.currentModel.relationships.push(newRelation);
      const newEdge = convertRelationToEdge(
        projectService.currentLanguage.Relationships,
        newRelation,
      );
      console.log(newRelation, newEdge);
      setEdges((edgesSnapshot) => [newEdge, ...edgesSnapshot]);
      setCurrentRelationType(null);
    }
  };

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
        relationTypes={projectService.currentLanguage.Relationships}
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

          setNodes((nodesSnapshot) => [...nodesSnapshot, node]);
        }}
        addReification={(reification: Reification) => {
          const node = convertReificationToNode(
            projectService.currentLanguage.Reifications,
            reification,
          );

          projectService.currentModel.reifications.push(reification);

          setNodes((nodesSnapshot) => [...nodesSnapshot, node]);
        }}
      />
    </div>
  );
}
