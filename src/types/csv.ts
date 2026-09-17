// 백엔드 CsvImportResult와 1:1로 맞춘 타입.

export interface CsvImportError {
  line: number;
  reason: string;
}

export interface CsvImportResult {
  imported: number;
  failed: number;
  errors: CsvImportError[];
}
