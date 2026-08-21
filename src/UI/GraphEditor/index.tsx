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

import {
  HistoryActionType,
  HistoryEntityType,
} from "../../Domain/ProductLineEngineering/Enums/historyEnum";

import { useGraphAwareness } from "./useGraphAwareness";
import GraphAwareness from "./GraphAwareness";
import { GraphHeader } from "./GraphHeader";
import { useAnnotationHandlers } from "./useAnnotation";
import { useHistory } from "./useHistory";
import { useModelSynchronization } from "./useModelSynchronization";
import ContextMenu from "./ContextMenu";
import { Button, Modal } from "react-bootstrap";
import PropertiesModal from "./PropertiesModal";

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

  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [backupObject, setBackupObject] = useState<any | null>(null);
  const [editingName, setEditing] = useState(selectedObject?.name ?? "");
  useEffect(() => {
    setEditing(selectedObject?.name ?? "");
  }, [selectedObject]);

  const [selectedObjectType, setSelectedObjectType] = useState<
    "element" | "reification" | "relationship" | null
  >(null);

  const [messageModalTitle, setMessageModalTitle] = useState("");
  const [messageModalContent, setMessageModalContent] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);

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

  const {
    revertHistoryItem,
    loadProjectHistory,
    openHistoryPanel,
    registerHistoryEvent,
    initializeHistorySync,
    subscribeToHistoryChanges,
  } = useHistory({
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
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const setupHistorySync = async () => {
      const initialized = await initializeHistorySync();

      if (!initialized || cancelled) {
        return;
      }

      unsubscribe = subscribeToHistoryChanges();
    };

    setupHistorySync();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [initializeHistorySync, subscribeToHistoryChanges]);

  useEffect(() => {
    const handleSelectedUpdate = (itemSelected: string) => {
      if (itemSelected === "model") {
        setModel(projectService.currentModel);
      }
    };

    projectService.addUpdateSelectedListener(handleSelectedUpdate);

    return () => {
      projectService.removeUpdateSelectedListener(handleSelectedUpdate);
    };
  }, [projectService]);

  useEffect(() => {
    function showMessageModal(title: string, message: string) {
      setShowMessageModal(true);
      setMessageModalTitle(title);
      setMessageModalContent(message);
    }
    if (!model) {
      showMessageModal("Error", "Model not found");
      return;
    }
    if (!projectService.currentLanguage) {
      showMessageModal(
        "Error",
        "Language definition not found for model type: " + model.type,
      );
      return;
    }

    setNodes([
      ...model.elements.map((element) =>
        convertElementToNode(projectService.currentLanguage.Elements, element),
      ),

      ...model.reifications.map((reification) =>
        convertReificationToNode(
          projectService.currentLanguage.Reifications,
          reification,
        ),
      ),
    ]);
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
  }, [model, projectService.currentLanguage]);

  function callExternalFunction(index: number): void {
    const efunction = projectService.externalFunctions[index];

    const selectedElementsIds = nodes
      .filter((node) => node.selected && node.type === "element")
      .map((node) => node.id);

    const selectedRelationshipsIds = edges
      .filter((edge) => edge.selected)
      .map((edge) => edge.id);

    projectService.callExternalFuntion(
      efunction,
      null,
      selectedElementsIds,
      selectedRelationshipsIds,
    );
  }

  const openPropertiesModal = useCallback(
    (menu: {
      x: number;
      y: number;
      type: "pane" | "node" | "edge";
      id?: string;
    }) => {
      if (!menu.id) {
        return;
      }

      let object: any = null;
      let objectType: "element" | "reification" | "relationship" | null = null;

      if (menu.type === "node") {
        const element = projectService.findModelElementById(
          projectService.currentModel,
          menu.id,
        );

        if (element) {
          object = element;
          objectType = "element";
        } else {
          const reification = projectService.findModelReificationById(
            projectService.currentModel,
            menu.id,
          );

          if (reification) {
            object = reification;
            objectType = "reification";
          }
        }
      }

      if (menu.type === "edge") {
        const relationship = projectService.currentModel.relationships.find(
          (relationship) => relationship.id === menu.id,
        );

        if (relationship) {
          object = relationship;
          objectType = "relationship";
        }
      }

      if (!object || !objectType) {
        return;
      }

      setSelectedObject(structuredClone(object));
      setBackupObject(structuredClone(object));
      setSelectedObjectType(objectType);
      setShowPropertiesModal(true);
    },
    [projectService],
  );

  const savePropertiesModal = useCallback(() => {
    if (!selectedObject || !selectedObjectType || !backupObject) {
      return;
    }
    selectedObject.name = editingName;

    let target: any = null;

    switch (selectedObjectType) {
      case "element":
        target = projectService.findModelElementById(
          projectService.currentModel,
          selectedObject.id,
        );
        break;

      case "reification":
        target = projectService.findModelReificationById(
          projectService.currentModel,
          selectedObject.id,
        );
        break;

      case "relationship":
        target =
          projectService.currentModel.relationships.find(
            (relationship) => relationship.id === selectedObject.id,
          ) ?? null;
        break;
    }

    if (!target) {
      return;
    }

    const oldValue = structuredClone(target);
    const newValue = structuredClone(selectedObject);

    const changedFields = Object.keys(newValue).filter(
      (key) => JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key]),
    );

    if (changedFields.length > 0) {
      Object.assign(target, newValue);

      if (selectedObjectType !== "reification") {
        const entityType =
          selectedObjectType === "relationship"
            ? HistoryEntityType.RELATIONSHIP
            : selectedObjectType === "element"
            ? HistoryEntityType.ELEMENT
            : null;

        registerHistoryEvent({
          modelId: projectService.currentModel?.id,
          actionType: HistoryActionType.ITEM_UPDATED,
          entityType,
          entityId: newValue.id,
          entityName: newValue.name,
          oldValue,
          newValue,
          description: `Updated ${selectedObjectType} "${
            newValue.name
          }": ${changedFields.join(", ")}`,
        });
      }

      syncModelChanges();
    }

    setShowPropertiesModal(false);
    setSelectedObject(null);
    setBackupObject(null);
    setSelectedObjectType(null);
  }, [
    selectedObject,
    backupObject,
    selectedObjectType,
    projectService,
    registerHistoryEvent,
    syncModelChanges,
    editingName,
  ]);
  const cancelPropertiesModal = useCallback(() => {
    setShowPropertiesModal(false);
    setSelectedObject(null);
    setBackupObject(null);
    setSelectedObjectType(null);
  }, []);

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

            const modelReification = projectService.findModelReificationById(
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

            const modelReification = projectService.findModelReificationById(
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
            const element = projectService.findModelElementById(
              projectService.currentModel,
              node.id,
            );

            if (element) {
              const relatedRelationships =
                projectService.currentModel.relationships.filter(
                  (relationship) =>
                    relationship.sourceId === element.id ||
                    relationship.targetId === element.id,
                );

              registerHistoryEvent({
                modelId: projectService.currentModel?.id,
                actionType: HistoryActionType.ITEM_DELETED,
                entityType: HistoryEntityType.ELEMENT,
                entityId: element.id,
                entityName: element.name,
                oldValue: {
                  ...structuredClone(element),
                  relatedRelationships: structuredClone(relatedRelationships),
                },
                newValue: null,
                description: `Deleted element "${element.name}"`,
              });

              projectService.removeModelElementById(
                projectService.currentModel,
                node.id,
              );

              modelChanged = true;
            }
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
    [
      nodes,
      projectService,
      model?.id,
      syncModelChanges,
      updateAction,
      registerHistoryEvent,
    ],
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
            const relationship = projectService.currentModel.relationships.find(
              (relationship) => relationship.id === edge.id,
            );

            if (relationship) {
              registerHistoryEvent({
                modelId: projectService.currentModel?.id,
                actionType: HistoryActionType.ITEM_DELETED,
                entityType: HistoryEntityType.RELATIONSHIP,
                entityId: relationship.id,
                entityName: relationship.name,
                oldValue: structuredClone(relationship),
                newValue: null,
                description: `Deleted relationship "${relationship.name}"`,
              });

              projectService.removeModelRelationshipById(
                projectService.currentModel,
                edge.id,
              );

              modelChanged = true;
            }

            return;
          }

          if (edge.type === "reificationEndpoint") {
            const reification = projectService.findModelReificationById(
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
    [projectService, syncModelChanges, registerHistoryEvent],
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

  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();

      openPropertiesModal({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        id: node.id,
      });
    },
    [openPropertiesModal],
  );

  const handleEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      openPropertiesModal({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        id: edge.id,
      });
    },
    [openPropertiesModal],
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
        const newRelation = Relationship.fromRelationType(
          currentRelationType,
          params.source,
          params.target,
        );

        projectService.currentModel.relationships.push(newRelation);

        registerHistoryEvent({
          modelId: projectService.currentModel?.id,
          actionType: HistoryActionType.ITEM_CREATED,
          entityType: HistoryEntityType.RELATIONSHIP,
          entityId: newRelation.id,
          entityName: newRelation.name,
          oldValue: null,
          newValue: structuredClone(newRelation),
          description: `Created relationship "${newRelation.name}"`,
        });

        const newEdge = convertRelationToEdge(
          projectService.currentLanguage.Relationships,
          newRelation,
        );

        setEdges((edgesSnapshot) => [newEdge, ...edgesSnapshot]);

        setCurrentRelationType(null);
        setCurrentEndpointType(null);
        openPropertiesModal({
          x: 0,
          y: 0,
          type: "edge",
          id: newEdge.id,
        });

        syncModelChanges();

        return;
      }

      if (currentEndpointType) {
        const reification = projectService.currentModel.reifications.find(
          (reification) => reification.id === params.source,
        );

        if (!reification) {
          return;
        }

        let endpoint = reification.endpoints.find(
          (endpoint) => endpoint.id === params.sourceHandle,
        );

        if (!endpoint) {
          endpoint = new Endpoint(currentEndpointType.uuid, []);

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
          setEdges((edgesSnapshot) => [newEdge, ...edgesSnapshot]);
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
      registerHistoryEvent,
      openPropertiesModal,
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
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
        >
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              nodes={nodes}
              edges={edges}
              externalFunctions={projectService.externalFunctions}
              onDelete={() => {
                if (!contextMenu.id) {
                  return;
                }
                if (contextMenu.type === "node") {
                  onNodesChange([
                    {
                      type: "remove",
                      id: contextMenu.id,
                    },
                  ]);
                }
                if (contextMenu.type === "edge") {
                  onEdgesChange([
                    {
                      type: "remove",
                      id: contextMenu.id,
                    },
                  ]);
                }
                setContextMenu(null);
              }}
              onProperties={() => {
                openPropertiesModal(contextMenu);
                setContextMenu(null);
              }}
              onAddComment={() => {
                createAnnotationFromContext(contextMenu.x, contextMenu.y);

                setContextMenu(null);
              }}
              onExternalFunction={(index) => {
                callExternalFunction(index);
                setContextMenu(null);
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

          registerHistoryEvent({
            modelId: projectService.currentModel?.id,
            actionType: HistoryActionType.ITEM_CREATED,
            entityType: HistoryEntityType.ELEMENT,
            entityId: element.id,
            entityName: element.name,
            oldValue: null,
            newValue: structuredClone(element),
            description: `Created element "${element.name}"`,
          });

          setNodes((nodesSnapshot) => [...nodesSnapshot, node]);
          openPropertiesModal({
            x: 0,
            y: 0,
            type: "node",
            id: element.id,
          });
          syncModelChanges();
        }}
        addReification={(reification: Reification) => {
          const node = convertReificationToNode(
            projectService.currentLanguage.Reifications,
            reification,
          );

          projectService.currentModel.reifications.push(reification);
          setNodes((nodesSnapshot) => [...nodesSnapshot, node]);
          openPropertiesModal({
            x: 0,
            y: 0,
            type: "node",
            id: reification.id,
          });
        }}
      />
      <div>
        <Modal
          show={showPropertiesModal}
          onHide={cancelPropertiesModal}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div style={{ maxHeight: "65vh", overflow: "auto" }}>
              <PropertiesModal
                item={selectedObject}
                name={editingName}
                setName={setEditing}
                onPropertiesChange={(properties) => {
                  setSelectedObject((currentObject) =>
                    currentObject
                      ? {
                          ...currentObject,
                          properties,
                        }
                      : null,
                  );
                }}
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={savePropertiesModal}>
              Save
            </Button>

            <Button variant="secondary" onClick={cancelPropertiesModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <div>
        <Modal
          show={showMessageModal}
          onHide={() => setShowMessageModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{messageModalTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ maxHeight: "65vh", overflow: "auto" }}>
              <p>{messageModalContent}</p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setShowMessageModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

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
