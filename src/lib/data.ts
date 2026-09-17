import { apiClient, type DownloadResult } from "@/lib/apiClient";
import type { CsvImportResult } from "@/types/csv";

export function exportCsv(from: string, to: string): Promise<DownloadResult> {
  return apiClient.download("/data/export", { from, to });
}

export function importCsv(file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.upload<CsvImportResult>("/data/import", formData);
}

// 브라우저가 파일을 저장하도록 트리거한다. apiClient.download가 준 blob은 그 자체로는
// 화면에 아무 효과가 없으므로, 임시 <a download> 클릭으로 다운로드를 발생시킨다.
export function triggerDownload({ blob, filename }: DownloadResult): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
