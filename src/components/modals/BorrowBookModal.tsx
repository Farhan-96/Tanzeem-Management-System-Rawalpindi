import React, { useState, useEffect } from 'react';
import { RotateCcw, X, BookOpen, User, Phone, Calendar, Building, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book } from '../../types';

interface BorrowBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBook?: Book | null;
}

export const BorrowBookModal: React.FC<BorrowBookModalProps> = ({ isOpen, onClose, preselectedBook }) => {
  const { books, issueBookBorrow } = useApp();

  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerDept, setBorrowerDept] = useState('Research Wing');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerEmail('');
    setRemarks('');
    setErrorMessage('');
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Calculate default 14-day expected return date
  useEffect(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setExpectedReturnDate(futureDate.toISOString().split('T')[0]);
  }, [isOpen]);

  useEffect(() => {
    if (preselectedBook) {
      setSelectedBookId(preselectedBook.id);
    } else if (books.length > 0 && !selectedBookId) {
      const available = books.find((b) => b.availableQuantity > 0);
      if (available) setSelectedBookId(available.id);
    }
  }, [preselectedBook, books, isOpen]);

  if (!isOpen) return null;

  const availableBooks = books.filter((b) => b.availableQuantity > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedBookId || !borrowerName || !borrowerPhone || !expectedReturnDate) {
      setErrorMessage('Please fill in all required borrower and book details.');
      return;
    }

    const res = issueBookBorrow({
      bookId: selectedBookId,
      borrowerName,
      borrowerPhone,
      borrowerDept,
      borrowerEmail,
      expectedReturnDate,
      remarks,
    });

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">Issue Book Borrow (Purpose 1)</h3>
          </div>
          <button
            type="button"
            id="close-borrow-modal-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition-colors rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {books.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No books available to borrow</p>
            <p className="text-xs text-slate-500">Add books to the catalog first, then issue a loan.</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
            >
              Close
            </button>
          </div>
        ) : availableBooks.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No copies currently available</p>
            <p className="text-xs text-slate-500">All books are checked out. Wait for a return or add more stock.</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Book */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Book to Borrow <span className="text-rose-500">*</span>
            </label>
            <select
              id="borrow-book-select"
              required
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="">-- Choose Book from Available Stock --</option>
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (By {b.author}) &bull; Available: {b.availableQuantity} copies
                </option>
              ))}
            </select>
          </div>

          {/* Borrower Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Borrower Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="borrower-name-input"
                type="text"
                required
                placeholder="e.g. Usman Ghani"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                id="borrower-phone-input"
                type="text"
                required
                placeholder="+92 300 1234567"
                value={borrowerPhone}
                onChange={(e) => setBorrowerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Department / Unit & Expected Return Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Borrower Department / Wing</label>
              <input
                type="text"
                placeholder="e.g. Research Wing, Youth Section"
                value={borrowerDept}
                onChange={(e) => setBorrowerDept(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Return Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="expected-return-date-input"
                type="date"
                required
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Note</label>
            <input
              type="text"
              placeholder="e.g. Borrowed for sermon research project"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-borrow-modal-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-issue-borrow-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
            >
              Issue Book & Deduct Stock
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
