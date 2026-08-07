import "./ElementNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  OnResize,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { useCallback } from "react";

export type ElementNodeType = Node<
  {
    element: Element;
    style: React.CSSProperties;
  },
  "element"
>;

export default function ElementNode({
  id,
  data: { element, style },
  selected,
}: NodeProps<ElementNodeType>): JSX.Element {
  const { updateNode } = useReactFlow();

  const onResize: OnResize = useCallback(
    (_event, params) => {
      updateNode(id, (node: Node) => {
        const element = node.data.element as Element;
        return {
          ...node,
          position: {
            x:
              params.direction[0] === 1
                ? node.position.x + Math.max(0, element.width - params.width)
                : node.position.x - Math.max(0, params.width - element.width),
            y:
              params.direction[1] === 1
                ? node.position.y + Math.max(0, element.height - params.height)
                : node.position.y - Math.max(0, params.height - element.height),
          },
          data: {
            ...node.data,
            element: {
              ...element,
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
      className="element-node"
      style={{
        ...style,
        height: element.height,
        width: element.width,
      }}
    >
      <Handle
        className="full-node-handle"
        type="source"
        position={Position.Right}
      />
      <Handle
        className="full-node-handle"
        type="target"
        position={Position.Left}
      />
      <NodeResizer isVisible={selected} onResize={onResize} />

      <div className="element-node-title">{element.name}</div>
      {element.properties.map((p) => (
        <div className="element-node-property" key={p.id}>
          {p.name} = {p.value}
        </div>
      ))}
    </div>
  );
}

export function convertElementToNode(element: Element) {
  const elementType = {
    languageId: "a5981f7c-e3c4-4829-a026-d2d0fe153ea8",
    uuid: "70c5679b-24b7-4355-a6fa-031d23318474",
    name: "Feature",
    description: "",
    style: {
      fill: {
        type: "solid",
        value: "#ffffff",
      },
      font: {
        size: 12,
        color: "#000000",
      },
      stroke: {
        type: "solid",
        value: "#000000",
        width: 1,
      },
    },
    constraint: "",
    createdAt: "2026-08-05T18:22:49.671148+00:00",
    updatedAt: "2026-08-05T18:22:49.671148+00:00",
    properties: {
      isSelected: {
        type: "boolean",
      },
    },
  };

  return {
    id: element.id,
    position: { x: element.x, y: element.y },
    data: {
      element: element,
      style: {
        backgroundColor: elementType.style.fill.value,
        color: elementType.style.font.color,
        fontSize: `${elementType.style.font.size}px`,
        border: `${elementType.style.stroke.type} ${elementType.style.stroke.width}px ${elementType.style.stroke.value}`,
      },
    },
    type: "element",
  };
}
