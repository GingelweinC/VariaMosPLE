import "./ReificationNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  OnResize,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { useCallback } from "react";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";

export type ReificationNodeType = Node<
  {
    reification: Reification;
    style: React.CSSProperties;
  },
  "reification"
>;

export default function ReificationNode({
  id,
  data: { reification, style },
  selected,
}: NodeProps<ReificationNodeType>): JSX.Element {
  const { updateNode } = useReactFlow();

  const onResize: OnResize = useCallback(
    (_event, params) => {
      updateNode(id, (node: Node) => {
        const reification = node.data.reification as Reification;
        return {
          ...node,
          position: {
            x:
              params.direction[0] === 1
                ? node.position.x +
                  Math.max(0, reification.width - params.width)
                : node.position.x -
                  Math.max(0, params.width - reification.width),
            y:
              params.direction[1] === 1
                ? node.position.y +
                  Math.max(0, reification.height - params.height)
                : node.position.y -
                  Math.max(0, params.height - reification.height),
          },
          data: {
            ...node.data,
            reification: {
              ...reification,
              height: params.height,
              width: params.width,
            },
          },
        };
      });
    },
    [id, updateNode],
  );

  return (
    <div
      className="reification-node"
      style={{
        ...style,
        height: reification.height,
        width: reification.width,
      }}
    >
      {Object.entries(reification.endpoints).map(([name, elementTypes]) => (
        <>name</>
      ))}
      <Handle
        className="full-node-handle"
        type="source"
        position={Position.Right}
      />
      <NodeResizer isVisible={selected} onResize={onResize} />

      <div className="reification-node-title">{reification.name}</div>
      {reification.properties.map((p) => (
        <div className="reification-node-property" key={p.id}>
          {p.name} = {p.value}
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
    data: {
      reification: reification,
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
