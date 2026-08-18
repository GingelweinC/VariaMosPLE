import { useCallback } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import {
  HistoryActionType,
  HistoryEntityType,
} from "../../Domain/ProductLineEngineering/Enums/historyEnum";

interface UseHistoryProps {
  projectService: ProjectService;
  setModel: (model: any) => void;
  syncModelChanges: () => void;
  setHistoryRecords: (records: any[]) => void;
  setShowHistoryPanel: (show: boolean) => void;
}

export function useHistory({
  projectService,
  setModel,
  syncModelChanges,
  setHistoryRecords,
  setShowHistoryPanel,
}: UseHistoryProps) {
  const revertHistoryItem = useCallback(
    (item: any) => {
      if (!projectService.currentModel) {
        return;
      }

      if (item.actionType === HistoryActionType.ITEM_CREATED) {
        if (item.entityType === HistoryEntityType.ELEMENT) {
          projectService.removeModelElementById(
            projectService.currentModel,
            item.entityId
          );
        }

        if (item.entityType === HistoryEntityType.RELATIONSHIP) {
          projectService.removeModelRelationshipById(
            projectService.currentModel,
            item.entityId
          );
        }

        setModel(projectService.currentModel);
        syncModelChanges();
        return;
      }

      if (item.actionType === HistoryActionType.ITEM_DELETED && item.oldValue) {
        if (item.entityType === HistoryEntityType.ELEMENT) {
          const exists = projectService.findModelElementById(
            projectService.currentModel,
            item.entityId
          );

          if (!exists) {
            const { relatedRelationships, ...elementData } = item.oldValue;

            projectService.currentModel.elements.push(
              JSON.parse(JSON.stringify(elementData))
            );

            if (Array.isArray(relatedRelationships)) {
              relatedRelationships.forEach((rel: any) => {
                const relExists =
                  projectService.findModelRelationshipById(
                    projectService.currentModel,
                    rel.id
                  );

                if (!relExists) {
                  projectService.currentModel.relationships.push(
                    JSON.parse(JSON.stringify(rel))
                  );
                }
              });
            }
          }
        }

        if (item.entityType === HistoryEntityType.RELATIONSHIP) {
          const exists = projectService.findModelRelationshipById(
            projectService.currentModel,
            item.entityId
          );

          if (!exists) {
            projectService.currentModel.relationships.push(
              JSON.parse(JSON.stringify(item.oldValue))
            );
          }
        }

        setModel(projectService.currentModel);
        syncModelChanges();
        return;
      }

      if (
        item.actionType === HistoryActionType.ITEM_UPDATED &&
        item.oldValue
      ) {
        if (item.entityType === HistoryEntityType.ELEMENT) {
          const element = projectService.findModelElementById(
            projectService.currentModel,
            item.entityId
          );

          if (element) {
            Object.assign(element, item.oldValue);
            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              element
            );
          }
        }

        if (item.entityType === HistoryEntityType.RELATIONSHIP) {
          const relationship = projectService.findModelRelationshipById(
            projectService.currentModel,
            item.entityId
          );

          if (relationship) {
            Object.assign(relationship, item.oldValue);
            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              relationship
            );
          }
        }

        setModel(projectService.currentModel);
        syncModelChanges();
      }
    },
    [projectService, setModel, syncModelChanges]
  );

  const loadProjectHistory = useCallback(async () => {
    const projectInfo = projectService.getProjectInformation();
    const projectId = projectInfo?.id;

    if (!projectId) {
      console.warn("No project id found for history");
      return;
    }

    const response = await projectService.getProjectHistory(projectId);

    setHistoryRecords(response.data || []);
  }, [projectService, setHistoryRecords]);

  const openHistoryPanel = useCallback(async () => {
    await loadProjectHistory();
    setShowHistoryPanel(true);
  }, [loadProjectHistory, setShowHistoryPanel]);

  const closeHistoryPanel = useCallback(() => {
    setHistoryRecords([]);
    setShowHistoryPanel(false);
  }, [setHistoryRecords, setShowHistoryPanel]);

  return {
    revertHistoryItem,
    loadProjectHistory,
    openHistoryPanel,
    closeHistoryPanel,
  };
}