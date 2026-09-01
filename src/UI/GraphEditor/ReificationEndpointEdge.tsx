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
  const endpointTypes = reificationType?.endpoints;

  const endpointType = endpointTypes?.find((type) => type.uuid === endpoint.id);

   const strokeWidth = endpointType?.style.style?.strokewidth || 1;
    const getMarker = (marker: any) => {
    if (!marker || !marker.type) return undefined;
      return {
        type: marker.type || 'none',
        color: marker.color,
        strokeWidth: marker.strokeWidth,
      };
    };

  return endpoint.elements.map((elementId) => ({
    id: crypto.randomUUID(),
    source: reificationId,
    sourceHandle: endpoint.id,
    target: elementId,
    data: { endpoint: endpoint },
    type: "reificationEndpoint",
   style: {
      ...endpointType?.style.style
    },
    markerStart: getMarker(endpointType?.style.markerStart),
    markerEnd: getMarker(endpointType?.style.markerEnd),
            
  }));
}
