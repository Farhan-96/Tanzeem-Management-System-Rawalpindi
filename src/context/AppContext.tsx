import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  Book,
  BookBorrowRecord,
  BookSaleRecord,
  OfficeAsset,
  ActivityLog,
  AssetStatus,
  SaleItem,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_BOOKS,
  INITIAL_BORROW_RECORDS,
  INITIAL_SALE_RECORDS,
  INITIAL_OFFICE_ASSETS,
  INITIAL_LOGS,
} from '../data/mockData';

interface AppContextType {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  switchUserRole: (role: UserRole) => void;

  books: Book[];
  addBook: (newBook: Omit<Book, 'id' | 'availableQuantity' | 'addedDate'>) => void;
  updateBook: (updatedBook: Book) => void;
  deleteBook: (bookId: string) => void;

  borrowRecords: BookBorrowRecord[];
  issueBookBorrow: (data: {
    bookId: string;
    borrowerName: string;
    borrowerPhone: string;
    borrowerDept: string;
    borrowerEmail?: string;
    expectedReturnDate: string;
    remarks?: string;
  }) => { success: boolean; message: string };
  returnBookBorrow: (recordId: string, remarks?: string) => void;

  saleRecords: BookSaleRecord[];
  createBookSale: (data: {
    customerName: string;
    customerPhone?: string;
    unitName: string;
    items: Array<{ bookId: string; quantity: number; unitPrice?: number }>;
    discount: number;
    initialPayment: number;
    paymentDueDate?: string;
    remarks?: string;
  }) => { success: boolean; invoiceNo?: string; message: string };
  collectPayment: (saleId: string, amount: number, notes?: string) => void;

  assets: OfficeAsset[];
  addAsset: (asset: Omit<OfficeAsset, 'id' | 'assetTag'> & { assetTag?: string }) => void;
  updateAsset: (asset: OfficeAsset) => void;
  deleteAsset: (assetId: string) => void;
  updateAssetStatus: (assetId: string, status: AssetStatus, remarks?: string) => void;
  assignAsset: (assetId: string, personName: string, deptName: string) => void;

