import {FullLanguage, LanguageStatus, LanguageTypes} from "./Language";


test('A Language should have the right values', () => {
  const language: FullLanguage = {
    uuid: "345",
    name: "test_name",
    type: LanguageTypes.DOMAIN,
    status: LanguageStatus.DRAFT,
    owner: {
      id: "123",
      name: "test_owner",
      email: "test_owner@example.com"
    },
    Elements: ["test_element"],
    Reifications: ["test_reification"],
    Relationships: ["test_relationship"],
  };

  expect(language.uuid).toBe("345");
  expect(language.name).toBe("test_name");
  expect(language.type).toBe(LanguageTypes.DOMAIN);
  expect(language.status).toBe(LanguageStatus.DRAFT);
  expect(language.owner.id).toBe("123");
  expect(language.owner.name).toBe("test_owner");
  expect(language.owner.email).toBe("test_owner@example.com");
  expect(language.Elements).toEqual(["test_element"]);
  expect(language.Reifications).toEqual(["test_reification"]);
  expect(language.Relationships).toEqual(["test_relationship"]);
});

