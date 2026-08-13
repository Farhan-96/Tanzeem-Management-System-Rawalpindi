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
import { api } from '../api/client';

const AUTH_SESSION_KEY = 'tanzeem_auth_session';

interface AppContextType {
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  isAuthenticated: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  hasRegisteredUsers: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
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
  }) => { success: boolean; invoiceNo?: string; message: string; saleRecord?: BookSaleRecord };
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

function persistError(err: unknown, label: string) {
  console.error(`[DB] ${label}:`, err);
}

function saveSession(user: UserProfile) {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function loadSession(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [hasRegisteredUsers, setHasRegisteredUsers] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BookBorrowRecord[]>([]);
  const [saleRecords, setSaleRecords] = useState<BookSaleRecord[]>([]);
  const [assets, setAssets] = useState<OfficeAsset[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const loadAppData = async () => {
    setDataLoading(true);
    try {
      const data = await api.getData();
      setBooks((data.books || []) as Book[]);
      setBorrowRecords((data.borrowRecords || []) as BookBorrowRecord[]);
      setSaleRecords((data.saleRecords || []) as BookSaleRecord[]);
      setAssets((data.assets || []) as OfficeAsset[]);
      setLogs((data.logs || []) as ActivityLog[]);
    } catch (err) {
      persistError(err, 'loadAppData');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const statusRes = await fetch('/api/auth/status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          setHasRegisteredUsers(Boolean(status.hasUsers));
        }
      } catch {
        setHasRegisteredUsers(false);
      }

      const sessionUser = loadSession();
      if (sessionUser) {
        setCurrentUser(sessionUser);
        setAvailableUsers([sessionUser]);
        setHasRegisteredUsers(true);
        await loadAppData();
      }
      setAuthLoading(false);
    };

    boot();
  }, []);

  const addLog = (
    action: string,
    details: string,
    module: 'Books' | 'Lending' | 'Sales' | 'Assets' | 'Auth',
    actor?: UserProfile | null
  ) => {
    const user = actor ?? currentUser;
    if (!user) return;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      userName: user.name,
      userRole: user.role,
      action,
      details,
      module,
    };
    setLogs((prev) => [newLog, ...prev]);
    api.saveLog(newLog).catch((err) => persistError(err, 'saveLog'));
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed.' };
      }
      setCurrentUser(data.user);
      setAvailableUsers([data.user]);
      setHasRegisteredUsers(true);
      saveSession(data.user);
      await loadAppData();
      addLog('System Sign In', 'Logged into Central Administrative Dashboard', 'Auth', data.user);
      return { success: true, message: 'Signed in successfully.' };
    } catch {
      return {
        success: false,
        message: 'Cannot reach server. Start the API with npm run server.',
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        return { success: false, message: payload.message || 'Registration failed.' };
      }
      setCurrentUser(payload.user);
      setAvailableUsers([payload.user]);
      setHasRegisteredUsers(true);
      saveSession(payload.user);
      await loadAppData();
      addLog('Account Registered', `Created account for ${payload.user.email}`, 'Auth', payload.user);
      return { success: true, message: 'Account created successfully.' };
    } catch {
      return {
        success: false,
        message: 'Cannot reach server. Start the API with npm run server.',
      };
    }
  };

  const logout = () => {
    if (currentUser) {
      addLog('System Sign Out', 'Signed out of the management system', 'Auth');
    }
    clearSession();
    setCurrentUser(null);
    setBooks([]);
    setBorrowRecords([]);
    setSaleRecords([]);
    setAssets([]);
    setLogs([]);
  };

  const switchUserRole = (role: UserRole) => {
    if (!currentUser) return;
    const next = { ...currentUser, role };
    setCurrentUser(next);
    saveSession(next);
    addLog('Role Switched', `Switched active profile role to ${role}`, 'Auth', next);
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
    api.saveBook(formattedBook).catch((err) => persistError(err, 'saveBook'));
    addLog(
      'New Book Added',
      `Added "${formattedBook.title}" by ${formattedBook.author} (${formattedBook.totalQuantity} copies, ISBN: ${formattedBook.isbn})`,
      'Books'
    );
  };

  const updateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    api.updateBook(updatedBook).catch((err) => persistError(err, 'updateBook'));
    addLog('Book Updated', `Updated details for "${updatedBook.title}"`, 'Books');
  };

  const deleteBook = (bookId: string) => {
    const target = books.find((b) => b.id === bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    api.deleteBook(bookId).catch((err) => persistError(err, 'deleteBook'));
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
    if (!currentUser) {
      return { success: false, message: 'Please sign in first.' };
    }
    const targetBook = books.find((b) => b.id === data.bookId);
    if (!targetBook) {
      return { success: false, message: 'Book not found in inventory.' };
    }
    if (targetBook.availableQuantity <= 0) {
      return { success: false, message: `No available copies for "${targetBook.title}". All copies currently out.` };
    }

    const updatedBook: Book = {
      ...targetBook,
      availableQuantity: targetBook.availableQuantity - 1,
    };

    const newRecord: BookBorrowRecord = {
      id: `brw-${Date.now()}`,
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

    setBooks((prev) => prev.map((b) => (b.id === data.bookId ? updatedBook : b)));
    setBorrowRecords((prev) => [newRecord, ...prev]);
    api.updateBook(updatedBook).catch((err) => persistError(err, 'updateBook'));
    api.saveBorrow(newRecord).catch((err) => persistError(err, 'saveBorrow'));
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
    const updatedRecord: BookBorrowRecord = {
      ...record,
      status: 'Returned',
      actualReturnDate: today,
      remarks: remarks ? `${record.remarks ? record.remarks + ' | ' : ''}Return note: ${remarks}` : record.remarks,
    };

    const book = books.find((b) => b.id === record.bookId);
    const updatedBook = book
      ? { ...book, availableQuantity: book.availableQuantity + 1 }
      : null;

    setBorrowRecords((prev) => prev.map((r) => (r.id === recordId ? updatedRecord : r)));
    if (updatedBook) {
      setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
      api.updateBook(updatedBook).catch((err) => persistError(err, 'updateBook'));
    }
    api.updateBorrow(updatedRecord).catch((err) => persistError(err, 'updateBorrow'));
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
    if (!currentUser) {
      return { success: false, message: 'Please sign in first.' };
    }

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

    const updatedBooks = books.map((b) => {
      const soldItem = data.items.find((i) => i.bookId === b.id);
      if (soldItem) {
        const newTotal = Math.max(0, b.totalQuantity - soldItem.quantity);
        const newAvailable = Math.max(0, b.availableQuantity - soldItem.quantity);
        return { ...b, totalQuantity: newTotal, availableQuantity: newAvailable };
      }
      return b;
    });
    const changedBooks = updatedBooks.filter((b) => {
      const soldItem = data.items.find((i) => i.bookId === b.id);
      return Boolean(soldItem);
    });

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

    setBooks(updatedBooks);
    setSaleRecords((prev) => [newSaleRecord, ...prev]);
    api.saveBooksBatch(changedBooks).catch((err) => persistError(err, 'saveBooksBatch'));
    api.saveSale(newSaleRecord).catch((err) => persistError(err, 'saveSale'));
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
      saleRecord: newSaleRecord,
    };
  };

  const collectPayment = (saleId: string, amount: number, notes?: string) => {
    if (!currentUser) return;
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

    const updatedSale: BookSaleRecord = {
      ...sale,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      paymentStatus: newStatus,
      paymentHistory: [...sale.paymentHistory, newTransaction],
    };

    setSaleRecords((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));
    api.updateSale(updatedSale).catch((err) => persistError(err, 'updateSale'));
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
    api.saveAsset(newAsset).catch((err) => persistError(err, 'saveAsset'));
    addLog('Office Asset Added', `Added asset "${newAsset.name}" [${assetTag}] (${newAsset.category}, ${newAsset.status})`, 'Assets');
  };

  const updateAsset = (updatedAsset: OfficeAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    api.updateAsset(updatedAsset).catch((err) => persistError(err, 'updateAsset'));
    addLog('Office Asset Updated', `Updated asset "${updatedAsset.name}" [${updatedAsset.assetTag}]`, 'Assets');
  };

  const deleteAsset = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    api.deleteAsset(assetId).catch((err) => persistError(err, 'deleteAsset'));
    if (target) {
      addLog('Office Asset Removed', `Removed asset "${target.name}" [${target.assetTag}]`, 'Assets');
    }
  };

  const updateAssetStatus = (assetId: string, status: AssetStatus, remarks?: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: OfficeAsset = {
      ...target,
      status,
      remarks: remarks ? `${remarks}` : target.remarks,
      lastInspectedDate: new Date().toISOString().split('T')[0],
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    api.updateAsset(updated).catch((err) => persistError(err, 'updateAsset'));
    addLog(
      'Asset Status Changed',
      `Changed status of "${target.name}" [${target.assetTag}] to ${status}`,
      'Assets'
    );
  };

  const assignAsset = (assetId: string, personName: string, deptName: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: OfficeAsset = {
      ...target,
      issuedToPerson: personName,
      issuedToDept: deptName,
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    api.updateAsset(updated).catch((err) => persistError(err, 'updateAsset'));
    addLog('Asset Issued', `Assigned asset "${target.name}" [${target.assetTag}] to ${personName} (${deptName})`, 'Assets');
  };

  const resetAllData = () => {
    api
      .resetData()
      .then(() => {
        setBooks([]);
        setBorrowRecords([]);
        setSaleRecords([]);
        setAssets([]);
        setLogs([]);
        addLog('Data Reset', 'Cleared all inventory data from database', 'Auth');
      })
      .catch((err) => persistError(err, 'resetData'));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers,
        isAuthenticated: Boolean(currentUser),
        authLoading,
        dataLoading,
        hasRegisteredUsers,
        login,
        register,
        logout,
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
