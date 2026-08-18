import "./index.css";
import "@xyflow/react/dist/style.css";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  EdgeTypes,
  MiniMap,
  Node,
  NodeTypes,
  OnConnectStart,
  OnConnectEnd,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import SideBar from "./SideBar";
import ElementNode, {
  convertElementToNode,
  convertNodeToElement,
} from "./ElementNode";
import ReificationNode, {
  convertReificationToNode,
  convertNodeToReification,
  ReificationNodeType,
} from "./ReificationNode";

import RelationEdge, { convertRelationToEdge } from "./RelationEdge";
import {
  ConnectingContextProvider,
  useConnectionContext,
} from "./ConnectionContext";
import {
  Endpoint,
  Reification,
} from "../../Domain/ProductLineEngineering/Entities/Reification";
import ReificationEndpointEdge, {
  convertReificationEndpointToEdges,
} from "./ReificationEndpointEdge";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import ProjectService from "../../Application/Project/ProjectService";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import {
  setUserIdle,
  setUserMovingCell,
  setUserResizingCell,
} from "../../DataProvider/Services/collab/collaborationAwarenessService";

import AnnotationPanel from "../Annotation/AnnotationPanel";
import HistoryPanel from "../HistoryProject/HistoryPanel";
import AnnotationLayer from "../Annotation/NewAnnotationLayer";

