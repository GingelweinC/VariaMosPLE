import { useCallback } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { ProjectAnnotation } from "../../Domain/ProductLineEngineering/Entities/ProjectAnnotation";
import {
  syncInitialAnnotations,
  publishAnnotation,
  removeAnnotation,
  observeAnnotations,
} from "../../DataProvider/Services/collab/annotationCollaborationService";
import { useReactFlow } from "@xyflow/react";
interface AnnotationRecord {
  id: string;
  [key: string]: any;
}

interface UseAnnotationHandlersProps {
  model: any;
  projectService: ProjectService;
  annotationRecords: AnnotationRecord[];
  setAnnotationRecords: React.Dispatch<React.SetStateAction<AnnotationRecord[]>>;
  setPendingAnnotation: React.Dispatch<React.SetStateAction<any>>;
  setAnnotationPanel: React.Dispatch<React.SetStateAction<boolean>>;
  annotationObserver: React.MutableRefObject<(() => void) | null>;
}

export function useAnnotationHandlers({
  model,
  projectService,
  annotationRecords,
  setAnnotationRecords,
  setPendingAnnotation,
  setAnnotationPanel,
  annotationObserver,
}: UseAnnotationHandlersProps) {
  const { screenToFlowPosition } = useReactFlow();
  const normalizeAnnotationRecord = useCallback((item: any) => {
    if (!item) {
      return null;
    }

    let annotation = item.annotation;

    if (typeof annotation === "string") {
      try {
        annotation = JSON.parse(annotation);
      } catch {
        annotation = {};
      }
    }

    return {
      ...item,
      id: item.id,
      projectId: item.projectId || item.project_id,
      modelId: item.modelId || item.model_id,
      userId: item.userId || item.user_id,
      userName: item.userName || item.user_name,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
      annotation,
    };
  }, []);

  const mergeAnnotations = useCallback(
    (records: any[]) => {
      return Array.from(
        new Map(
          records
            .map(normalizeAnnotationRecord)
            .filter(
              (item) => item?.id && item?.annotation?.position
            )
            .map((item) => [item.id, item])
        ).values()
      );
    },
    [normalizeAnnotationRecord]
  );

  const loadAnnotations = useCallback(async () => {
    if (!model) {
      return;
    }

    const projectId = projectService.getProject()?.id;
    const modelId = model.id;

    setAnnotationRecords([]);
    setPendingAnnotation(null);

    annotationObserver.current?.();
    annotationObserver.current = null;

    if (!projectId || !modelId) {
      return;
    }

    annotationObserver.current = observeAnnotations(
      projectId,
      modelId,
      (annotations) => {
        if (model?.id !== modelId) {
          return;
        }

        setAnnotationRecords(mergeAnnotations(annotations));
      }
    );

    const response = await projectService.getProjectAnnotations(modelId);
    const records = response.data || [];

    if (model?.id !== modelId) {
      return;
    }

    syncInitialAnnotations(
      projectId,
      modelId,
      mergeAnnotations(records)
    );
  }, [
    model,
    projectService,
    mergeAnnotations,
    setAnnotationRecords,
    setPendingAnnotation,
    annotationObserver,
  ]);

  const saveAnnotation = useCallback(
    async (annotation: ProjectAnnotation) => {
      const response =
        await projectService.createProjectAnnotation(annotation);

      const savedAnnotation = {
        ...annotation,
        id: response.data?.data?.id || response.data?.id,
        userName:
          response.data?.data?.userName ||
          response.data?.userName,
        createdAt:
          response.data?.data?.createdAt ||
          new Date().toISOString(),
      };

      setAnnotationRecords((prev) =>
        mergeAnnotations([...prev, savedAnnotation])
      );
      setPendingAnnotation(null);

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId && savedAnnotation.id) {
        publishAnnotation(
          projectId,
          modelId,
          savedAnnotation
        );
      }
    },
    [
      projectService,
      model,
      mergeAnnotations,
      setAnnotationRecords,
      setPendingAnnotation,
    ]
  );

  const updateAnnotation = useCallback(
    async (annotationId: string, annotation: any) => {
      await projectService.updateProjectAnnotation(
        annotationId,
        annotation
      );

      setAnnotationRecords((prev) =>
        mergeAnnotations(
          prev.map((item) =>
            item.id === annotationId
              ? annotation
              : item
          )
        )
      );

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId) {
        publishAnnotation(projectId, modelId, {
          ...annotation,
          id: annotationId,
        });
      }
    },
    [
      projectService,
      model,
      mergeAnnotations,
      setAnnotationRecords,
    ]
  );

  const deleteAnnotation = useCallback(
    async (annotationId: string) => {
      await projectService.deleteProjectAnnotation(annotationId);

      setAnnotationRecords((prev) =>
        prev.filter((item) => item.id !== annotationId)
      );

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId) {
        removeAnnotation(
          projectId,
          modelId,
          annotationId
        );
      }
    },
    [projectService, model, setAnnotationRecords]
  );

  const resolveAnnotation = useCallback(
    async (annotationId: string) => {
      await projectService.resolveProjectAnnotation(
        annotationId
      );

      const resolvedAnnotation = annotationRecords.find(
        (item) => item.id === annotationId
      );

      if (!resolvedAnnotation) {
        return;
      }

      const updated = {
        ...resolvedAnnotation,
        isResolved: true,
      };

      setAnnotationRecords((prev) =>
        prev.map((item) =>
          item.id === annotationId ? updated : item
        )
      );

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId) {
        publishAnnotation(projectId, modelId, updated);
      }
    },
    [
      projectService,
      annotationRecords,
      model,
      setAnnotationRecords,
    ]
  );

  const unresolveAnnotation = useCallback(
    async (annotationId: string) => {
      await projectService.unresolveProjectAnnotation(
        annotationId
      );

      const unresolvedAnnotation = annotationRecords.find(
        (item) => item.id === annotationId
      );

      if (!unresolvedAnnotation) {
        return;
      }

      const updated = {
        ...unresolvedAnnotation,
        isResolved: false,
        is_resolved: false,
      };

      setAnnotationRecords((prev) =>
        prev.map((item) =>
          item.id === annotationId ? updated : item
        )
      );

      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (projectId && modelId) {
        publishAnnotation(projectId, modelId, updated);
      }
    },
    [
      projectService,
      annotationRecords,
      model,
      setAnnotationRecords,
    ]
  );

  
    const createAnnotationFromContext = useCallback(
    (screenX: number, screenY: number) => {
      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (!projectId || !modelId) {
        return;
      }

      const position = screenToFlowPosition({
        x: screenX,
        y: screenY,
      });

      setPendingAnnotation({
        projectId,
        modelId,
        position,
      });
    },
    [
      projectService,
      model,
      screenToFlowPosition,
      setPendingAnnotation,
    ],
  );

  const closeAnnotationPanel = useCallback(() => {
    setAnnotationPanel(false);
  }, [setAnnotationPanel]);

  const openAnnotationPanel = useCallback(() => {
    setAnnotationPanel(true);
  }, [setAnnotationPanel]);

  return {
    normalizeAnnotationRecord,
    mergeAnnotations,
    loadAnnotations,
    saveAnnotation,
    updateAnnotation,
    deleteAnnotation,
    resolveAnnotation,
    unresolveAnnotation,
    createAnnotationFromContext,
    closeAnnotationPanel,
    openAnnotationPanel,
  };
}