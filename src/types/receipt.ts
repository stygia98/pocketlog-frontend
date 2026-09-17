// 백엔드 ReceiptParseResponse와 1:1로 맞춘 타입. 인식하지 못한 필드는 null로 온다(TXN-13).
export interface ReceiptParseResult {
  txnDate: string | null;
  categoryId: number | null;
  categoryName: string | null;
  merchant: string | null;
  amount: number | null;
}
