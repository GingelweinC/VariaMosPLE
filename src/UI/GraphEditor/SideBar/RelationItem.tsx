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
    <div
      className={
        currentRelationType?.uuid === relationType.uuid
          ? "relation-item relation-item-active"
          : "relation-item"
      }
    >
      {relationType.name}
      <button
        type="button"
        onClick={() => setCurrentRelationType(relationType)}
      >
        +
      </button>
    </div>
  );
}
