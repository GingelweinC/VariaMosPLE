import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

export interface QueryBuilderModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function QueryBuilderModal({
  show,
  setShow,
  setQuery,
}: Readonly<QueryBuilderModalProps>): JSX.Element {
  const [operation, setOperation] = useState<string>("sat");
  const [limit, setLimit] = useState<number>(1);
  const [target, setTarget] = useState<string>("");
  const [direction, setDirection] = useState<"minimize" | "maximize">(
    "minimize",
  );

  function handleOnConstructQuery() {
    setQuery(
      JSON.stringify(
        {
          operation: operation,
          limit: limit,
          target: target,
          direction: direction,
        },
        null,
        2,
      ),
    );
  }

  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>Query Builder</Modal.Header>
      <Modal.Body>
        <div>
          Operation
          <Form.Select
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
          >
            <option value="sat">SAT</option>
            <option value="solve">Solve</option>
            <option value="optimize">Optimize</option>
          </Form.Select>
        </div>
        <div>
          Limit
          <Form.Control
            type="number"
            min="1"
            value={limit}
            onChange={(event) => setLimit(Number.parseInt(event.target.value))}
          />
        </div>
        <div>
          Target
          <Form.Control
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Variable to optimize"
          />
        </div>
        <div>
          Direction
          <div>
            <Form.Check
              inline
              type="radio"
              name="query-builder-direction"
              label="Minimize"
              checked={direction === "minimize"}
              onChange={() => setDirection("minimize")}
            />
            <Form.Check
              inline
              type="radio"
              name="query-builder-direction"
              label="Maximize"
              checked={direction === "maximize"}
              onChange={() => setDirection("maximize")}
            />
          </div>
        </div>
        <div>iteration_rules TODO</div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="w-100"
          variant="primary"
          onClick={() => {
            handleOnConstructQuery();
            setShow(false);
          }}
        >
          Construct Query
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
