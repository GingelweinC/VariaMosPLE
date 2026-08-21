import {
  BaseEdge,
  Edge,
  EdgeProps,
  getBezierPath,
  getStraightPath,
  MarkerType,
  useInternalNode,
} from "@xyflow/react";
import { Endpoint } from "../../Domain/ProductLineEngineering/Entities/Reification";
import { getEdgeParams } from "./utils";

export type ReificationEndpointEdgeType = Edge<{}, "reification-endpoint">;

export default function ReificationEndpointEdge({
  id,
  source,
  sourceX,
  sourceY,
  sourcePosition,
  target,
  style,
  markerStart,
  markerEnd,
}: EdgeProps<ReificationEndpointEdgeType>): JSX.Element {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const {
    tx: targetX,
    ty: targetY,
    targetPos: targetPosition,
  } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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

export function convertReificationEndpointToEdges(
  reificationTypes: any[],
  reificationTypeId: string,
  reificationId: string,
  endpoint: Endpoint,
) {
  const reificationType = reificationTypes.find(
    (type) => type.uuid === reificationTypeId,
  );
  const endpointTypes = reificationType.endpoints;

  const endpointType = endpointTypes.find((type) => type.uuid === endpoint.id);

  return endpoint.elements.map((elementId) => ({
    id: crypto.randomUUID(),
    source: reificationId,
    sourceHandle: endpoint.id,
    target: elementId,
    data: { endpoint: endpoint },
    type: "reificationEndpoint",
    style: {
      stroke: endpointType.style.stroke.color,
      strokeWidth: endpointType.style.stroke.width,
    },
    markerStart:
      endpointType.style.sourceArrow?.type === "arrow"
        ? {
            type: MarkerType.Arrow,
            height:
              endpointType.style.sourceArrow.height ??
              endpointType.style.stroke.width * 5,
            width:
              endpointType.style.sourceArrow.width ??
              endpointType.style.stroke.width * 5,
            color: endpointType.style.stroke.color,
            strokeWidth: endpointType.style.stroke.width,
          }
        : undefined,
    markerEnd:
      endpointType.style.targetArrow?.type === "arrow"
        ? {
            type: MarkerType.Arrow,
            height:
              endpointType.style.targetArrow.height ??
              endpointType.style.stroke.width * 5,
            width:
              endpointType.style.targetArrow.width ??
              endpointType.style.stroke.width * 5,
            color: endpointType.style.stroke.color,
            strokeWidth: endpointType.style.stroke.width,
          }
        : undefined,
  }));
}
