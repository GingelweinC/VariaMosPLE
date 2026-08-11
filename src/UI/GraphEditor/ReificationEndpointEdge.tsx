import {
  BaseEdge,
  Edge,
  EdgeProps,
  getStraightPath,
  useInternalNode,
} from "@xyflow/react";
import { getEdgeParams } from "./utils";

export type ReificationEndpointEdgeType = Edge<{}, "reification-endpoint">;

export default function ReificationEndpointEdge({
  id,
  source,
  target,
  data,
  style,
  markerStart,
  markerEnd,
}: EdgeProps<ReificationEndpointEdgeType>): JSX.Element {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const {
    sx: sourceX,
    sy: sourceY,
    tx: targetX,
    ty: targetY,
  } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
    />
  );
}
