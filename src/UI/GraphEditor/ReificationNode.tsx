import "./ReificationNode.css";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";

export type ReificationNodeType = Node<
  {
    reification: Reification;
  },
  "reification"
>;

export default function ReificationNode({
  data,
}: NodeProps<ReificationNodeType>): JSX.Element {
  return (
    <div className="reification-node">
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
