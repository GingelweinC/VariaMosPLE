import "./ReificationNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  Position,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { useEffect } from "react";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";

export type ReificationNodeType = Node<
  {
    reification: Reification;
    style: React.CSSProperties;
  },
  "reification"
>;

function generatePosition(i: number) {
  const n = i % 4;
  switch (n) {
    case 0:
      return Position.Top;
    case 1:
      return Position.Bottom;
    case 2:
      return Position.Left;
    case 3:
      return Position.Right;
  }
}

export default function ReificationNode({
  id,
  data: { reification, style },
  selected,
  width,
  height,
}: NodeProps<ReificationNodeType>): JSX.Element {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, reification.endpoints, updateNodeInternals]);

  return (
    <div
      className="reification-node"
      style={{
        ...style,
        width: width ?? reification.width,
        height: height ?? reification.height,
      }}
    >
      {reification.endpoints.map((endpoint, index) => (
        <Handle
          key={endpoint.id}
          id={endpoint.id}
          type="source"
          className="reification-handle"
          position={generatePosition(index)}
          isConnectableEnd={false}
          isConnectableStart={true}
        />
      ))}

      <NodeResizer isVisible={selected} minWidth={20} minHeight={20} />

      <div className="reification-node-title">{reification.name}</div>
      {reification.properties
        .filter((p) => p.display === true)
        .map((p) => (
          <div className="reification-node-property" key={p.name}>
            {p.name} = {p.value === undefined ? "?" : p.value.toString()}
          </div>
        ))}
    </div>
  );
}

export function convertReificationToNode(
  reificationTypes: any[],
  reification: Reification,
) {
  const reificationType = reificationTypes.find(
    (reificationType) => reificationType.uuid === reification.typeId,
  );

  return {
    id: reification.id,
    position: { x: reification.x, y: reification.y },

    width: reification.width,
    height: reification.height,

    data: {
      reification,
      style: {
        backgroundColor: reificationType.style.fill.value,
        color: reificationType.style.font.color,
        fontSize: `${reificationType.style.font.size}px`,
        border: `${reificationType.style.stroke.type} ${reificationType.style.stroke.width}px ${reificationType.style.stroke.value}`,
      },
    },
    type: "reification",
  };
}

export function convertNodeToReification(node: Node): Reification {
  const reification = node.data.reification as Reification;

  reification.x = node.position.x;
  reification.y = node.position.y;

  reification.width = node.width;
  reification.height = node.height;

  //properties TODO
  return reification;
}
