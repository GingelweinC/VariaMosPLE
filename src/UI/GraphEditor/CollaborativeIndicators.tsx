import { ViewportPortal, Node } from "@xyflow/react";
import "./CollaborativeIndicators.css";
import React from "react";
export interface UserAction {
  type: "moving" | "editing" | "resizing" | "selecting" | "idle";
  cellId?: string;
  timestamp: string;
  details?: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    editType?: "properties" | "label" | "geometry";
  };
}

interface CollaborativeUser {
  id?: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  action?: UserAction;
  modelId?: string;
}

interface CollaborativeIndicatorsProps {
  users: CollaborativeUser[];
  nodes: Node[];
}

const CollaborativeIndicators: React.FC<CollaborativeIndicatorsProps> = ({
  users,
  nodes,
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "moving":
        return "🔄";
      case "editing":
        return "✏️";
      case "resizing":
        return "📏";
      case "selecting":
        return "🎯";
      default:
        return "👤";
    }
  };

  const getActionText = (actionType: string, editType?: string) => {
    switch (actionType) {
      case "moving":
        return "Moviendo";
      case "editing":
        return editType === "properties"
          ? "Editando propiedades"
          : "Editando";
      case "resizing":
        return "Redimensionando";
      case "selecting":
        return "Seleccionando";
      default:
        return "Activo";
    }
  };

  const getNodePosition = (cellId: string) => {
    const node = nodes.find((node) => node.id === cellId);

    if (!node) {
      return null;
    }

    const width = node.measured?.width ?? node.width ?? 0;
    const height = node.measured?.height ?? node.height ?? 0;

    return {
      x: node.position.x,
      y: node.position.y,
      width,
      height,
    };
  };

  return (
    <ViewportPortal>
      {users.map((user, index) => {
        if (
          !user.action ||
          user.action.type === "idle" ||
          !user.action.cellId
        ) {
          return null;
        }

        const nodePosition = getNodePosition(user.action.cellId);

        if (!nodePosition) {
          return null;
        }

        const indicatorStyle: React.CSSProperties = {
          position: "absolute",
          left: nodePosition.x - 5,
          top: nodePosition.y - 35,
          backgroundColor: user.color,
          color: "white",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        };

        const cellBorderStyle: React.CSSProperties = {
          position: "absolute",
          left: nodePosition.x - 2,
          top: nodePosition.y - 2,
          width: nodePosition.width + 4,
          height: nodePosition.height + 4,
          border: `2px solid ${user.color}`,
          borderRadius: "4px",
          pointerEvents: "none",
          zIndex: 999,
        };

        return (
          <React.Fragment key={`${user.id ?? user.name}-${index}`}>
            <div style={cellBorderStyle} />

            <div style={indicatorStyle}>
              <span>{getActionIcon(user.action.type)}</span>
              <span>{user.name}</span>
              <span>-</span>
              <span>
                {getActionText(
                  user.action.type,
                  user.action.details?.editType
                )}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </ViewportPortal>
  );
};

export default CollaborativeIndicators;