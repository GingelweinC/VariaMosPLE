import { useCallback, useEffect, useRef, useState } from "react";
import { Edge, Node } from "@xyflow/react";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { IncrementalGraphUpdater } from "./IncrementalGraphUpdater";
import {
  calculateModelDiff,
  hasMeaningfulChanges,
} from "../../DataProvider/Services/incrementalSyncService";

interface UseModelSynchronizationProps {
  projectService: ProjectService;
  model: Model;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  isCollaborative: boolean;
  setModel: React.Dispatch<React.SetStateAction<Model>>;
}

export function useModelSynchronization({
  projectService,
  model,
  nodes,
  setNodes,
  edges,
  setEdges,
  isCollaborative,
  setModel,
}: UseModelSynchronizationProps) {
  const [isRemoteChange, setIsRemoteChange] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const isRemoteChangeRef = useRef(isRemoteChange);
  const isInitialLoadRef = useRef(isInitialLoad);

  const incrementalUpdaters = useRef(
    new Map<string, IncrementalGraphUpdater>()
  );
  const modelSnapshots = useRef(
    new Map<string, { elements: any[]; relationships: any[] }>()
  );
  const currentModelObserver = useRef<(() => void) | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    isRemoteChangeRef.current = isRemoteChange;
  }, [isRemoteChange]);

  useEffect(() => {
    isInitialLoadRef.current = isInitialLoad;
  }, [isInitialLoad]);

  const syncModelChanges = useCallback(() => {
    const currentModel = projectService.currentModel;
    const projectId = projectService.getProject()?.id;

    if (
      !isCollaborative ||
      !projectId ||
      !currentModel ||
      isRemoteChangeRef.current ||
      isInitialLoadRef.current
    ) {
      return;
    }

    projectService.updateModelState(
      projectId,
      currentModel.id,
      (state) => {
        state.set("data", {
          elements: currentModel.elements,
          relationships: currentModel.relationships,
          timestamp: Date.now(),
        });
      }
    );

    const modelKey = `${currentModel.type}_${currentModel.id}`;

    modelSnapshots.current.set(modelKey, {
      elements: JSON.parse(JSON.stringify(currentModel.elements)),
      relationships: JSON.parse(
        JSON.stringify(currentModel.relationships)
      ),
    });
  }, [projectService, isCollaborative]);

  useEffect(() => {
    const currentModel = projectService.currentModel;

    if (!currentModel) {
      return;
    }

    const projectId = projectService.getProject()?.id;

    if (!projectId) {
      return;
    }

    currentModelObserver.current?.();
    currentModelObserver.current = null;

    const cleanupUnusedModelResources = () => {
      const currentModelKey = `${currentModel.type}_${currentModel.id}`;

      for (const key of incrementalUpdaters.current.keys()) {
        if (key !== currentModelKey) {
          incrementalUpdaters.current.delete(key);
        }
      }

      for (const key of modelSnapshots.current.keys()) {
        if (key !== currentModelKey) {
          modelSnapshots.current.delete(key);
        }
      }
    };

    cleanupUnusedModelResources();

    const modelKey = `${currentModel.type}_${currentModel.id}`;

    if (!incrementalUpdaters.current.has(modelKey)) {
      incrementalUpdaters.current.set(
        modelKey,
        new IncrementalGraphUpdater(
          {
            getNodes: () => nodesRef.current,
            setNodes,
            getEdges: () => edgesRef.current,
            setEdges,

            deleteElements: async ({
              nodes: nodesToDelete,
              edges: edgesToDelete,
            }) => {
              if (nodesToDelete?.length) {
                const nodeIds = new Set(
                  nodesToDelete.map((node) => node.id)
                );

                setNodes((currentNodes) =>
                  currentNodes.filter(
                    (node) => !nodeIds.has(node.id)
                  )
                );
              }

              if (edgesToDelete?.length) {
                const edgeIds = new Set(
                  edgesToDelete.map((edge) => edge.id)
                );

                setEdges((currentEdges) =>
                  currentEdges.filter(
                    (edge) => !edgeIds.has(edge.id)
                  )
                );
              }
            },

            getNode: (id: string) =>
              nodesRef.current.find((node) => node.id === id) || null,

            getEdge: (id: string) =>
              edgesRef.current.find((edge) => edge.id === id) || null,
          } as any,
          projectService
        )
      );
    }

    setModel(currentModel);
    if (projectService.currentModel) {
        setIsInitialLoad(true);

    currentModelObserver.current =
      projectService.observeModelState(
        projectId,
        currentModel.id,
        (state) => {
          if (
            !state ||
            !projectService.currentModel ||
            projectService.currentModel.id !== currentModel.id ||
            isInitialLoadRef.current
          ) {
            return;
          }

          setIsRemoteChange(true);
          isRemoteChangeRef.current = true;

          try {
            const modelData = state.get("data");

            if (!modelData || !projectService.currentModel) {
              return;
            }

            const currentModel =
              projectService.currentModel;

            const currentModelKey =
              `${currentModel.type}_${currentModel.id}`;

            if (!modelSnapshots.current.has(currentModelKey)) {
              modelSnapshots.current.set(currentModelKey, {
                elements: JSON.parse(
                  JSON.stringify(currentModel.elements || [])
                ),
                relationships: JSON.parse(
                  JSON.stringify(currentModel.relationships || [])
                ),
              });
            }

            const snapshot =
              modelSnapshots.current.get(currentModelKey);

            if (!snapshot) {
              return;
            }

            const snapshotAsModel = {
              ...currentModel,
              elements: snapshot.elements,
              relationships: snapshot.relationships,
            };

            const diff = calculateModelDiff(
              snapshotAsModel,
              modelData
            );

            if (!hasMeaningfulChanges(diff)) {
              return;
            }

            currentModel.elements =
              modelData.elements || currentModel.elements;

            currentModel.relationships =
              modelData.relationships || currentModel.relationships;

            const updater =
              incrementalUpdaters.current.get(
                currentModelKey
              );

            if (updater) {
              updater.applyIncrementalChanges(
                currentModel,
                diff
              );
            }

            modelSnapshots.current.set(currentModelKey, {
              elements: JSON.parse(
                JSON.stringify(currentModel.elements)
              ),
              relationships: JSON.parse(
                JSON.stringify(currentModel.relationships)
              ),
            });
          } finally {
            setIsRemoteChange(false);
            isRemoteChangeRef.current = false;
          }
        }
      );

      setIsInitialLoad(false);
    }

    return () => {
      currentModelObserver.current?.();
      currentModelObserver.current = null;
    };
  }, [
    projectService,
    model.id,
    setModel,
    setNodes,
    setEdges,
    setIsRemoteChange,
  ]);

  return {
    syncModelChanges,
    incrementalUpdaters,
    modelSnapshots,
  };
}