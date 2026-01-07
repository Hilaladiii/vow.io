export type ResponsePaginate = {
  items: any[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_page: number;
  };
};
