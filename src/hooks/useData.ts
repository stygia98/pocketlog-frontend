"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { exportCsv, importCsv, triggerDownload } from "@/lib/data";
import { invalidateTransactionRelatedQueries } from "@/lib/queryKeys";

export function useExportCsvMutation() {
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => exportCsv(from, to),
    onSuccess: (result) => triggerDownload(result),
  });
}

// 가져오기는 부분 성공을 허용한다(CLAUDE.md 5장) — 실패 건이 있어도 성공한 만큼은 이미
// 등록됐으므로, 거래·대시보드·예산 캐시를 모두 무효화해 화면에 반영한다.
export function useImportCsvMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCsv(file),
    onSuccess: () => invalidateTransactionRelatedQueries(queryClient),
  });
}
