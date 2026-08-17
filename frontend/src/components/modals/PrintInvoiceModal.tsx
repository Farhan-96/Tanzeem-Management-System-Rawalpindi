import React from 'react';
import { Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { BookSaleRecord } from '../../types';
import { Modal, ModalHeader, ModalBody } from './Modal';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleRecord: BookSaleRecord | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ isOpen, onClose, saleRecord }) => {
  if (!isOpen || !saleRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = saleRecord.paymentStatus === 'Paid';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" printFriendly>
      <ModalHeader onClose={onClose} closeId="close-print-invoice-modal">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 print:hidden">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800">Sales Invoice / Receipt</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Use Print → Save as PDF to give this invoice to the customer.
            </p>
          </div>
          <button
            type="button"
            id="trigger-print-btn"
            onClick={handlePrint}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Printable Area */}
        <div id="printable-invoice" className="p-6 border border-slate-200 rounded-2xl bg-white space-y-6 text-xs text-slate-800 print:border-0 print:p-0 print:rounded-none">
          {/* Institutional Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-900 text-amber-300 font-serif font-bold text-xl flex items-center justify-center mb-2">
              ت
            </div>
            <h2 className="text-lg font-bold text-emerald-950 font-serif">Tanzeem Office & Library System</h2>
            <p className="text-[11px] text-slate-500">Official Sales Voucher & Receipt &bull; (تنظیمِ اسلامی)</p>
          </div>

          {/* Invoice Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Billed To</span>
              <div className="font-bold text-slate-900 text-sm">{saleRecord.customerName}</div>
              <div className="text-slate-600 font-medium">{saleRecord.unitName}</div>
              {saleRecord.customerPhone && <div className="text-slate-500 font-mono">{saleRecord.customerPhone}</div>}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Invoice Details</span>
              <div className="font-mono font-extrabold text-slate-900 text-sm">#{saleRecord.invoiceNo}</div>
              <div className="text-slate-600">Date: {saleRecord.saleDate}</div>
              {saleRecord.paymentDueDate && !isPaid && (
                <div className="text-rose-700 font-semibold">Payment Due: {saleRecord.paymentDueDate}</div>
              )}
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  Status: {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[320px] text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Item Description</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saleRecord.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium text-slate-800">
                      <div>{it.bookTitle}</div>
                      {it.isbn && <div className="text-[10px] text-slate-400 font-mono">ISBN: {it.isbn}</div>}
                    </td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">Rs. {it.unitPrice.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      Rs. {(it.unitPrice * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">Rs. {saleRecord.subtotal.toLocaleString()}</span>
              </div>
              {saleRecord.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-Rs. {saleRecord.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Net Total:</span>
                <span className="text-sm font-mono">Rs. {saleRecord.netAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Amount Paid:</span>
                <span className="font-mono">Rs. {saleRecord.paidAmount.toLocaleString()}</span>
              </div>
              {saleRecord.remainingAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className="font-mono">Rs. {saleRecord.remainingAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment history */}
          {saleRecord.paymentHistory.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Payment History
              </div>
              <div className="divide-y divide-slate-100">
                {saleRecord.paymentHistory.map((p) => (
                  <div key={p.id} className="px-3 py-2 flex justify-between gap-3">
                    <div>
                      <span className="font-semibold text-emerald-800">Rs. {p.amount.toLocaleString()}</span>
                      <span className="text-slate-500"> &bull; {p.receivedBy}</span>
                      {p.notes && <div className="text-[10px] text-slate-400">{p.notes}</div>}
                    </div>
                    <span className="text-slate-400 shrink-0">{p.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(saleRecord.remarks || saleRecord.soldBy) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
              {saleRecord.soldBy && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Sold By</span>
                  {saleRecord.soldBy}
                </div>
              )}
              {saleRecord.remarks && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Remarks</span>
                  {saleRecord.remarks}
                </div>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Thank you for your cooperation & support with Tanzeem Library & Records. &bull; Computer Generated Invoice.
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};
