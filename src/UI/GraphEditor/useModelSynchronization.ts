import { useCallback, useEffect, useRef } from "react";
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

type ModelSnapshot = {
  elements: any[];
  relationships: any[];
};

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
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  const isRemoteChangeRef = useRef(false);
  const isHydratedRef = useRef(false);

  const incrementalUpdaters = useRef(
    new Map<string, IncrementalGraphUpdater>(),
  );

  const modelSnapshots = useRef(new Map<string, ModelSnapshot>());

  const currentModelObserver = useRef<(() => void) | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const getModelKey = useCallback((currentModel: Model) => {
    return `${currentModel.type}_${currentModel.id}`;
  }, []);

  const cloneSnapshot = useCallback((currentModel: Model): ModelSnapshot => {
    return {
      elements: structuredClone(currentModel.elements ?? []),
      relationships: structuredClone(currentModel.relationships ?? []),
    };
  }, []);

  const cleanupUnusedModelResources = useCallback(
    (currentModel: Model) => {
      const currentModelKey = getModelKey(currentModel);

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
    },
    [getModelKey],
  );

  const syncModelChanges = useCallback(() => {
    const currentModel = projectService.currentModel;
    const projectId = projectService.getProject()?.id;

    if (
      !isCollaborative ||
      !projectId ||
      !currentModel ||
      isRemoteChangeRef.current ||
      !isHydratedRef.current
    ) {
      return;
    }

    projectService.updateModelState(
      projectId,
      currentModel.id,
      (state) => {
        state.set("data", {
          elements: structuredClone(currentModel.elements ?? []),
          relationships: structuredClone(
            currentModel.relationships ?? [],
          ),
          timestamp: Date.now(),
        });
      },
    );

    modelSnapshots.current.set(
      getModelKey(currentModel),
      cloneSnapshot(currentModel),
    );
  }, [
    projectService,
    isCollaborative,
    getModelKey,
    cloneSnapshot,
  ]);

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

    cleanupUnusedModelResources(currentModel);

    const modelKey = getModelKey(currentModel);

    isHydratedRef.current = false;
    isRemoteChangeRef.current = false;

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
                  nodesToDelete.map((node) => node.id),
                );

                setNodes((currentNodes) =>
                  currentNodes.filter(
                    (node) => !nodeIds.has(node.id),
                  ),
                );
              }

              if (edgesToDelete?.length) {
                const edgeIds = new Set(
                  edgesToDelete.map((edge) => edge.id),
                );

                setEdges((currentEdges) =>
                  currentEdges.filter(
                    (edge) => !edgeIds.has(edge.id),
                  ),
                );
              }
            },

            getNode: (id: string) =>
              nodesRef.current.find((node) => node.id === id) ?? null,

            getEdge: (id: string) =>
              edgesRef.current.find((edge) => edge.id === id) ?? null,
          } as any,
          projectService,
        ),
      );
    }

    const updater = incrementalUpdaters.current.get(modelKey);

    const hydrateFromSharedState = (modelData: any) => {
      const sharedElements = structuredClone(
        modelData?.elements ?? [],
      );
      const sharedRelationships = structuredClone(
        modelData?.relationships ?? [],
      );

      const localSnapshot = modelSnapshots.current.get(modelKey) ??
        cloneSnapshot(currentModel);

      const snapshotAsModel = {
        ...currentModel,
        elements: localSnapshot.elements,
        relationships: localSnapshot.relationships,
      };

      const diff = calculateModelDiff(
        snapshotAsModel,
        {
          ...currentModel,
          elements: sharedElements,
          relationships: sharedRelationships,
        },
      );

      currentModel.elements = sharedElements;
      currentModel.relationships = sharedRelationships;

      setModel({
        ...currentModel,
        elements: sharedElements,
        relationships: sharedRelationships,
      });

      if (updater && hasMeaningfulChanges(diff)) {
        updater.applyIncrementalChanges(
          currentModel,
          diff,
        );
      }

      modelSnapshots.current.set(modelKey, {
        elements: structuredClone(sharedElements),
        relationships: structuredClone(sharedRelationships),
      });

      isHydratedRef.current = true;
    };

    const observer = projectService.observeModelState(
      projectId,
      currentModel.id,
      (state) => {
        if (
          !state ||
          !projectService.currentModel ||
          projectService.currentModel.id !== currentModel.id
        ) {
          return;
        }

        const modelData = state.get("data");

        if (!modelData) {
          return;
        }

        if (!isHydratedRef.current) {
          isRemoteChangeRef.current = true;

          try {
            hydrateFromSharedState(modelData);
          } finally {
            isRemoteChangeRef.current = false;
          }

          return;
        }

        isRemoteChangeRef.current = true;

        try {
          const currentModel = projectService.currentModel;

          if (!currentModel) {
            return;
          }

          const currentModelKey = getModelKey(currentModel);
          const snapshot =
            modelSnapshots.current.get(currentModelKey);

          if (!snapshot) {
            modelSnapshots.current.set(
              currentModelKey,
              cloneSnapshot(currentModel),
            );
            return;
          }

          const snapshotAsModel = {
            ...currentModel,
            elements: snapshot.elements,
            relationships: snapshot.relationships,
          };

          const diff = calculateModelDiff(
            snapshotAsModel,
            modelData,
          );

          if (!hasMeaningfulChanges(diff)) {
            return;
          }

          currentModel.elements =
            structuredClone(
              modelData.elements ??
                currentModel.elements ??
                [],
            );

          currentModel.relationships =
            structuredClone(
              modelData.relationships ??
                currentModel.relationships ??
                [],
            );

          setModel({
            ...currentModel,
            elements: currentModel.elements,
            relationships: currentModel.relationships,
          });

          const currentUpdater =
            incrementalUpdaters.current.get(
              currentModelKey,
            );

          if (currentUpdater) {
            currentUpdater.applyIncrementalChanges(
              currentModel,
              diff,
            );
          }

          modelSnapshots.current.set(
            currentModelKey,
            cloneSnapshot(currentModel),
          );
        } finally {
          isRemoteChangeRef.current = false;
        }
      },
    );

    currentModelObserver.current = observer;

    const localSnapshot = cloneSnapshot(currentModel);

    modelSnapshots.current.set(modelKey, localSnapshot);

    /*
     * Important:
     * updateModelState is used here only to access the current shared state.
     * If shared data already exists, it wins over the local model.
     * If no shared data exists, the local model is published once.
     */
    projectService.updateModelState(
      projectId,
      currentModel.id,
      (state) => {
        const sharedData = state.get("data");

        if (sharedData) {
          hydrateFromSharedState(sharedData);
          return;
        }

        state.set("data", {
          elements: structuredClone(
            currentModel.elements ?? [],
          ),
          relationships: structuredClone(
            currentModel.relationships ?? [],
          ),
          timestamp: Date.now(),
        });

        modelSnapshots.current.set(
          modelKey,
          cloneSnapshot(currentModel),
        );

        isHydratedRef.current = true;
      },
    );

    return () => {
      currentModelObserver.current?.();
      currentModelObserver.current = null;

      isHydratedRef.current = false;
      isRemoteChangeRef.current = false;
    };
  }, [
    projectService,
    model.id,
    setModel,
    setNodes,
    setEdges,
    cleanupUnusedModelResources,
    getModelKey,
    cloneSnapshot,
  ]);

  return {
    syncModelChanges,
    incrementalUpdaters,
    modelSnapshots,
  };
}