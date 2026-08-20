import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useReactFlow } from "@xyflow/react";
import { createPortal } from "react-dom";
import { ProjectAnnotation } from "../../Domain/ProductLineEngineering/Entities/ProjectAnnotation";
import DeleteAnnotationConfirmationModal from "./Components/DeleteAnnotationConfirmationModal";
import AnnotationBubble from "./Components/AnnotationBubble";
import AnnotationThreadPanel from "./Components/AnnotationThreadPanel";
import "./AnnotationLayer.css";

interface Props {
    projectId: string;
    modelId: string;
    projectService: any;
    annotations: any[];
    pendingAnnotation?: any;
    onCreate: (annotation: ProjectAnnotation) => void;
    onUpdate: (annotationId: string, annotation: any) => void;
    onDelete: (annotationId: string) => void;
    onResolve: (annotationId: string) => void;
    onUnresolve: (annotationId: string) => void;
    onCancelPending?: () => void;
  }

interface DragPreview {
  id: string;
  screenPosition: {
    x: number;
    y: number;
  };
  flowPosition: {
    x: number;
    y: number;
  };
}

export default function AnnotationLayer({
    annotations,
    pendingAnnotation,
    projectService,
    onCreate,
    onUpdate,
    onDelete,
    onResolve,
    onUnresolve,
    onCancelPending,
}: Props) {
  const { flowToScreenPosition, screenToFlowPosition } =
    useReactFlow();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [dragPreview, setDragPreview] =
    useState<DragPreview | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] =
    useState<any | null>(null);
  const [showResolvedPins, setShowResolvedPins] = useState(false);
  const [selectedResolvedId, setSelectedResolvedId] =
    useState<string | null>(null);

  const markerRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const draggingIdRef = useRef<string | null>(null);

  const dragPreviewRef = useRef<DragPreview | null>(null);

  const mouseDownPositionRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const dragOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  const isDraggingRef = useRef(false);

  const suppressNextClickRef = useRef(false);

  const getCurrentUser = useCallback(() => {
    const currentUserId =
      projectService.getUser?.() ||
      projectService.getCurrentUser?.()?.id ||
      projectService.getProjectInformation?.()?.user?.id;

    const projectInfo =
      projectService.getProjectInformation?.();

    const collaborators =
      projectInfo?.collaborators || [];

    const currentUser = collaborators.find(
      (collab: any) =>
        String(collab.id) === String(currentUserId),
    );

    return {
      id: currentUserId,
      name:
        currentUser?.name ||
        currentUser?.email ||
        projectService.getCurrentUser?.()?.name ||
        "User",
    };
  }, [projectService]);

  const canDeleteThread = useCallback(
    (item: any) => {
      const currentUser = getCurrentUser();

      return (
        String(item.userId) === String(currentUser.id) ||
        String(item.user_id) === String(currentUser.id) ||
        String(item.annotation?.comment?.userId) ===
          String(currentUser.id) ||
        String(item.annotation?.comment?.user_id) ===
          String(currentUser.id)
      );
    },
    [getCurrentUser],
  );

  const getScreenPosition = useCallback(
    (item: any) => {
      const position = item?.annotation?.position;

      if (!position) {
        return null;
      }

      try {
        return flowToScreenPosition({
          x: position.x,
          y: position.y,
        });
      } catch {
        return null;
      }
    },
    [flowToScreenPosition],
  );

  const getFlowPositionFromScreen = useCallback(
    (x: number, y: number) => {
      try {
        return screenToFlowPosition({
          x,
          y,
        });
      } catch {
        return null;
      }
    },
    [screenToFlowPosition],
  );

  const handleMarkerClick = useCallback(
    (id: string) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }

      if (isDraggingRef.current) {
        return;
      }

      const annotation = annotations.find(
        (item) => item.id === id,
      );

      const isResolved =
        annotation?.isResolved ||
        annotation?.is_resolved;

      const isSameSelected = selectedId === id;

      setSelectedId(
        isSameSelected ? null : id,
      );

      if (isResolved) {
        setSelectedResolvedId(
          isSameSelected ? null : id,
        );
      } else {
        setSelectedResolvedId(null);
      }
    },
    [annotations, selectedId],
  );

  const handleMouseDown = useCallback(
    (
      event: React.MouseEvent,
      id: string,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const annotation = annotations.find(
        (item) => item.id === id,
      );

      if (!annotation) {
        return;
      }

      const marker = markerRefs.current[id];

      if (marker) {
        const rect = marker.getBoundingClientRect();

        dragOffsetRef.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      } else {
        dragOffsetRef.current = {
          x: 0,
          y: 0,
        };
      }

      const initialScreenPosition =
        getScreenPosition(annotation);

      if (!initialScreenPosition) {
        return;
      }

      const initialFlowPosition =
        annotation.annotation?.position;

      if (!initialFlowPosition) {
        return;
      }

      draggingIdRef.current = id;
      mouseDownPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      isDraggingRef.current = false;
      suppressNextClickRef.current = false;

      const initialPreview: DragPreview = {
        id,
        screenPosition: {
          x: initialScreenPosition.x,
          y: initialScreenPosition.y,
        },
        flowPosition: {
          x: initialFlowPosition.x,
          y: initialFlowPosition.y,
        },
      };

      dragPreviewRef.current = initialPreview;
      setDragPreview(initialPreview);

      setSelectedId(null);
    },
    [annotations, getScreenPosition],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const id = draggingIdRef.current;
      const start = mouseDownPositionRef.current;

      if (!id || !start) {
        return;
      }

      const distance = Math.sqrt(
        Math.pow(event.clientX - start.x, 2) +
          Math.pow(event.clientY - start.y, 2),
      );

      if (distance < 4) {
        return;
      }

      isDraggingRef.current = true;

      const screenX =
        event.clientX - dragOffsetRef.current.x;

      const screenY =
        event.clientY - dragOffsetRef.current.y;

      const flowPosition =
        getFlowPositionFromScreen(
          screenX,
          screenY,
        );

      if (!flowPosition) {
        return;
      }

      const nextPreview: DragPreview = {
        id,
        screenPosition: {
          x: screenX,
          y: screenY,
        },
        flowPosition: {
          x: flowPosition.x,
          y: flowPosition.y,
        },
      };

      dragPreviewRef.current = nextPreview;
      setDragPreview(nextPreview);
    },
    [getFlowPositionFromScreen],
  );

  const handleMouseUp = useCallback(() => {
    const id = draggingIdRef.current;
    const preview = dragPreviewRef.current;

    if (
      id &&
      preview?.id === id &&
      isDraggingRef.current
    ) {
      const annotation = annotations.find(
        (item) => item.id === id,
      );

      if (annotation) {
        const updatedAnnotation = {
          ...annotation,
          annotation: {
            ...annotation.annotation,
            position: {
              x: preview.flowPosition.x,
              y: preview.flowPosition.y,
            },
          },
        };

        onUpdate(id, updatedAnnotation);

        /*
         * The browser will emit a click after mouseup.
         * Ignore that click because this interaction was a drag.
         */
        suppressNextClickRef.current = true;
      }
    }

    draggingIdRef.current = null;
    mouseDownPositionRef.current = null;

    dragOffsetRef.current = {
      x: 0,
      y: 0,
    };

    /*
     * Do NOT clear dragPreview here.
     * It stays visible until annotations contains
     * the persisted position.
     */
  }, [annotations, onUpdate]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      );
      window.removeEventListener(
        "mouseup",
        handleMouseUp,
      );
    };
  }, [handleMouseMove, handleMouseUp]);

  /*
   * Remove the visual drag preview only after
   * the actual annotation has reached the same
   * Flow position.
   */
  useEffect(() => {
    const preview = dragPreview;

    if (!preview) {
      return;
    }

    const annotation = annotations.find(
      (item) => item.id === preview.id,
    );

    const position =
      annotation?.annotation?.position;

    if (!position) {
      return;
    }

    const dx =
      position.x - preview.flowPosition.x;

    const dy =
      position.y - preview.flowPosition.y;

    if (
      Math.abs(dx) < 0.001 &&
      Math.abs(dy) < 0.001
    ) {
      dragPreviewRef.current = null;
      setDragPreview(null);
      isDraggingRef.current = false;
    }
  }, [annotations, dragPreview]);

  useEffect(() => {
    const handleCloseAnnotations = () => {
      setSelectedId(null);
      setSelectedResolvedId(null);
    };

    window.addEventListener(
      "closeAnnotations",
      handleCloseAnnotations,
    );

    return () => {
      window.removeEventListener(
        "closeAnnotations",
        handleCloseAnnotations,
      );
    };
  }, []);

  useEffect(() => {
    const handleOpenAnnotation = (event: Event) => {
      const customEvent = event as CustomEvent;

      const annotationId =
        customEvent.detail?.annotationId;

      const isResolved =
        customEvent.detail?.isResolved;

      if (!annotationId) {
        return;
      }

      setSelectedId(annotationId);

      if (isResolved) {
        setShowResolvedPins(true);
        setSelectedResolvedId(annotationId);
      } else {
        setSelectedResolvedId(null);
      }
    };

    window.addEventListener(
      "openAnnotation",
      handleOpenAnnotation,
    );

    return () => {
      window.removeEventListener(
        "openAnnotation",
        handleOpenAnnotation,
      );
    };
  }, []);

  useEffect(() => {
    const handleToggleResolvedAnnotations = (
      event: Event,
    ) => {
      const customEvent = event as CustomEvent;

      const showResolved =
        customEvent.detail?.showResolved;

      setShowResolvedPins(
        Boolean(showResolved),
      );

      if (!showResolved) {
        setSelectedResolvedId(null);
      }
    };

    window.addEventListener(
      "toggleResolvedAnnotations",
      handleToggleResolvedAnnotations,
    );

    return () => {
      window.removeEventListener(
        "toggleResolvedAnnotations",
        handleToggleResolvedAnnotations,
      );
    };
  }, []);

  const createPendingComment = useCallback(() => {
    if (
      !pendingAnnotation ||
      !newCommentText.trim()
    ) {
      return;
    }

    const currentUser = getCurrentUser();

    const annotation = new ProjectAnnotation(
      pendingAnnotation.projectId,
      pendingAnnotation.modelId,
      {
        position: pendingAnnotation.position,
        comment: {
          text: newCommentText.trim(),
          createdAt: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
        },
        replies: [],
      },
    );

    onCreate(annotation);
    setNewCommentText("");
  }, [
    pendingAnnotation,
    newCommentText,
    getCurrentUser,
    onCreate,
  ]);

  const requestDeleteAnnotation = useCallback(
    (item: any) => {
      setAnnotationToDelete(item);
      setShowDeleteModal(true);
    },
    [],
  );

  const confirmDeleteAnnotation = useCallback(() => {
    if (annotationToDelete?.id) {
      onDelete(annotationToDelete.id);
    }

    setShowDeleteModal(false);
    setAnnotationToDelete(null);
    setSelectedId(null);
    setSelectedResolvedId(null);
  }, [annotationToDelete, onDelete]);

  const cancelDeleteAnnotation = useCallback(() => {
    setShowDeleteModal(false);
    setAnnotationToDelete(null);
  }, []);

  const formatDate = useCallback(
    (date?: string) => {
      if (!date) {
        return "";
      }

      const createdAt = new Date(date);
      const now = new Date();

      const diffSeconds = Math.floor(
        (now.getTime() - createdAt.getTime()) /
          1000,
      );

      if (diffSeconds < 5) {
        return "just now";
      }

      if (diffSeconds < 60) {
        return `${diffSeconds} second${
          diffSeconds !== 1 ? "s" : ""
        } ago`;
      }

      const diffMinutes = Math.floor(
        diffSeconds / 60,
      );

      if (diffMinutes < 60) {
        return `${diffMinutes} minute${
          diffMinutes !== 1 ? "s" : ""
        } ago`;
      }

      const diffHours = Math.floor(
        diffMinutes / 60,
      );

      if (diffHours < 24) {
        return `${diffHours} hour${
          diffHours !== 1 ? "s" : ""
        } ago`;
      }

      const diffDays = Math.floor(
        diffHours / 24,
      );

      if (diffDays < 7) {
        return `${diffDays} day${
          diffDays !== 1 ? "s" : ""
        } ago`;
      }

      const diffWeeks = Math.floor(
        diffDays / 7,
      );

      if (diffWeeks < 4) {
        return `${diffWeeks} week${
          diffWeeks !== 1 ? "s" : ""
        } ago`;
      }

      const diffMonths = Math.floor(
        diffDays / 30,
      );

      if (diffMonths < 12) {
        return `${diffMonths} month${
          diffMonths !== 1 ? "s" : ""
        } ago`;
      }

      const diffYears = Math.floor(
        diffDays / 365,
      );

      return `${diffYears} year${
        diffYears !== 1 ? "s" : ""
      } ago`;
    },
    [],
  );

  const pendingScreenPosition =
    pendingAnnotation?.position
      ? flowToScreenPosition({
          x: pendingAnnotation.position.x,
          y: pendingAnnotation.position.y,
        })
      : null;

  const content = (
    <div
      className="annotation-layer"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    >
      {pendingAnnotation &&
        pendingScreenPosition && (
          <div
            className="annotation-item pending-item"
            style={{
              position: "fixed",
              left: pendingScreenPosition.x,
              top: pendingScreenPosition.y,
              transform:
                "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
          >
            <div
              className="annotation-bubble pending selected open"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="annotation-bubble-icon">
                +
              </div>
            </div>

            <div
              className="annotation-panel"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="annotation-header">
                <strong>Comment</strong>

                <button
                  type="button"
                  className="annotation-close-btn"
                  onClick={() => {
                    setNewCommentText("");
                    onCancelPending?.();
                  }}
                >
                  ×
                </button>
              </div>

              <div className="annotation-body">
                <div className="annotation-reply-box">
                  <input
                    autoFocus
                    value={newCommentText}
                    onChange={(event) =>
                      setNewCommentText(
                        event.target.value,
                      )
                    }
                    placeholder="Reply"
                    onKeyDown={(event) => {
                      event.stopPropagation();

                      if (event.key === "Enter") {
                        createPendingComment();
                      }
                    }}
                  />

                  <button
                    type="button"
                    disabled={
                      !newCommentText.trim()
                    }
                    onClick={createPendingComment}
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {annotations
        .filter((item) => {
          const isResolved =
            item?.isResolved ||
            item?.is_resolved;

          if (!item?.annotation?.position) {
            return false;
          }

          if (isResolved) {
            return showResolvedPins;
          }

          return true;
        })
        .map((item) => {
          const normalPosition =
            getScreenPosition(item);

          if (!normalPosition) {
            return null;
          }

          const position =
            dragPreview?.id === item.id
              ? dragPreview.screenPosition
              : normalPosition;

          const isSelected =
            selectedId === item.id;

          const isResolved =
            item.isResolved ||
            item.is_resolved;

          const isSelectedResolved =
            isResolved &&
            selectedResolvedId === item.id;

          const repliesCount = (
            item.annotation.replies || []
          ).length;

          const initialComment =
            item.annotation.comment?.text || "";

          const userName =
            item.userName ||
            item.user_name ||
            item.annotation?.comment?.userName ||
            item.annotation?.comment?.user_name ||
            "User";

          return (
            <div
              key={item.id}
              ref={(element) => {
                markerRefs.current[item.id] =
                  element;
              }}
              className={`annotation-item ${
                isResolved
                  ? "resolved"
                  : ""
              } ${
                isSelectedResolved
                  ? "selected-resolved"
                  : ""
              }`}
              style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                pointerEvents: "auto",
              }}
            >
              <AnnotationBubble
                userName={userName}
                date={formatDate(
                  item.createdAt ||
                    item.created_at,
                )}
                comment={initialComment}
                repliesCount={repliesCount}
                isSelected={isSelected}
                onClick={() =>
                  handleMarkerClick(item.id)
                }
                onMouseDown={(event) =>
                  handleMouseDown(
                    event,
                    item.id,
                  )
                }
              />

              {isSelected && (
                <AnnotationThreadPanel
                  item={item}
                  currentUser={getCurrentUser()}
                  formatDate={formatDate}
                  canDeleteThread={canDeleteThread(
                    item,
                  )}
                  onUpdate={onUpdate}
                  onDelete={() =>
                    requestDeleteAnnotation(item)
                  }
                  onResolve={() => {
                    onResolve(item.id);
                    setSelectedId(null);
                    setSelectedResolvedId(
                      null,
                    );
                  }}
                  onUnresolve={() => {
                    onUnresolve(item.id);
                    setSelectedId(null);
                    setSelectedResolvedId(
                      null,
                    );
                  }}
                  onClose={() => {
                    setSelectedId(null);
                    setSelectedResolvedId(
                      null,
                    );
                  }}
                />
              )}
            </div>
          );
        })}

      <DeleteAnnotationConfirmationModal
        show={showDeleteModal}
        onCancel={cancelDeleteAnnotation}
        onConfirm={confirmDeleteAnnotation}
      />
    </div>
  );

  return createPortal(content, document.body);
}