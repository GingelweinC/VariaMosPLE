import { Button, ListGroup } from "react-bootstrap";
import { Reification } from "../../../Domain/ProductLineEngineering/Entities/Reification";

export interface ReificationItemProps {
  reificationType: Record<string, any>;
  addReification: Function;
}

export default function ReificationItem({
  reificationType,
  addReification,
}: Readonly<ReificationItemProps>): JSX.Element {
  return (
    <Button
      variant="outline-primary"
      onClick={() =>
        addReification(Reification.fromReificationType(reificationType))
      }
    >
      {reificationType.name}
    </Button>
  );
}
