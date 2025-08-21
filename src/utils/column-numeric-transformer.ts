// This transformer is used to automatically convert numeric/decimal types
// from strings (as returned by the database) to numbers (for use in code).
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}