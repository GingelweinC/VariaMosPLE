import { Button, ListGroup } from "react-bootstrap";
import { useConnectionContext } from "../ConnectionContext";

export interface RelationItemProps {
  relationType: Record<string, any>;
}

export default function RelationItem({
  relationType,
}: Readonly<RelationItemProps>): JSX.Element {
  const { currentRelationType, setCurrentRelationType } =
    useConnectionContext();
  return (
    <Button
      variant="outline-primary"
      active={currentRelationType?.uuid === relationType.uuid}
      onClick={() => {
        setCurrentRelationType(
          currentRelationType?.uuid === relationType.uuid ? null : relationType,
        );
      }}
    >
      {relationType.name}
    </Button>
  );
}
