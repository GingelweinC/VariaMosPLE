import CollaborativeIndicators from "./CollaborativeIndicators";
import { ViewportPortal } from "@xyflow/react";

interface GraphAwarenessProps {
  awarenessStates: any[];
  collaborativeUsers: any[];
  modelId: string | null;
  currentUserName: string | null;
  nodes: any[];
  edges: any[];
}

export default function GraphAwareness({
  awarenessStates,
  collaborativeUsers,
  modelId,
  currentUserName,
  nodes,
}: GraphAwarenessProps) {
  const users = awarenessStates.filter(
    (state: any) =>
      state.user &&
      state.user.cursor &&
      state.user.modelId === modelId &&
      state.user.name !== currentUserName
  );

  return (
    <>
      <ViewportPortal>
        {users.map((state: any) => (
          <div
            key={state.user.id}
            style={{
              position: "absolute",
              left: state.user.cursor.x,
              top: state.user.cursor.y,
              transform: "translate(8px, 8px)",
              pointerEvents: "none",
              zIndex: 1000,
              color: state.user.color,
              fontWeight: "bold",
              fontSize: 12,
              background: "#fff8",
              borderRadius: 4,
              padding: "2px 6px",
              border: `1px solid ${state.user.color}`,
              whiteSpace: "nowrap",
            }}
          >
            {state.user.name}
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                marginLeft: 4,
                borderRadius: "50%",
                background: state.user.color,
                verticalAlign: "middle",
              }}
            />
          </div>
        ))}
      </ViewportPortal>

      <CollaborativeIndicators
        users={collaborativeUsers}
        nodes={nodes}
      />
    </>
  );
}