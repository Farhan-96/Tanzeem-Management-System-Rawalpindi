import React, { useEffect } from 'react';
import { Printer, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { BookSaleRecord } from '../../types';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleRecord: BookSaleRecord | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ isOpen, onClose, saleRecord }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !saleRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = saleRecord.paymentStatus === 'Paid';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
          <h3 className="text-sm font-bold text-slate-800">Print Official Sales Receipt / Invoice</h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="trigger-print-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              id="close-print-invoice-modal"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition-colors rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-invoice" className="p-6 border border-slate-200 rounded-2xl bg-white space-y-6 text-xs text-slate-800">
          {/* Institutional Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-900 text-amber-300 font-serif font-bold text-xl flex items-center justify-center mb-2">
              ت
            </div>
            <h2 className="text-lg font-bold text-emerald-950 font-serif">Tanzeem Office & Library System</h2>
            <p className="text-[11px] text-slate-500">Official Sales Voucher & Receipt &bull; (تنظیمِ اسلامی)</p>
          </div>

          {/* Invoice Info Bar */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Billed To</span>
              <div className="font-bold text-slate-900 text-sm">{saleRecord.customerName}</div>
              <div className="text-slate-600 font-medium">{saleRecord.unitName}</div>
              {saleRecord.customerPhone && <div className="text-slate-500 font-mono">{saleRecord.customerPhone}</div>}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Invoice Details</span>
              <div className="font-mono font-extrabold text-slate-900 text-sm">#{saleRecord.invoiceNo}</div>
              <div className="text-slate-600">Date: {saleRecord.saleDate}</div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  Status: {saleRecord.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
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
                    <td className="p-2 font-medium text-slate-800">{it.bookTitle}</td>
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
            <div className="w-64 space-y-1.5 text-xs">
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

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Thank you for your cooperation & support with Tanzeem Library & Records. &bull; Computer Generated Invoice.
          </div>
        </div>
      </div>
    </div>
  );
};
