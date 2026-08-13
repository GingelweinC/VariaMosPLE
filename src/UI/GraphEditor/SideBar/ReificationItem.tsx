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
    <div className="reification-item">
      {reificationType.name}
      <button
        type="button"
        onClick={() =>
          addReification(
            new Reification(
              "New " + reificationType.name,
              reificationType.uuid,
              [],
              reificationType.endpoints.map((endpoint: { uuid: any }) => [
                endpoint.uuid,
                [],
              ]),
              null,
            ),
          )
        }
      >
        +
      </button>
    </div>
  );
}