import { useGraphAwareness } from "./useGraphAwareness";
import GraphAwareness from "./GraphAwareness";
import { GraphHeader } from "./GraphHeader";
import { useAnnotationHandlers } from "./useAnnotation";
import { useHistory } from "./useHistory";
import { useModelSynchronization } from "./useModelSynchronization";

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

  const {
    currentRelationType,
    setCurrentRelationType,
    currentEndpointType,
    setCurrentEndpointType,
  } = useConnectionContext();

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [showAnnotationPanel, setAnnotationPanel] = useState(false);

  const [isCollaborative, setIsCollaborative] = useState(false);
  const [collaborators, setCollaborators] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>
  >([]);

  const [model, setModel] = useState<Model>(projectService.currentModel);

  const annotationObserver = useRef<(() => void) | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [annotationRecords, setAnnotationRecords] = useState<any[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);

  useEffect(() => {
    const projectInfo = projectService.getProjectInformation();

    setIsCollaborative(projectInfo?.is_collaborative || false);
    setCollaborators(projectInfo?.collaborators || []);
  }, [projectService]);

  const { syncModelChanges } = useModelSynchronization({
    projectService,
    model,
    nodes,
    setNodes,
    edges,
    setEdges,
    isCollaborative,
    setModel,
  });

  const {
    loadAnnotations,
    saveAnnotation,
    updateAnnotation,
    deleteAnnotation,
    resolveAnnotation,
    unresolveAnnotation,
    openAnnotationPanel,
    closeAnnotationPanel,
  } = useAnnotationHandlers({
    model,
    projectService,
    annotationRecords,
    setAnnotationRecords,
    setPendingAnnotation,
    setAnnotationPanel,
    annotationObserver,
  });

  const { revertHistoryItem, loadProjectHistory, openHistoryPanel } =
    useHistory({
      projectService,
      setModel,
      syncModelChanges,
      setHistoryRecords,
      setShowHistoryPanel,
    });

  const { screenToFlowPosition } = useReactFlow();

  const { awarenessStates, collaborativeUsers, updateCursor, updateAction } =
    useGraphAwareness({
      projectService,
      model,
      collaborators,
      isCollaborative,
    });

  const handleNodeResizeEnd = useCallback(
    (nodeId: string, width: number, height: number) => {
      const modelElement = projectService.findModelElementById(
        projectService.currentModel,
        nodeId,
      );

      if (!modelElement) {
        return;
      }

      modelElement.width = width;
      modelElement.height = height;

      projectService.raiseEventUpdatedElement(
        projectService.currentModel,
        modelElement,
      );

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== nodeId || node.type !== "element") {
            return node;
          }

          return {
            ...node,
            width,
            height,
            data: {
              ...node.data,
              element: modelElement,
              style: {
                ...(node.data as any).style,
                width,
                height,
              },
            },
          };
        }),
      );

      syncModelChanges();

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId) {
        setUserIdle(projectId, modelId);
      }
    },
    [projectService, model?.id, syncModelChanges],
  );

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  useEffect(() => {
    if (!projectService.currentModel || !projectService.currentLanguage) {
      return;
    }

    setNodes([
      ...projectService.currentModel.elements.map((element) =>
        convertElementToNode(
          projectService.currentLanguage.Elements,
          element,
          handleNodeResizeEnd,
        ),
      ),
      ...projectService.currentModel.reifications.map((reification) =>
        convertReificationToNode(
          projectService.currentLanguage.Reifications,
          reification,
        ),
      ),
    ]);
    setEdges([
      ...projectService.currentModel.relationships.map((relation) =>
        convertRelationToEdge(
          projectService.currentLanguage.Relationships,
          relation,
        ),
      ),
      ...projectService.currentModel.reifications.flatMap((reification) =>
        reification.endpoints.flatMap((endpoint) =>
          convertReificationEndpointToEdges(
            projectService.currentLanguage.Reifications,
            reification.id,
            endpoint,
          ),
        ),
      ),
    ]);
  }, [
    projectService.currentLanguage,
    projectService.currentModel,
    handleNodeResizeEnd,
  ]);

  const nodeTypes: NodeTypes = {
    element: ElementNode,
    reification: ReificationNode,
  };

  const edgeTypes: EdgeTypes = {
    relation: RelationEdge,
    reificationEndpoint: ReificationEndpointEdge,
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      const updatedNodes = applyNodeChanges(changes, nodes);
      let modelChanged = false;

      changes.forEach((change) => {
        if (change.type === "position") {
          if (projectId && modelId) {
            if (change.dragging) {
              setUserMovingCell(projectId, modelId, change.id, change.position);
            } else {
              setUserIdle(projectId, modelId);
            }
          }

          const node = updatedNodes.find(
            (currentNode) => currentNode.id === change.id,
          );

          if (!node) {
            return;
          }

          if (node.type === "element") {
            const element = convertNodeToElement(node);
            const modelElement = projectService.findModelElementById(
              projectService.currentModel,
              element.id,
            );

            if (modelElement) {
              Object.assign(modelElement, element);

              projectService.raiseEventUpdatedElement(
                projectService.currentModel,
                modelElement,
              );

              modelChanged = true;
            }
          } else if (node.type === "reification") {
            const reification = convertNodeToReification(node);

            const modelReification =
              projectService.currentModel.reifications.find(
                (currentReification) =>
                  currentReification.id === reification.id,
              );

            if (modelReification) {
              Object.assign(modelReification, reification);
              modelChanged = true;
            }
          }

          return;
        }

        if (change.type === "dimensions") {
          if (projectId && modelId) {
            if (change.resizing) {
              setUserResizingCell(projectId, modelId, change.id, {
                width: change.dimensions?.width ?? 0,
                height: change.dimensions?.height ?? 0,
              });
            } else {
              setUserIdle(projectId, modelId);
            }
          }

          const node = updatedNodes.find(
            (currentNode) => currentNode.id === change.id,
          );

          if (!node || node.type !== "element") {
            return;
          }

          const element = convertNodeToElement(node);
          const modelElement = projectService.findModelElementById(
            projectService.currentModel,
            element.id,
          );

          if (modelElement) {
            Object.assign(modelElement, element);

            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              modelElement,
            );

            modelChanged = true;
          }

          return;
        }

        if (change.type === "remove") {
          if (!projectId || !modelId) {
            return;
          }

          const node = nodes.find(
            (currentNode) => currentNode.id === change.id,
          );

          if (!node) {
            return;
          }

          if (node.type === "element") {
            projectService.removeModelElementById(
              projectService.currentModel,
              node.id,
            );
          } else if (node.type === "reification") {
            projectService.currentModel.reifications =
              projectService.currentModel.reifications.filter(
                (reification) => reification.id !== node.id,
              );
          }

          modelChanged = true;
          setUserIdle(projectId, modelId);

          return;
        }

        if (change.type === "select") {
          if (projectId && modelId) {
            updateAction({
              type: change.selected ? "selecting" : "idle",
              cellId: change.id,
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      setNodes(updatedNodes);

      if (modelChanged) {
        syncModelChanges();
      }
    },
    [nodes, projectService, model?.id, syncModelChanges, updateAction],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      let modelChanged = false;

      setEdges((edgesSnapshot) => {
        const updatedEdges = applyEdgeChanges(changes, edgesSnapshot);

        changes.forEach((change) => {
          if (change.type !== "remove") {
            return;
          }

          const edge = edgesSnapshot.find(
            (currentEdge) => currentEdge.id === change.id,
          );

          if (!edge) {
            return;
          }

          projectService.removeModelRelationshipById(
            projectService.currentModel,
            edge.id,
          );

          modelChanged = true;
        });

        return updatedEdges;
      });

      if (modelChanged) {
        syncModelChanges();
      }
    },
    [projectService, syncModelChanges],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      updateCursor(position.x, position.y);
    },
    [screenToFlowPosition, updateCursor],
  );

  const onConnectStart: OnConnectStart = (event, params) => {
    const node = nodes.find((node) => node.id === params.nodeId);
    if (node.type === "reification") {
      const reificationType = projectService.currentLanguage.Reifications.find(
        (reificationType) =>
          reificationType.uuid ===
          (node as ReificationNodeType).data.reification.typeId,
      );
      const endpointType = reificationType.endpoints.find(
        (endpointType) => endpointType.uuid === params.handleId,
      );
      setCurrentEndpointType(endpointType);
    }
  };

  const onConnectEnd: OnConnectEnd = (event, connectionState) => {
    const node = nodes.find((node) => node.id === connectionState.fromNode.id);
    if (node.type === "reificationEndpoint") {
      setCurrentEndpointType(null);
    }
  };

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
      setEdges((edgesSnapshot) => [newEdge, ...edgesSnapshot]);
      setCurrentRelationType(null);
    }
    if (currentEndpointType) {
      let reification = projectService.currentModel.reifications.find(
        (reification) => reification.id === params.source,
      );
      let endpoint = reification.endpoints.find(
        (endpoint) => endpoint.id === params.sourceHandle,
      );
      if (!endpoint) {
        endpoint = new Endpoint(currentEndpointType.id, []);
        reification.endpoints.push(endpoint);
      }
      endpoint.elements.push(params.target);
      const newEdge = convertReificationEndpointToEdges(
        projectService.currentLanguage.Reifications,
        reification.id,
        endpoint,
      ).at(-1);
      setEdges((edgesSnapshot) => [newEdge, ...edgesSnapshot]);
    }
  };

  return (
    <div className="graph-editor" ref={graphContainerRef}>
      <div className="graph-container">
        <GraphHeader
          projectService={projectService}
          nodes={nodes}
          openHistoryPanel={openHistoryPanel}
          openAnnotationPanel={openAnnotationPanel}
        />
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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onMouseMove={handleMouseMove}
        >
          <Background variant={BackgroundVariant.Cross} color="gray" />

          <Controls />

          <MiniMap pannable />

          <GraphAwareness
            currentUserName={
              collaborators.find(
                (collaborator) => collaborator.id === projectService.getUser(),
              )?.name
            }
            awarenessStates={awarenessStates}
            collaborativeUsers={collaborativeUsers}
            modelId={model?.id ?? null}
            nodes={nodes}
            edges={edges}
          />

          <AnnotationLayer
            projectId={projectService.getProject()?.id}
            modelId={model?.id}
            projectService={projectService}
            annotations={
              model
                ? annotationRecords.filter(
                    (item) =>
                      item.modelId === model.id || item.model_id === model.id,
                  )
                : []
            }
            pendingAnnotation={pendingAnnotation}
            onCreate={saveAnnotation}
            onUpdate={updateAnnotation}
            onDelete={deleteAnnotation}
            onResolve={resolveAnnotation}
            onUnresolve={unresolveAnnotation}
            onCancelPending={() => setPendingAnnotation(null)}
          />
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
            handleNodeResizeEnd,
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

      <HistoryPanel
        show={showHistoryPanel}
        onHide={() => setShowHistoryPanel(false)}
        projectService={projectService}
        historyRecords={historyRecords}
        selectedModelId={projectService.currentModel?.id}
        onRefresh={loadProjectHistory}
        onRevertHistoryItem={revertHistoryItem}
      />

      <AnnotationPanel
        show={showAnnotationPanel}
        onHide={closeAnnotationPanel}
        annotations={annotationRecords}
        currentUser={{
          id: projectService.getUser(),
          name:
            collaborators.find(
              (collaborator) => collaborator.id === projectService.getUser(),
            )?.name || "User",
        }}
      />
    </div>
  );
}
