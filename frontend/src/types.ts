export type UserRole = 'Admin' | 'Secretary' | 'Finance Admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  avatar: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  isbn: string; // Unique Identifier
  category: string;
  shelfLocation: string;
  language: string;
  addedDate: string;
  description?: string;
}

export interface BookBorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerDept: string;
  borrowerEmail?: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
  remarks?: string;
  issuedBy: string;
}

export interface SaleItem {
  bookId: string;
  bookTitle: string;
  isbn: string;
  unitPrice: number;
  quantity: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  receivedBy: string;
  notes?: string;
  attachments?: StoredAttachment[];
}

export type AttachmentKind = 'invoice' | 'payment-proof' | 'asset-document' | 'other';

export interface StoredAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  kind: AttachmentKind;
}

export interface BookSaleRecord {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  unitName: string; // Unit / Department Name
  items: SaleItem[];
  subtotal: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'Paid' | 'Payment Remaining';
  saleDate: string;
  paymentDueDate?: string;
  remarks?: string;
  soldBy: string;
  paymentHistory: PaymentTransaction[];
  attachments?: StoredAttachment[];
}

export type ArrivalPaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface BookArrivalRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: ArrivalPaymentStatus;
  arrivalDate: string;
  broughtBy: string;
  remarks?: string;
  recordedBy: string;
  recordedAt: string;
  paymentHistory: PaymentTransaction[];
  attachments?: StoredAttachment[];
  invoiceNo?: string;
}

export type AssetStatus = 'Working' | 'Damaged' | 'Under Repair' | 'Disposed';
export type AssetCategory = 'Electronics' | 'Furniture' | 'IT Equipment' | 'Stationery' | 'Appliances' | 'Vehicles' | 'Other';

export interface OfficeAsset {
  id: string;
  assetTag: string; // Unique Identifier e.g. AST-0102
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  quantity: number;
  location: string; // e.g. Room 2, Main Hall, IT Department
  issuedToPerson?: string;
  issuedToDept?: string;
  purchaseDate: string;
  purchaseCost: number;
  serialNumber?: string;
  remarks?: string;
  lastInspectedDate?: string;
  attachments?: StoredAttachment[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  module: 'Books' | 'Lending' | 'Sales' | 'Assets' | 'Auth' | 'Arrivals';
}
