class PagedModel {
  constructor(public pageNumber: number = 1, public pageSize: number = 20) {}
}

export class LanguagesFilter extends PagedModel {
  constructor(
    public uuid?: string | string[],
    public name?: string | string[],
    public type?: string | string[],
    public status?: string | string[],
    public createdBefore?: Date | string,
    public createdAfter?: Date | string,
    public updatedBefore?: Date | string,
    public updatedAfter?: Date | string,
    public ownerId?: string | string[],
    public ownerName?: string | string[],
    public collaboratorId?: string | string[],
    public collaboratorName?: string | string[],
    public collaboratorRole?: string | string[],
    pageNumber?: number,
    pageSize?: number,
  ) {
    super(pageNumber, pageSize);
  }
}
