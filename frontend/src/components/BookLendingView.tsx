import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  User,
  Phone,
  Calendar,
  Building,
  BookOpen,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './modals/Modal';

interface BookLendingViewProps {
  openBorrowModal: () => void;
}

export const BookLendingView: React.FC<BookLendingViewProps> = ({ openBorrowModal }) => {
  const { borrowRecords, returnBookBorrow } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Overdue' | 'Returned'>('All');
  const [returnNoteModal, setReturnNoteModal] = useState<string | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  const filteredRecords = borrowRecords.filter((record) => {
    const matchesSearch =
      record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.borrowerDept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.borrowerPhone.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleReturnConfirm = () => {
    if (returnNoteModal) {
      returnBookBorrow(returnNoteModal, remarksInput);
      setReturnNoteModal(null);
      setRemarksInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Issued Books</h2>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
              {borrowRecords.filter((r) => r.status === 'Active' || r.status === 'Overdue').length} Currently Issued
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track books issued for temporary reading. Automatically reduces stock upon issue and restores stock upon return.
          </p>
        </div>

        <button
          id="issue-new-borrow-button"
          onClick={openBorrowModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Lend Book</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="lending-search-input"
            type="text"
            placeholder="Search borrower name, book title, department, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
          {(['All', 'Active', 'Overdue', 'Returned'] as const).map((st) => (
            <button
              key={st}
              id={`filter-lending-status-${st.toLowerCase()}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Borrow Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Issued To</th>
                <th className="p-3.5">Book Details</th>
                <th className="p-3.5">Issued On</th>
                <th className="p-3.5">Expected Return</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Issued By</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const isOverdue = record.status === 'Overdue';
                const isReturned = record.status === 'Returned';

                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Borrower */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{record.borrowerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{record.borrowerDept}</span>
                        <span>&bull;</span>
                        <span>{record.borrowerPhone}</span>
                      </div>
                    </td>

                    {/* Book */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="line-clamp-1">{record.bookTitle}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{record.bookIsbn}</div>
                    </td>

                    {/* Take Date */}
                    <td className="p-3.5 text-slate-600 font-medium">{record.borrowDate}</td>

                    {/* Expected Return Date */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{record.expectedReturnDate}</div>
                      {record.actualReturnDate && (
                        <div className="text-[10px] text-emerald-700">Returned on: {record.actualReturnDate}</div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isReturned
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isReturned ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isOverdue ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{record.status}</span>
                      </span>
                    </td>

                    {/* Issued By */}
                    <td className="p-3.5 text-slate-500">{record.issuedBy}</td>

                    {/* Action Button */}
                    <td className="p-3.5 text-right">
                      {!isReturned ? (
                        <button
                          id={`return-book-btn-${record.id}`}
                          onClick={() => setReturnNoteModal(record.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs"
                        >
                          Mark Returned
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Returned</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    {borrowRecords.length === 0 ? (
                      <div className="space-y-2">
                        <p>No issued books yet.</p>
                        <button
                          type="button"
                          onClick={openBorrowModal}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                        >
                          + Lend First Book
                        </button>
                      </div>
                    ) : (
                      'No issued books match the current filters.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {returnNoteModal && (
        <Modal isOpen onClose={() => setReturnNoteModal(null)} maxWidth="max-w-md">
          <ModalHeader onClose={() => setReturnNoteModal(null)}>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Confirm Book Return</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-xs text-slate-600 mb-4">
              Marking this book as returned will automatically increase the available inventory stock by 1 copy.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Return Remarks / Condition Notes (Optional)</label>
              <textarea
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="e.g. Returned in clean condition, spine intact..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                rows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setReturnNoteModal(null)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-600 font-medium text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              id="confirm-return-book-btn"
              onClick={handleReturnConfirm}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800"
            >
              Confirm Return
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
