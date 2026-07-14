export interface VoucherRecord {
  id: string; // unique internal key
  serialNo: string; // primary S/NO (e.g., 25/120061)
  date: string; // DATE (e.g., 02/12/2025)
  unitVrNo: string; // UNIT VR NO
  payee: string; // NAME OF THE PAYEE
  description: string; // DESCRIPTION
  vote: string; // VOTE
  unit: string; // UNIT
  voucherAmount: number; // VOUCHER AMOUNT (numeric)
  handOverDateToSubject: string; // HAND OVER DATE TO SUBJECT
  statusOfVr: string; // STATUS OF THE VR
  voucherAmountSec: number; // Secondary VOUCHER AMOUNT
  totalScheduleValue: number; // TOTAL SCHEDULE VALUE
  chequeValue: number; // CHEQUE VALUE
  crossEntry: number; // CROSS ENTRY
  totalPaid: number; // TOTAL PAID
  handOverDateToItmis: string; // HAND OVER DATE TO ITMIS
  itmisEvNo: string; // ITMIS EV NO
  statusOfPmt: string; // STATUS OF THE PMT
  paidDate: string; // PAID DATE
  scheduleNo: string; // SCHEDULE NO.
  chequeNo: string; // CHEQUE NO.
  handoverTo: string; // HANDOVER TO
  handOverDate: string; // HAND OVER DATE
  paidVrStatus: string; // PAID VR STATUS
  receivedDate: string; // RECEIVED DATE
  notes?: string; // Optional user notes
}

export interface RegisterStats {
  totalCount: number;
  totalVoucherAmount: number;
  totalPaidAmount: number;
  totalChequeValue: number;
  totalCrossEntry: number;
  totalPendingAmount: number;
  approvedCount: number;
  pendingCount: number;
  incompleteCount: number;
}

export interface FilterState {
  search: string;
  unit: string;
  status: string;
  vote: string;
  payee: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}
