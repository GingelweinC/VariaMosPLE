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
import ContextMenu from "./ContextMenu";
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

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<Model>(projectService.currentModel);

  const annotationObserver = useRef<(() => void) | null>(null);
  const [annotationRecords, setAnnotationRecords] = useState<any[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "pane" | "node" | "edge";
    id?: string;
  } | null>(null);

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
    createAnnotationFromContext,
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

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  useEffect(() => {
  if (!model || !projectService.currentLanguage) {
    return;
  }

    setNodes(
      [
        ...model.elements.map((element) =>
          convertElementToNode(
            projectService.currentLanguage.Elements,
            element,
          ),
        ),

        ...model.reifications.map((reification) =>
          convertReificationToNode(
            projectService.currentLanguage.Reifications,
            reification,
          ),
        ),
      ],
    );
    setEdges([
      ...model.relationships.map((relation) =>
        convertRelationToEdge(
          projectService.currentLanguage.Relationships,
          relation,
        ),
      ),

      ...model.reifications.flatMap((reification) =>
        reification.endpoints.flatMap((endpoint) =>
          convertReificationEndpointToEdges(
            projectService.currentLanguage.Reifications,
            reification.typeId,
            reification.id,
            endpoint,
          ),
        ),
      ),
    ]);
  }, [
    model,
    projectService.currentLanguage,
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
              modelChanged = true;
            }
          } else if (node.type === "reification") {
            const reification = convertNodeToReification(node);

            const modelReification =
              projectService.findModelReificationById(
                projectService.currentModel,
                reification.id,
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

          if (!node) {
            return;
          }

          const width = change.dimensions?.width;
          const height = change.dimensions?.height;

          if (width == null || height == null) {
            return;
          }

          if (node.type === "element") {
            const element = convertNodeToElement(node);

            const modelElement = projectService.findModelElementById(
              projectService.currentModel,
              element.id,
            );

            if (modelElement) {
              modelElement.width = width;
              modelElement.height = height;
              modelChanged = true;
            }
          } else if (node.type === "reification") {
            const reification = convertNodeToReification(node);

            const modelReification =
              projectService.findModelReificationById(
                projectService.currentModel,
                reification.id,
              );

            if (modelReification) {
              modelReification.width = width;
              modelReification.height = height;
              modelChanged = true;
            }
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

          if (edge.type === "relation") {
            projectService.removeModelRelationshipById(
              projectService.currentModel,
              edge.id,
            );

            modelChanged = true;
            return;
          }

          if (edge.type === "reificationEndpoint") {
            const reification =
              projectService.findModelReificationById(
                projectService.currentModel,
                edge.source,
              );

            if (!reification) {
              return;
            }

            const endpoint = reification.endpoints.find(
              (endpoint) => endpoint.id === edge.sourceHandle,
            );

            if (!endpoint) {
              return;
            }

            endpoint.elements = endpoint.elements.filter(
              (elementId) => elementId !== edge.target,
            );

            modelChanged = true;
          }
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

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "pane",
      });
    },
    [],
  );

  const handleNodeContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, node: Node) => {
      event.preventDefault();

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        id: node.id,
      });
    },
    [],
  );

  const handleEdgeContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        id: edge.id,
      });
    },
    [],
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
    setCurrentRelationType(null);
    setCurrentEndpointType(null);
  };

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (currentRelationType !== null) {
        const newRelation = Relationship.fromRelationType(currentRelationType, params.source, params.target)

        projectService.currentModel.relationships.push(newRelation);

        const newEdge = convertRelationToEdge(
          projectService.currentLanguage.Relationships,
          newRelation,
        );

        setEdges((edgesSnapshot) => [
          newEdge,
          ...edgesSnapshot,
        ]);

        setCurrentRelationType(null);
        setCurrentEndpointType(null);

        syncModelChanges();

        return;
      }

      if (currentEndpointType) {
        const reification =
          projectService.currentModel.reifications.find(
            (reification) => reification.id === params.source,
          );

        if (!reification) {
          return;
        }

        let endpoint = reification.endpoints.find(
          (endpoint) => endpoint.id === params.sourceHandle,
        );

        if (!endpoint) {
          endpoint = new Endpoint(
            currentEndpointType.uuid,
            [],
          );

          reification.endpoints.push(endpoint);
        }

        endpoint.elements.push(params.target);

        const newEdges = convertReificationEndpointToEdges(
          projectService.currentLanguage.Reifications,
          reification.typeId,
          reification.id,
          endpoint,
        );

        const newEdge = newEdges.at(-1);

        if (newEdge) {
          setEdges((edgesSnapshot) => [
            newEdge,
            ...edgesSnapshot,
          ]);
        }

        setCurrentEndpointType(null);

        syncModelChanges();
      }
    },
    [
      currentRelationType,
      currentEndpointType,
      projectService,
      syncModelChanges,
      setCurrentRelationType,
      setCurrentEndpointType,
    ],
  );

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
          onPaneContextMenu={handlePaneContextMenu}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          onPaneClick={handlePaneClick}
          onNodeClick={handlePaneClick}
          onEdgeClick={handlePaneClick}
        >
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              nodes={nodes}
              edges={edges}
              externalFunctions={projectService.externalFunctions}
              onDelete={() => {
                setNodes((nodesSnapshot) =>
                  nodesSnapshot.filter((node) => node.id !== contextMenu.id),
                );
                setEdges((edgesSnapshot) =>
                  edgesSnapshot.filter((edge) => edge.id !== contextMenu.id),
                );
                setContextMenu(null);
              }}
              onProperties={() => {
                setContextMenu(null);

                // ton code
              }}
              onAddComment={() => {
                createAnnotationFromContext(
                  contextMenu.x,
                  contextMenu.y,
                );

                setContextMenu(null);
              }}
              onExternalFunction={(index) => {
                setContextMenu(null);

                // ton code
              }}
            />
          )}
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
