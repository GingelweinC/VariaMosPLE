import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";

import {
  Property,
  Type,
} from "../../Domain/ProductLineEngineering/Entities/Property";

interface Props {
  item: any;
  onPropertiesChange: (properties: Property[]) => void;
}
type NewPropertyType = "boolean" | "integer" | "string" | "array";

export default function PropertiesModal({ item, onPropertiesChange }: Props) {
  const [properties, setProperties] = useState<Property[]>(
    structuredClone(item?.properties ?? []),
  );

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState<NewPropertyType>("string");
  const [propertyValues, setPropertyValues] = useState("");
  const [propertyValue, setPropertyValue] = useState("");

  useEffect(() => {
    setProperties(structuredClone(item?.properties ?? []));
  }, [item]);

  const updateProperties = (updatedProperties: Property[]) => {
    setProperties(updatedProperties);
    onPropertiesChange(updatedProperties);
  };

  const updatePropertyDisplay = (index: number, display: boolean) => {
    const updatedProperties = properties.map((property, currentIndex) =>
      currentIndex === index
        ? {
            ...property,
            display,
          }
        : property,
    );

    updateProperties(updatedProperties);
  };

  const isCustomProperty = (property: Property): boolean => {
    return property.custom === true;
  };

  const updatePropertyValue = (index: number, value: any) => {
    const updatedProperties = properties.map((property, currentIndex) =>
      currentIndex === index
        ? {
            ...property,
            value,
          }
        : property,
    );

    updateProperties(updatedProperties);
  };

  const deleteProperty = (index: number) => {
    const property = properties[index];

    if (!isCustomProperty(property)) {
      return;
    }

    const updatedProperties = properties.filter(
      (_, currentIndex) => currentIndex !== index,
    );

    updateProperties(updatedProperties);
  };

  const addProperty = () => {
    const name = propertyName.trim();

    if (!name) {
      return;
    }

    if (properties.some((property) => property.name === name)) {
      return;
    }

    let type: Type;
    let value: any = undefined;

    switch (propertyType) {
      case "boolean":
        type = "boolean";

        if (propertyValue === "true") {
          value = true;
        } else if (propertyValue === "false") {
          value = false;
        }

        break;

      case "integer":
        type = "integer";

        if (propertyValue.trim() !== "") {
          const parsedValue = Number.parseInt(propertyValue, 10);

          if (!Number.isNaN(parsedValue)) {
            value = parsedValue;
          }
        }

        break;

      case "string":
        type = "string";

        if (propertyValue !== "") {
          value = propertyValue;
        }

        break;

      case "array":
        type = propertyValues
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0);

        if (propertyValue !== "") {
          value = propertyValue;
        }

        break;
    }

    const property = new Property(name, type, value, false, true);

    updateProperties([...properties, property]);

    setPropertyName("");
    setPropertyType("string");
    setPropertyValues("");
    setPropertyValue("");
  };

  const renderPropertyControl = (property: Property, index: number) => {
    if (Array.isArray(property.type)) {
      return (
        <Form.Select
          size="sm"
          value={
            property.value === undefined ? "__undefined__" : property.value
          }
          onChange={(event) => {
            const value = event.target.value;

            updatePropertyValue(
              index,
              value === "__undefined__" ? undefined : value,
            );
          }}
        >
          <option value="__undefined__">Undefined</option>

          {property.type.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      );
    }

    switch (property.type) {
      case "boolean":
        return (
          <Form.Select
            size="sm"
            value={
              property.value === undefined
                ? "__undefined__"
                : property.value
                ? "true"
                : "false"
            }
            onChange={(event) => {
              const value = event.target.value;

              updatePropertyValue(
                index,
                value === "__undefined__" ? undefined : value === "true",
              );
            }}
          >
            <option value="__undefined__">Undefined</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </Form.Select>
        );

      case "integer":
        return (
          <div className="d-flex gap-2">
            <Form.Control
              size="sm"
              type="number"
              value={property.value === undefined ? "" : property.value}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  updatePropertyValue(index, undefined);
                  return;
                }

                const parsedValue = Number.parseInt(value, 10);

                updatePropertyValue(
                  index,
                  Number.isNaN(parsedValue) ? undefined : parsedValue,
                );
              }}
            />

            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => updatePropertyValue(index, undefined)}
            >
              Undefined
            </Button>
          </div>
        );

      case "string":
        return (
          <div className="d-flex gap-2">
            <Form.Control
              size="sm"
              type="text"
              value={property.value === undefined ? "" : property.value}
              placeholder="Undefined"
              onChange={(event) => {
                const value = event.target.value;

                updatePropertyValue(index, value === "" ? undefined : value);
              }}
            />

            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => updatePropertyValue(index, undefined)}
            >
              Undefined
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
        {properties.map((property, index) => (
        <div
            className="row align-items-center mb-2"
            key={`${property.name}-${index}`}
        >
            <div className="col-md-1 d-flex justify-content-center">
            <Form.Check
                type="switch"
                checked={property.display}
                onChange={(event) =>
                updatePropertyDisplay(
                    index,
                    event.target.checked,
                )
                }
                title="Display property"
            />
            </div>

            <div className="col-md-2">
            <label className="form-label mb-0">
                {property.name}
            </label>
            </div>

            <div className="col-md-7">
            {renderPropertyControl(property, index)}
            </div>

            <div className="col-md-2">
            {isCustomProperty(property) && (
                <Button
                size="sm"
                variant="outline-danger"
                onClick={() => deleteProperty(index)}
                >
                Delete
                </Button>
            )}
            </div>
        </div>
        ))}

      <hr />

      <h6>Add property</h6>

      <div className="row g-2">
        <div className="col-md-3">
          <Form.Control
            size="sm"
            type="text"
            placeholder="Property name"
            value={propertyName}
            onChange={(event) => setPropertyName(event.target.value)}
          />
        </div>

        <div className="col-md-2">
          <Form.Select
            size="sm"
            value={propertyType}
            onChange={(event) =>
              setPropertyType(event.target.value as NewPropertyType)
            }
          >
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="boolean">Boolean</option>
            <option value="array">String list</option>
          </Form.Select>
        </div>

        {propertyType === "array" && (
          <div className="col-md-3">
            <Form.Control
              size="sm"
              type="text"
              placeholder="Values: A,B,C"
              value={propertyValues}
              onChange={(event) => setPropertyValues(event.target.value)}
            />
          </div>
        )}

        <div className={propertyType === "array" ? "col-md-2" : "col-md-4"}>
          {propertyType === "boolean" ? (
            <Form.Select
              size="sm"
              value={propertyValue}
              onChange={(event) => setPropertyValue(event.target.value)}
            >
              <option value="">Undefined</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </Form.Select>
          ) : (
            <Form.Control
              size="sm"
              type={propertyType === "integer" ? "number" : "text"}
              placeholder="Initial value"
              value={propertyValue}
              onChange={(event) => setPropertyValue(event.target.value)}
            />
          )}
        </div>

        <div className="col-md-2">
          <Button
            size="sm"
            variant="primary"
            className="w-100"
            onClick={addProperty}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
