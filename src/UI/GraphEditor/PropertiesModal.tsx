import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";

import {
  Property,
  Type,
} from "../../Domain/ProductLineEngineering/Entities/Property";

interface Props {
  item: any;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  onPropertiesChange: (properties: Property[]) => void;
}
type NewPropertyType = "boolean" | "integer" | "string" | "array";

export default function PropertiesModal({
  item,
  onPropertiesChange,
  name,
  setName,
}: Props) {
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
          <>
            <Form.Control
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
              variant="outline-secondary"
              onClick={() => updatePropertyValue(index, undefined)}
            >
              Unset
            </Button>
          </>
        );

      case "string":
        return (
          <>
            <Form.Control
              type="text"
              value={property.value === undefined ? "" : property.value}
              placeholder="Undefined"
              onChange={(event) => {
                const value = event.target.value;

                updatePropertyValue(index, value === "" ? undefined : value);
              }}
            />

            <Button
              variant="outline-secondary"
              onClick={() => updatePropertyValue(index, undefined)}
            >
              Unset
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h5>Name</h5>

      <InputGroup>
        <Form.Control
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </InputGroup>

      <hr />

      <h5>Properties</h5>
      {properties.map((property, index) => (
        <InputGroup key={`${property.name}-${index}`}>
          <InputGroup.Checkbox
            checked={property.display}
            onChange={(event) =>
              updatePropertyDisplay(index, event.target.checked)
            }
            title="Display property"
          />

          <InputGroup.Text>{property.name}</InputGroup.Text>

          {renderPropertyControl(property, index)}

          {isCustomProperty(property) && (
            <Button
              variant="outline-danger"
              onClick={() => deleteProperty(index)}
            >
              Delete
            </Button>
          )}
        </InputGroup>
      ))}

      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Property name"
          value={propertyName}
          onChange={(event) => setPropertyName(event.target.value)}
        />

        <Form.Select
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

        {propertyType === "array" && (
          <Form.Control
            type="text"
            placeholder="Values: A,B,C"
            value={propertyValues}
            onChange={(event) => setPropertyValues(event.target.value)}
          />
        )}

        {propertyType === "boolean" ? (
          <Form.Select
            value={propertyValue}
            onChange={(event) => setPropertyValue(event.target.value)}
          >
            <option value="">Undefined</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </Form.Select>
        ) : (
          <Form.Control
            type={propertyType === "integer" ? "number" : "text"}
            placeholder="Initial value"
            value={propertyValue}
            onChange={(event) => setPropertyValue(event.target.value)}
          />
        )}

        <Button variant="primary" onClick={addProperty}>
          Add
        </Button>
      </InputGroup>
    </div>
  );
}
