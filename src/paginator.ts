export interface PaginationOptions {
  pageParam?: string;
  pageSizeParam?: string;
  defaultPageSize?: number;
  startPage?: number;
}

export interface PageResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  totalPages?: number;
  totalItems?: number;
}

export interface PaginatorConfig<T> {
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>;
  options?: PaginationOptions;
}

const DEFAULT_OPTIONS: Required<PaginationOptions> = {
  pageParam: 'page',
  pageSizeParam: 'pageSize',
  defaultPageSize: 20,
  startPage: 1,
};

export class Paginator<T> {
  private config: PaginatorConfig<T>;
  private options: Required<PaginationOptions>;
  private currentPage: number;
  private pageSize: number;

  constructor(config: PaginatorConfig<T>) {
    this.config = config;
    this.options = { ...DEFAULT_OPTIONS, ...config.options };
    this.currentPage = this.options.startPage;
    this.pageSize = this.options.defaultPageSize;
  }

  async fetchCurrent(): Promise<PageResult<T>> {
    return this.config.fetchPage(this.currentPage, this.pageSize);
  }

  async fetchNext(): Promise<PageResult<T> | null> {
    const result = await this.fetchCurrent();
    if (!result.hasNextPage) return null;
    this.currentPage += 1;
    return this.config.fetchPage(this.currentPage, this.pageSize);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<PageResult<T>> {
    this.currentPage = this.options.startPage;
    while (true) {
      const result = await this.config.fetchPage(this.currentPage, this.pageSize);
      yield result;
      if (!result.hasNextPage) break;
      this.currentPage += 1;
    }
  }

  async fetchAll(): Promise<T[]> {
    const allItems: T[] = [];
    for await (const page of this) {
      allItems.push(...page.data);
    }
    return allItems;
  }

  reset(): void {
    this.currentPage = this.options.startPage;
  }

  setPageSize(size: number): void {
    this.pageSize = size;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }
}
