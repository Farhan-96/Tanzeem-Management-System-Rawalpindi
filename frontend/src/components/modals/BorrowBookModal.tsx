import React, { useState, useEffect } from 'react';
import { RotateCcw, BookOpen, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book } from '../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { BookNameSearch } from '../BookNameSearch';

interface BorrowBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBook?: Book | null;
}

export const BorrowBookModal: React.FC<BorrowBookModalProps> = ({ isOpen, onClose, preselectedBook }) => {
  const { books, borrowRecords, issueBookBorrow } = useApp();

  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerDept, setBorrowerDept] = useState('Research Wing');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);

  const handleClose = () => {
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerEmail('');
    setRemarks('');
    setErrorMessage('');
    setShowPersonSuggestions(false);
    onClose();
  };

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
  const pastPeople = Array.from(
    new Map(
      borrowRecords.map((record) => [
        record.borrowerName.trim().toLowerCase(),
        {
          name: record.borrowerName,
          phone: record.borrowerPhone,
          dept: record.borrowerDept,
        },
      ])
    ).values()
  );
  const personQuery = borrowerName.trim().toLowerCase();
  const matchedPeople = pastPeople.filter((person) => {
    if (!personQuery) return true;
    return (
      person.name.toLowerCase().includes(personQuery) ||
      person.phone.includes(personQuery) ||
      person.dept.toLowerCase().includes(personQuery)
    );
  });

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
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <ModalHeader onClose={handleClose} closeId="close-borrow-modal-btn">
        <div className="flex items-center space-x-2 min-w-0">
          <RotateCcw className="w-5 h-5 text-emerald-700 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Lend a Book</h3>
        </div>
      </ModalHeader>

      {errorMessage && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {books.length === 0 ? (
        <ModalBody>
          <div className="text-center space-y-3 py-4">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No books available to lend</p>
            <p className="text-xs text-slate-500">Add books to the catalog first, then lend a copy.</p>
          </div>
        </ModalBody>
      ) : availableBooks.length === 0 ? (
        <ModalBody>
          <div className="text-center space-y-3 py-4">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No copies currently available</p>
            <p className="text-xs text-slate-500">All books are checked out. Wait for a return or add more stock.</p>
          </div>
        </ModalBody>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
          <ModalBody className="space-y-4">
          {/* Select Book */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Book <span className="text-rose-500">*</span>
            </label>
            <BookNameSearch
              books={availableBooks}
              selectedBookId={selectedBookId}
              getStock={(book) => book.availableQuantity}
              placeholder="Type book name to search..."
              onSelect={(book) => setSelectedBookId(book.id)}
            />
          </div>

          {/* Borrower Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="block font-semibold text-slate-700 mb-1">
                Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="borrower-name-input"
                type="text"
                required
                autoComplete="off"
                placeholder="Type to search or enter a name"
                value={borrowerName}
                onFocus={() => setShowPersonSuggestions(true)}
                onChange={(e) => {
                  setBorrowerName(e.target.value);
                  setShowPersonSuggestions(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowPersonSuggestions(false), 150);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {showPersonSuggestions && matchedPeople.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {matchedPeople.slice(0, 12).map((person) => (
                    <button
                      key={`${person.name}-${person.phone}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setBorrowerName(person.name);
                        setBorrowerPhone(person.phone);
                        if (person.dept) setBorrowerDept(person.dept);
                        setShowPersonSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-semibold text-slate-800">{person.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {person.dept}
                        {person.phone ? ` · ${person.phone}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
              <label className="block font-semibold text-slate-700 mb-1">Department / Unit</label>
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

          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              id="cancel-borrow-modal-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-issue-borrow-btn"
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
            >
              Lend Book
            </button>
          </ModalFooter>
        </form>
      )}

      {(books.length === 0 || availableBooks.length === 0) && (
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
          >
            Close
          </button>
        </ModalFooter>
      )}
    </Modal>
  );
};
