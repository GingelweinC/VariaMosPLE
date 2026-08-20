import {
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";

import ProjectService from "../../Application/Project/ProjectService";

import {
  HistoryActionType,
  HistoryEntityType,
} from "../../Domain/ProductLineEngineering/Enums/historyEnum";

import historyCollaborationService from "../../DataProvider/Services/collab/historyCollaborationService";

import { ProjectHistory } from "../../Domain/ProductLineEngineering/Entities/ProjectHistory";

interface UseHistoryProps {
  projectService: ProjectService;
  setModel: (model: any) => void;
  syncModelChanges: () => void;
  setHistoryRecords: Dispatch<SetStateAction<ProjectHistory[]>>;
  setShowHistoryPanel: (show: boolean) => void;
}

export function useHistory({
  projectService,
  setModel,
  syncModelChanges,
  setHistoryRecords,
  setShowHistoryPanel,
}: UseHistoryProps) {

  const initializeHistorySync = useCallback(async () => {
    const projectInfo =
      projectService.getProjectInformation();

    const projectId =
      projectInfo?.id ||
      projectInfo?.project?.id ||
      projectService.getProject()?.id;

    if (!projectId) {
      console.warn(
        "[History] No project id found for history sync"
      );

      return false;
    }

    try {
      return await historyCollaborationService
        .initializeHistorySync(projectId);
    } catch (error) {
      console.error(
        "[History] Failed to initialize history sync",
        error
      );

      return false;
    }
  }, [projectService]);

  const subscribeToHistoryChanges = useCallback(() => {
    return historyCollaborationService.observeHistoryChanges(
      (records) => {
        setHistoryRecords((prevRecords) => {
          const merged = [
            ...records,
            ...prevRecords,
          ];


          const unique = Array.from(
            new Map(
              merged.map((item) => [
                item.id,
                item,
              ])
            ).values()
          );

          unique.sort((a, b) => {
            const dateA = new Date(
              a.createdAt ||
                a.timestamp ||
                0
            ).getTime();

            const dateB = new Date(
              b.createdAt ||
                b.timestamp ||
                0
            ).getTime();

            return dateB - dateA;
          });

          return unique;
        });
      }
    );
  }, [setHistoryRecords]);


  const revertHistoryItem = useCallback(
    (item: any) => {
      if (!projectService.currentModel) {
        return;
      }

      if (
        item.actionType ===
        HistoryActionType.ITEM_CREATED
      ) {
        if (
          item.entityType ===
          HistoryEntityType.ELEMENT
        ) {
          projectService.removeModelElementById(
            projectService.currentModel,
            item.entityId
          );
        }

        if (
          item.entityType ===
          HistoryEntityType.RELATIONSHIP
        ) {
          projectService.removeModelRelationshipById(
            projectService.currentModel,
            item.entityId
          );
        }

        setModel(
          projectService.currentModel
        );

        syncModelChanges();

        return;
      }

      if (
        item.actionType ===
          HistoryActionType.ITEM_DELETED &&
        item.oldValue
      ) {
        if (
          item.entityType ===
          HistoryEntityType.ELEMENT
        ) {
          const exists =
            projectService.findModelElementById(
              projectService.currentModel,
              item.entityId
            );

          if (!exists) {
            const {
              relatedRelationships,
              ...elementData
            } = item.oldValue;

            projectService.currentModel.elements.push(
              JSON.parse(
                JSON.stringify(elementData)
              )
            );

            if (
              Array.isArray(
                relatedRelationships
              )
            ) {
              relatedRelationships.forEach(
                (rel: any) => {
                  const relExists =
                    projectService.findModelRelationshipById(
                      projectService.currentModel,
                      rel.id
                    );

                  if (!relExists) {
                    projectService.currentModel.relationships.push(
                      JSON.parse(
                        JSON.stringify(rel)
                      )
                    );
                  }
                }
              );
            }
          }
        }

        if (
          item.entityType ===
          HistoryEntityType.RELATIONSHIP
        ) {
          const exists =
            projectService.findModelRelationshipById(
              projectService.currentModel,
              item.entityId
            );

          if (!exists) {
            projectService.currentModel.relationships.push(
              JSON.parse(
                JSON.stringify(item.oldValue)
              )
            );
          }
        }

        setModel(
          projectService.currentModel
        );

        syncModelChanges();

        return;
      }

      if (
        item.actionType ===
          HistoryActionType.ITEM_UPDATED &&
        item.oldValue
      ) {
        if (
          item.entityType ===
          HistoryEntityType.ELEMENT
        ) {
          const element =
            projectService.findModelElementById(
              projectService.currentModel,
              item.entityId
            );

          if (element) {
            Object.assign(
              element,
              item.oldValue
            );

            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              element
            );
          }
        }

        if (
          item.entityType ===
          HistoryEntityType.RELATIONSHIP
        ) {
          const relationship =
            projectService.findModelRelationshipById(
              projectService.currentModel,
              item.entityId
            );

          if (relationship) {
            Object.assign(
              relationship,
              item.oldValue
            );

            projectService.raiseEventUpdatedElement(
              projectService.currentModel,
              relationship
            );
          }
        }

        setModel(
          projectService.currentModel
        );

        syncModelChanges();
      }
    },
    [
      projectService,
      setModel,
      syncModelChanges,
    ]
  );


  const registerHistoryEvent = useCallback(
  async (event: any) => {
    const projectInfo =
      projectService.getProjectInformation();

    const projectId =
      projectInfo?.id ||
      projectInfo?.project?.id ||
      projectService.getProject()?.id;

    if (!projectId) {
      console.warn(
        "[History] Cannot register event: no project id",
      );
      return;
    }

    const historyEvent = new ProjectHistory(
      undefined,
      projectId,
      event.modelId,
      undefined,
      event.actionType,
      event.entityType,
      event.entityId,
      event.entityName,
      event.oldValue,
      event.newValue,
      event.description,
      new Date(),
    );

    try {
      console.log(
        "[History] Registering event:",
        historyEvent,
      );

      const res =
        await projectService.createHistoryEvent(
          historyEvent,
        );

      console.log(
        "[History] create response:",
        res.data,
      );

      historyCollaborationService.publishHistoryEvent({
        ...historyEvent,
        id: res.data?.id,
        createdAt: res.data?.createdAt,
        author: res.data?.author,
      });

      return res.data;
    } catch (error) {
      console.error(
        "[History] create history error",
        error,
      );
    }
  },
  [projectService],
);

  const loadProjectHistory = useCallback(
    async () => {
      const projectInfo =
        projectService.getProjectInformation();

      const projectId =
        projectInfo?.id ||
        projectInfo?.project?.id ||
        projectService.getProject()?.id;

      if (!projectId) {
        console.warn(
          "[History] No project id found for history"
        );

        return;
      }

      try {
        const response =
          await projectService.getProjectHistory(
            projectId
          );

        setHistoryRecords(
          response.data || []
        );
      } catch (error) {
        console.error(
          "[History] Failed to load project history",
          error
        );
      }
    },
    [
      projectService,
      setHistoryRecords,
    ]
  );

  const openHistoryPanel = useCallback(
    async () => {
      await loadProjectHistory();

      setShowHistoryPanel(true);
    },
    [
      loadProjectHistory,
      setShowHistoryPanel,
    ]
  );


  /**
   * Ferme le panneau et vide l'historique local.
   */
  const closeHistoryPanel = useCallback(
    () => {
      setHistoryRecords([]);

      setShowHistoryPanel(false);
    },
    [
      setHistoryRecords,
      setShowHistoryPanel,
    ]
  );


  return {
    revertHistoryItem,
    loadProjectHistory,
    openHistoryPanel,
    closeHistoryPanel,
    registerHistoryEvent,
    initializeHistorySync,
    subscribeToHistoryChanges,
  };
}