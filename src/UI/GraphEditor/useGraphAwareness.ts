import { useCallback, useEffect, useRef, useState } from "react";
import {
  destroyModelAwareness,
  onModelAwarenessChange,
  setupModelAwareness,
  updateUserAction,
  updateUserCursor,
} from "../../DataProvider/Services/collab/collaborationAwarenessService";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { UserAction } from "./CollaborativeIndicators";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UseGraphAwarenessProps {
  projectService: ProjectService;
  model: Model | null;
  collaborators: Collaborator[];
  isCollaborative: boolean;
}

export function useGraphAwareness({
  projectService,
  model,
  collaborators,
  isCollaborative,
}: UseGraphAwarenessProps) {
  const [awarenessStates, setAwarenessStates] = useState<any[]>([]);
  const [collaborativeUsers, setCollaborativeUsers] = useState<any[]>([]);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const initializedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCollaborative || !model?.id) {
      setAwarenessStates([]);
      setCollaborativeUsers([]);
      return;
    }

    const projectId = projectService.getProject()?.id;
    const modelId = model.id;

    if (!projectId || !modelId) {
      return;
    }

    const key = `${projectId}:${modelId}`;

    if (initializedKeyRef.current === key) {
      return;
    }

    initializedKeyRef.current = key;

    const provider = projectService.getProjectProvider(projectId);
    const currentUserId = projectService.getUser();
    
    const user = collaborators.find(
      collaborator => collaborator.id === currentUserId
    );

    if (!provider || !user) {
      return;
    }

    setupModelAwareness(projectId, modelId, provider, {
      name: user.name,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    });

    const unsubscribe = onModelAwarenessChange(
      projectId,
      modelId,
      state => {
        const states = Array.from(state.values());

        console.log("AWARNESS CHANGE", states);

        const collaborativeUsers = states
          .filter((userState: any) => {
            if (!userState.user) {
              return false;
            }

            const collaborator = collaborators.find(
              c => c.name === userState.user.name
            );

            return collaborator && collaborator.id !== currentUserId;
          })
          .map((userState: any) => ({
            name: userState.user.name,
            color: userState.user.color,
            cursor: userState.user.cursor,
            action: userState.user.action,
            modelId: userState.user.modelId,
          }));

        console.log("awarenessStates", states);
        console.log("collaborativeUsers", collaborativeUsers);

        setAwarenessStates(states);
        setCollaborativeUsers(collaborativeUsers);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;

      destroyModelAwareness(projectId, modelId);

      initializedKeyRef.current = null;
    };
  }, [
    projectService,
    model?.id,
    collaborators,
    isCollaborative,
  ]);

  const updateAction = useCallback(
    (action: UserAction) => {
      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (!isCollaborative || !projectId || !modelId) {
        return;
      }

      updateUserAction(projectId, modelId, action);
    },
    [projectService, model?.id, isCollaborative]
  );

  const updateCursor = useCallback(
    (x: number, y: number) => {
      const projectId = projectService.getProject()?.id;
      const modelId = model?.id;

      if (!isCollaborative || !projectId || !modelId) {
        return;
      }

      updateUserCursor(projectId, modelId, x, y);
    },
    [projectService, model?.id, isCollaborative]
  );

  return {
    awarenessStates,
    collaborativeUsers,
    updateCursor,
    updateAction
  };
}