  logs: ActivityLog[];
  addLog: (action: string, details: string, module: 'Books' | 'Lending' | 'Sales' | 'Assets' | 'Auth') => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tanzeem_library_inventory_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Default Admin
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BookBorrowRecord[]>([]);
  const [saleRecords, setSaleRecords] = useState<BookSaleRecord[]>([]);
  const [assets, setAssets] = useState<OfficeAsset[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from LocalStorage or Mock Seed Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBooks(parsed.books || INITIAL_BOOKS);
        setBorrowRecords(parsed.borrowRecords || INITIAL_BORROW_RECORDS);
        setSaleRecords(parsed.saleRecords || INITIAL_SALE_RECORDS);
        setAssets(parsed.assets || INITIAL_OFFICE_ASSETS);
        setLogs(parsed.logs || INITIAL_LOGS);
        if (parsed.currentUserId) {
          const found = INITIAL_USERS.find((u) => u.id === parsed.currentUserId);
          if (found) setCurrentUser(found);
        }
      } else {
        setBooks(INITIAL_BOOKS);
        setBorrowRecords(INITIAL_BORROW_RECORDS);
        setSaleRecords(INITIAL_SALE_RECORDS);
        setAssets(INITIAL_OFFICE_ASSETS);
        setLogs(INITIAL_LOGS);
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      setBooks(INITIAL_BOOKS);
      setBorrowRecords(INITIAL_BORROW_RECORDS);
      setSaleRecords(INITIAL_SALE_RECORDS);
      setAssets(INITIAL_OFFICE_ASSETS);
      setLogs(INITIAL_LOGS);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to LocalStorage on state update
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const dataToSave = {
        books,
        borrowRecords,
        saleRecords,
        assets,
        logs,
        currentUserId: currentUser.id,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [books, borrowRecords, saleRecords, assets, logs, currentUser, isInitialized]);

  const addLog = (
    action: string,
    details: string,
    module: 'Books' | 'Lending' | 'Sales' | 'Assets' | 'Auth'
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      module,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const switchUserRole = (role: UserRole) => {
    const user = INITIAL_USERS.find((u) => u.role === role) || {
      id: `usr-${role.toLowerCase()}`,
      name: `${role} User`,
      role,
      email: `${role.toLowerCase()}@tanzeem.org`,
      department: 'Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    };
    setCurrentUser(user);
    addLog('Role Switched', `Switched active profile role to ${role}`, 'Auth');
  };

  const addBook = (newBookData: Omit<Book, 'id' | 'availableQuantity' | 'addedDate'>) => {
    const bookId = `bk-${Date.now()}`;
    const formattedBook: Book = {
      ...newBookData,
      id: bookId,
      availableQuantity: newBookData.totalQuantity,
      isbn: newBookData.isbn.trim() || `ISBN-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      addedDate: new Date().toISOString().split('T')[0],
    };

    setBooks((prev) => [formattedBook, ...prev]);
    addLog(
      'New Book Added',
      `Added "${formattedBook.title}" by ${formattedBook.author} (${formattedBook.totalQuantity} copies, ISBN: ${formattedBook.isbn})`,
      'Books'
    );
  };

  const updateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    addLog('Book Updated', `Updated details for "${updatedBook.title}"`, 'Books');
  };

  const deleteBook = (bookId: string) => {
    const target = books.find((b) => b.id === bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (target) {
      addLog('Book Removed', `Removed book "${target.title}" from catalog`, 'Books');
    }
  };

  const issueBookBorrow = (data: {
    bookId: string;
    borrowerName: string;
    borrowerPhone: string;
    borrowerDept: string;
    borrowerEmail?: string;
    expectedReturnDate: string;
    remarks?: string;
  }) => {
    const targetBook = books.find((b) => b.id === data.bookId);
    if (!targetBook) {
      return { success: false, message: 'Book not found in inventory.' };
    }
    if (targetBook.availableQuantity <= 0) {
      return { success: false, message: `No available copies for "${targetBook.title}". All copies currently out.` };
    }

    // Deduct stock
    setBooks((prev) =>
      prev.map((b) => (b.id === data.bookId ? { ...b, availableQuantity: b.availableQuantity - 1 } : b))
    );

    const recordId = `brw-${Date.now()}`;
    const newRecord: BookBorrowRecord = {
      id: recordId,
      bookId: targetBook.id,
      bookTitle: targetBook.title,
      bookIsbn: targetBook.isbn,
      borrowerName: data.borrowerName,
      borrowerPhone: data.borrowerPhone,
      borrowerDept: data.borrowerDept,
      borrowerEmail: data.borrowerEmail,
      borrowDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: data.expectedReturnDate,
      status: 'Active',
      remarks: data.remarks,
      issuedBy: currentUser.name,
    };

    setBorrowRecords((prev) => [newRecord, ...prev]);
    addLog(
      'Book Borrow Issued',
      `Issued "${targetBook.title}" to ${data.borrowerName} (${data.borrowerDept}). Expected return: ${data.expectedReturnDate}`,
      'Lending'
    );

    return { success: true, message: `Successfully issued "${targetBook.title}" to ${data.borrowerName}. Stock updated.` };
  };

  const returnBookBorrow = (recordId: string, remarks?: string) => {
    const record = borrowRecords.find((r) => r.id === recordId);
    if (!record) return;

    const today = new Date().toISOString().split('T')[0];

    // Update record
    setBorrowRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'Returned',
              actualReturnDate: today,
              remarks: remarks ? `${r.remarks ? r.remarks + ' | ' : ''}Return note: ${remarks}` : r.remarks,
            }
          : r
      )
    );

    // Restore stock
    setBooks((prev) =>
      prev.map((b) => (b.id === record.bookId ? { ...b, availableQuantity: b.availableQuantity + 1 } : b))
    );

    addLog(
      'Book Returned',
      `Returned "${record.bookTitle}" from ${record.borrowerName}. Quantity restored.`,
      'Lending'
    );
  };

  const createBookSale = (data: {
    customerName: string;
    customerPhone?: string;
    unitName: string;
    items: Array<{ bookId: string; quantity: number; unitPrice?: number }>;
    discount: number;
    initialPayment: number;
    paymentDueDate?: string;
    remarks?: string;
  }) => {
    // Validate inventory availability
    const saleItems: SaleItem[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const book = books.find((b) => b.id === item.bookId);
      if (!book) {
        return { success: false, message: `Selected book ID ${item.bookId} not found.` };
      }
      if (book.totalQuantity < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${book.title}". Available total: ${book.totalQuantity}, requested: ${item.quantity}.`,
        };
      }

      const price = item.unitPrice !== undefined ? item.unitPrice : book.price;
      subtotal += price * item.quantity;
      saleItems.push({
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        unitPrice: price,
        quantity: item.quantity,
      });
    }

    const netAmount = Math.max(0, subtotal - data.discount);
    const paidAmount = Math.min(netAmount, Math.max(0, data.initialPayment));
    const remainingAmount = netAmount - paidAmount;
    const paymentStatus: 'Paid' | 'Payment Remaining' = remainingAmount <= 0 ? 'Paid' : 'Payment Remaining';

    // Deduct total and available quantity
    setBooks((prev) =>
      prev.map((b) => {
        const soldItem = data.items.find((i) => i.bookId === b.id);
        if (soldItem) {
          const newTotal = Math.max(0, b.totalQuantity - soldItem.quantity);
          const newAvailable = Math.max(0, b.availableQuantity - soldItem.quantity);
          return { ...b, totalQuantity: newTotal, availableQuantity: newAvailable };
        }
        return b;
      })
    );

    const saleId = `sale-${Date.now()}`;
    const invoiceNo = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const paymentHistory =
      paidAmount > 0
        ? [
            {
              id: `pay-${Date.now()}`,
              amount: paidAmount,
              date: today,
              receivedBy: currentUser.name,
              notes: 'Initial sale payment',
            },
          ]
        : [];

    const newSaleRecord: BookSaleRecord = {
      id: saleId,
      invoiceNo,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      unitName: data.unitName,
      items: saleItems,
      subtotal,
      discount: data.discount,
      netAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      saleDate: today,
      paymentDueDate: data.paymentDueDate,
      remarks: data.remarks,
      soldBy: currentUser.name,
      paymentHistory,
    };

    setSaleRecords((prev) => [newSaleRecord, ...prev]);

    addLog(
      'Book Sale Completed',
      `Invoice ${invoiceNo} generated for ${data.customerName} (${data.unitName}). Total: Rs. ${netAmount}, Status: ${paymentStatus}${
        remainingAmount > 0 ? ` (Remaining: Rs. ${remainingAmount})` : ''
      }`,
      'Sales'
    );

    return {
      success: true,
      invoiceNo,
      message: `Sale registered successfully with Invoice #${invoiceNo}.`,
    };
  };

  const collectPayment = (saleId: string, amount: number, notes?: string) => {
    const sale = saleRecords.find((s) => s.id === saleId);
    if (!sale) return;

    const addedPayment = Math.min(amount, sale.remainingAmount);
    const newPaidAmount = sale.paidAmount + addedPayment;
    const newRemainingAmount = Math.max(0, sale.netAmount - newPaidAmount);
    const newStatus: 'Paid' | 'Payment Remaining' = newRemainingAmount <= 0 ? 'Paid' : 'Payment Remaining';

    const newTransaction = {
      id: `pay-${Date.now()}`,
      amount: addedPayment,
      date: new Date().toISOString().split('T')[0],
      receivedBy: currentUser.name,
      notes: notes || 'Outstanding payment collection',
    };

    setSaleRecords((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              paidAmount: newPaidAmount,
              remainingAmount: newRemainingAmount,
              paymentStatus: newStatus,
              paymentHistory: [...s.paymentHistory, newTransaction],
            }
          : s
      )
    );

    addLog(
      'Payment Received',
      `Collected Rs. ${addedPayment} for Invoice ${sale.invoiceNo} (${sale.customerName}). Remaining balance: Rs. ${newRemainingAmount}`,
      'Sales'
    );
  };

