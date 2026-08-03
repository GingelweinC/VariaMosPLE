interface SimpleElementRule {
  param: string;
  constraint: string;
  enumMapping?: EnumParameterMapping;
  selectedConstraint?: string;
  deselectedConstraint?: string;
}

interface EnumParameterMapping {
  var: string;
  attribute: string;
}

interface MappingConfig {
  unique: boolean;
  var: string;
}

interface ReifiedRelationParameterMapping {
  inboundEdges: MappingConfig;
  outboundEdges: MappingConfig;
  node?: string;
}

interface ReifiedRelationElementRule {
  param: string[];
  paramMapping: ReifiedRelationParameterMapping;
  constraint: Record<string, string>;
}

interface RelationRule {
  params: string[];
  constraint: string;
}

interface RelationPropertyLookupRule {
  index: number;
  key: string;
}

interface RelationTypedElementRule {
  param: string[];
  relationLookupSchema: Record<string, RelationPropertyLookupRule>;
  derivingRelationInbound: boolean;
  constraint: string;
}

interface AttributeTranslationRule {
  parent: string;
  param: string;
  template: string;
  constraint: string;
  unsetConstraint?: string;
  value?: string;
  values?: string;
}

interface HierarchyNodeRule {
  param: string[];
  paramMapping: HierarchyNodeParameterMapping;
  constraint: string;
}

interface HierarchyNodeParameterMapping {
  incoming: boolean;
  var: string;
  node: string;
}

interface HierarchyTranslationRule {
  nodeRule: HierarchyNodeRule;
  leafRule: SimpleElementRule;
}

export interface Semantics {
  elementTypes: string[];
  elementTranslationRules: Record<string, SimpleElementRule>;
  attributeTypes: string[];
  attributeTranslationRules: Record<string, AttributeTranslationRule>;
  typingRelationTypes: string[];
  typingRelationTranslationRules: Record<string, RelationTypedElementRule>;
  hierarchyTypes: string[];
  hierarchyTranslationRules: Record<string, HierarchyTranslationRule>;
  relationReificationTypes: string[];
  relationReificationTranslationRules: Record<string, ReifiedRelationElementRule>;
  relationReificationExpansions: Record<string, string[]>;
  relationReificationPropertySchema: Record<string, RelationPropertyLookupRule>;
  relationReificationTypeDependentExpansions: Record<string, Record<string, string[]>>;
  relationTypes: string[];
  relationPropertySchema: Record<string, RelationPropertyLookupRule>;
  relationTranslationRules: Record<string, RelationRule>;
  ignoredRelationTypes?: string[];
  symbolMap?: Record<string, string>;
}
