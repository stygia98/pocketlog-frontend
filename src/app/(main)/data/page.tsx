"use client";

import { useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";

import { PageHeader } from "@/components/common/PageHeader";
import { CsvArt } from "@/components/illustration/Art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExportCsvMutation, useImportCsvMutation } from "@/hooks/useData";
import { toDateString } from "@/lib/date";

export default function DataPage() {
  const now = new Date();
  const [from, setFrom] = useState(toDateString(startOfMonth(now)));
  const [to, setTo] = useState(toDateString(endOfMonth(now)));
  const [file, setFile] = useState<File | null>(null);

  const exportMutation = useExportCsvMutation();
  const importMutation = useImportCsvMutation();

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  // BOM을 붙여야 엑셀에서 한글이 깨지지 않는다(CLAUDE.md 5장 CSV 내보내기 규칙과 동일).
  const handleDownloadTemplate = () => {
    const csv =
      "﻿날짜,구분,카테고리,금액,거래처,메모\n2026-09-14,지출,식비,12500,스타벅스 강남점,팀 미팅\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "포켓로그_가져오기_양식.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reveal-stack flex flex-col gap-8">
      <PageHeader title="내역관리" description="엑셀 파일로 내보내거나, 기존 가계부를 가져와요." art={<CsvArt />} />

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">내보내기</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="export-from">시작일</Label>
            <Input id="export-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="export-to">종료일</Label>
            <Input id="export-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button onClick={() => exportMutation.mutate({ from, to })} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? "내려받는 중..." : "다운로드"}
          </Button>
        </div>
        {exportMutation.isError && (
          <p className="text-sm text-destructive">내려받지 못했어요. 다시 시도해 주세요.</p>
        )}
      </section>

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">가져오기</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">날짜</th>
                <th className="py-2 pr-4 font-medium">구분</th>
                <th className="py-2 pr-4 font-medium">카테고리</th>
                <th className="py-2 pr-4 font-medium">금액</th>
                <th className="py-2 pr-4 font-medium">거래처</th>
                <th className="py-2 font-medium">메모</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr>
                <td className="py-2 pr-4">2026-09-14</td>
                <td className="py-2 pr-4">지출</td>
                <td className="py-2 pr-4">식비</td>
                <td className="py-2 pr-4">12500</td>
                <td className="py-2 pr-4">스타벅스 강남점</td>
                <td className="py-2">팀 미팅</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="file"
            accept=".csv"
            aria-label="가져올 CSV 파일"
            className="w-auto"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
            {importMutation.isPending ? "가져오는 중..." : "가져오기"}
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            양식 다운로드
          </Button>
        </div>

        {/* 중복 등록 안내는 CLAUDE.md가 화면에 두라고 정한 문구라 한 문장에 함께 담는다. */}
        <p className="text-xs text-muted-foreground">
          구분은 수입/지출로 쓰고, 없는 카테고리는 실패하며, 상한은 1MB·5,000행, 다시 올리면 중복 등록됩니다.
        </p>

        {importMutation.isError && <p className="text-sm text-destructive">가져오지 못했어요. 다시 시도해 주세요.</p>}

        {importMutation.data && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">
              {importMutation.data.imported}건 등록, {importMutation.data.failed}건 실패
            </p>
            {importMutation.data.errors.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {importMutation.data.errors.map((error) => (
                  <li key={error.line}>
                    {error.line}행 — {error.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
