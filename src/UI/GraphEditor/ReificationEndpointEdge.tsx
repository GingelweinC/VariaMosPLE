import {
  BaseEdge,
  Edge,
  EdgeProps,
  getStraightPath,
  MarkerType,
  useInternalNode,
} from "@xyflow/react";
import { getEdgeParams } from "./utils";
import {
  Endpoint,
  Reification,
} from "../../Domain/ProductLineEngineering/Entities/Reification";

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

export function convertReificationEndpointToEdges(
  reificationTypes: any[],
  reificationId: string,
  endpoint: Endpoint,
) {
  const endpointTypes = reificationTypes.flatMap(
    (reificationType) => reificationType.endpoints,
  );
  const endpointType = endpointTypes.find(
    (endpointType) => endpointType.uuid === endpoint.id,
  );
  return endpoint.elements.map((elementId) => ({
    id: endpoint.id + "_" + elementId,
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
              endpointType.style.sourceArrow.height ??
              endpointType.style.stroke.width * 5,
            width:
              endpointType.style.sourceArrow.width ??
              endpointType.style.stroke.width * 5,
            color: endpointType.style.stroke.color,
            strokeWidth: endpointType.style.stroke.width,
          }
        : undefined,
  }));
}
