import React, { useState } from 'react';
import {
  PackagePlus,
  Search,
  Plus,
  User,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookArrivalRecord, ArrivalPaymentStatus, StoredAttachment } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './modals/Modal';
import { AttachmentPicker, AttachmentLinks } from './AttachmentPicker';

interface BookArrivalsViewProps {
  openRecordArrivalModal: () => void;
}

export const BookArrivalsView: React.FC<BookArrivalsViewProps> = ({ openRecordArrivalModal }) => {
  const { arrivalRecords, collectArrivalPayment, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | ArrivalPaymentStatus>('All');
  const [detailRecord, setDetailRecord] = useState<BookArrivalRecord | null>(null);
  const [payRecord, setPayRecord] = useState<BookArrivalRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentFiles, setPaymentFiles] = useState<StoredAttachment[]>([]);

  const filteredRecords = arrivalRecords.filter((record) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      record.bookTitle.toLowerCase().includes(q) ||
      record.broughtBy.toLowerCase().includes(q) ||
      record.bookIsbn.toLowerCase().includes(q) ||
      (record.remarks || '').toLowerCase().includes(q) ||
      (record.invoiceNo || '').toLowerCase().includes(q);

    const matchesStatus = paymentFilter === 'All' || record.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus;
  });

  const unpaidCount = arrivalRecords.filter((r) => r.paymentStatus !== 'Paid').length;
  const unpaidAmount = arrivalRecords.reduce((sum, r) => sum + r.remainingAmount, 0);
  const totalCopies = arrivalRecords.reduce((sum, r) => sum + r.quantity, 0);

  const statusClass = (status: ArrivalPaymentStatus) => {
    if (status === 'Paid') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Partial') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  const closePayModal = () => {
    setPayRecord(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentFiles([]);
  };

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRecord || paymentAmount === '' || Number(paymentAmount) <= 0) return;
    collectArrivalPayment(payRecord.id, Number(paymentAmount), paymentNotes, paymentFiles);
    closePayModal();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Book Arrivals</h2>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {arrivalRecords.length} Arrivals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Keep a permanent register of when books arrived, how many copies came, who brought them, payment status, and remarks.
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-600">
            <span>
              Copies received: <strong className="text-slate-900">{totalCopies}</strong>
            </span>
            <span>
              Unpaid shipments: <strong className="text-rose-700">{unpaidCount}</strong>
            </span>
            <span>
              Amount still due: <strong className="text-rose-700">Rs. {unpaidAmount.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        <button
          id="open-record-arrival-btn"
          onClick={openRecordArrivalModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Record Arrival</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="arrivals-search-input"
            type="text"
            placeholder="Search book title, who brought, ISBN, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
          {(['All', 'Paid', 'Unpaid', 'Partial'] as const).map((st) => (
            <button
              key={st}
              id={`filter-arrival-status-${st.toLowerCase()}`}
              onClick={() => setPaymentFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                paymentFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Arrival Date</th>
                <th className="p-3.5">Book</th>
                <th className="p-3.5">Qty</th>
                <th className="p-3.5">Brought By</th>
                <th className="p-3.5">Cost / Paid</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Remarks</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 whitespace-nowrap font-mono text-slate-600">{record.arrivalDate}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{record.bookTitle}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{record.bookIsbn}</div>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-800">{record.quantity}</td>
                  <td className="p-3.5 font-medium text-slate-800">{record.broughtBy}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">Rs. {record.totalCost.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">
                      Paid {record.paidAmount.toLocaleString()}
                      {record.remainingAmount > 0 ? ` · Due ${record.remainingAmount.toLocaleString()}` : ''}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusClass(record.paymentStatus)}`}>
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 max-w-[160px]">
                    <div className="truncate">{record.remarks || '—'}</div>
                    {record.invoiceNo && (
                      <div className="text-[10px] font-mono text-slate-400">{record.invoiceNo}</div>
                    )}
                    <AttachmentLinks files={record.attachments} />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`view-arrival-${record.id}`}
                        onClick={() => setDetailRecord(record)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                      >
                        View
                      </button>
                      {record.paymentStatus !== 'Paid' && (
                        <button
                          id={`pay-arrival-${record.id}`}
                          onClick={() => {
                            setPayRecord(record);
                            setPaymentAmount(record.remainingAmount);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    {arrivalRecords.length === 0 ? (
                      <div>
                        <PackagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p>No arrival records yet. Record when new books come in.</p>
                        <button
                          type="button"
                          onClick={openRecordArrivalModal}
                          className="mt-2 text-emerald-700 font-semibold hover:underline"
                        >
                          + Record Book Arrival
                        </button>
                      </div>
                    ) : (
                      'No arrival records match the current filters.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailRecord && (
        <Modal isOpen onClose={() => setDetailRecord(null)} maxWidth="max-w-lg">
          <ModalHeader onClose={() => setDetailRecord(null)} closeId="close-arrival-detail-modal">
            <div className="flex items-center space-x-2 min-w-0">
              <BookOpen className="w-5 h-5 text-emerald-700 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Arrival Record</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={Calendar} label="Arrival Date" value={detailRecord.arrivalDate} />
              <DetailRow icon={User} label="Brought By" value={detailRecord.broughtBy} />
              <DetailRow icon={BookOpen} label="Book" value={detailRecord.bookTitle} />
              <DetailRow
                icon={FileText}
                label="Invoice No"
                value={detailRecord.invoiceNo || 'Not recorded'}
              />
              <DetailRow icon={PackagePlus} label="Quantity" value={`${detailRecord.quantity} copies`} />
              <DetailRow icon={DollarSign} label="Total Cost" value={`Rs. ${detailRecord.totalCost.toLocaleString()}`} />
              <DetailRow
                icon={detailRecord.paymentStatus === 'Paid' ? CheckCircle2 : AlertCircle}
                label="Payment"
                value={`${detailRecord.paymentStatus} · Paid Rs. ${detailRecord.paidAmount.toLocaleString()}`}
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Remarks</span>
              </div>
              <p className="text-slate-800">{detailRecord.remarks || 'No remarks recorded.'}</p>
              <div className="mt-2">
                <AttachmentLinks files={detailRecord.attachments} />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Recorded by {detailRecord.recordedBy} on {detailRecord.recordedAt} · ISBN {detailRecord.bookIsbn}
            </div>
            {detailRecord.paymentHistory.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Payment History</h4>
                <div className="space-y-1.5">
                  {detailRecord.paymentHistory.map((pay) => (
                    <div key={pay.id} className="bg-emerald-50/70 border border-emerald-100 rounded-lg px-3 py-2">
                      <div className="flex justify-between">
                        <span>
                          {pay.date} · {pay.receivedBy}
                          {pay.notes ? ` · ${pay.notes}` : ''}
                        </span>
                        <span className="font-bold text-emerald-800">Rs. {pay.amount.toLocaleString()}</span>
                      </div>
                      <AttachmentLinks files={pay.attachments} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={() => setDetailRecord(null)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Close
            </button>
            {detailRecord.paymentStatus !== 'Paid' && (
              <button
                type="button"
                onClick={() => {
                  setPayRecord(detailRecord);
                  setPaymentAmount(detailRecord.remainingAmount);
                  setDetailRecord(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl"
              >
                Record Payment
              </button>
            )}
          </ModalFooter>
        </Modal>
      )}

      {payRecord && (
        <Modal isOpen onClose={closePayModal} maxWidth="max-w-md">
          <ModalHeader onClose={closePayModal} closeId="close-arrival-pay-modal">
            <div className="flex items-center space-x-2 min-w-0">
              <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Record Arrival Payment</h3>
            </div>
          </ModalHeader>
          <form onSubmit={handleCollectPayment} className="flex flex-col flex-1 min-h-0 text-xs">
            <ModalBody className="space-y-4">
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-semibold">Book</span>
                  <span className="font-bold text-slate-900 text-right">{payRecord.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Brought by</span>
                  <span className="font-medium text-slate-800">{payRecord.broughtBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total cost</span>
                  <span className="font-bold">Rs. {payRecord.totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-extrabold text-sm pt-1 border-t border-amber-200">
                  <span>Balance due</span>
                  <span className="text-rose-700">Rs. {payRecord.remainingAmount.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Paying Now (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={payRecord.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via bank transfer"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <AttachmentPicker
                label="Payment proof (PDF or image)"
                hint="Attach the paid slip or receipt for this payment."
                kind="payment-proof"
                value={paymentFiles}
                onChange={setPaymentFiles}
                uploadedBy={currentUser?.name}
              />
            </ModalBody>
            <ModalFooter>
              <button
                type="button"
                onClick={closePayModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
              >
                Save Payment
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-0.5">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <div className="font-bold text-slate-900 break-words">{value}</div>
    </div>
  );
}