  const addAsset = (assetData: Omit<OfficeAsset, 'id' | 'assetTag'> & { assetTag?: string }) => {
    const id = `ast-${Date.now()}`;
    const assetTag = assetData.assetTag || `AST-${Math.floor(100 + Math.random() * 900)}`;
    const newAsset: OfficeAsset = {
      ...assetData,
      id,
      assetTag,
      lastInspectedDate: new Date().toISOString().split('T')[0],
    };

    setAssets((prev) => [newAsset, ...prev]);
    addLog('Office Asset Added', `Added asset "${newAsset.name}" [${assetTag}] (${newAsset.category}, ${newAsset.status})`, 'Assets');
  };

  const updateAsset = (updatedAsset: OfficeAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    addLog('Office Asset Updated', `Updated asset "${updatedAsset.name}" [${updatedAsset.assetTag}]`, 'Assets');
  };

  const deleteAsset = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (target) {
      addLog('Office Asset Removed', `Removed asset "${target.name}" [${target.assetTag}]`, 'Assets');
    }
  };

  const updateAssetStatus = (assetId: string, status: AssetStatus, remarks?: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              status,
              remarks: remarks ? `${remarks}` : a.remarks,
              lastInspectedDate: new Date().toISOString().split('T')[0],
            }
          : a
      )
    );

    addLog(
      'Asset Status Changed',
      `Changed status of "${target.name}" [${target.assetTag}] to ${status}`,
      'Assets'
    );
  };

  const assignAsset = (assetId: string, personName: string, deptName: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              issuedToPerson: personName,
              issuedToDept: deptName,
            }
          : a
      )
    );

    addLog('Asset Issued', `Assigned asset "${target.name}" [${target.assetTag}] to ${personName} (${deptName})`, 'Assets');
  };

  const resetAllData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setBooks(INITIAL_BOOKS);
    setBorrowRecords(INITIAL_BORROW_RECORDS);
    setSaleRecords(INITIAL_SALE_RECORDS);
    setAssets(INITIAL_OFFICE_ASSETS);
    setLogs(INITIAL_LOGS);
    setCurrentUser(INITIAL_USERS[0]);
    addLog('Data Reset', 'Reset system inventory state to initial seed values', 'Auth');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers: INITIAL_USERS,
        switchUserRole,
        books,
        addBook,
        updateBook,
        deleteBook,
        borrowRecords,
        issueBookBorrow,
        returnBookBorrow,
        saleRecords,
        createBookSale,
        collectPayment,
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        updateAssetStatus,
        assignAsset,
        logs,
        addLog,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
