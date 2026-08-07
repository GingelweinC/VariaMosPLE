//modify this to handle the semantics

export enum LanguageTypes {
  SCOPE = "scope",
  DOMAIN = "domain",
  APPLICATION = "application",
}

export enum LanguageStatus {
  DRAFT = "draft",
  PENDING = "pending",
  PUBLISHED = "published",
  DELETED = "deleted",
}


export type Language = {
  uuid: string;
  name: string;
  ownerId?: string;
  type: LanguageTypes;
  status: LanguageStatus;
  publicVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  }
}

export type FullLanguage = Language & {
  Elements: any[];
  Reifications: any[]
  Relationships: any[];
}



