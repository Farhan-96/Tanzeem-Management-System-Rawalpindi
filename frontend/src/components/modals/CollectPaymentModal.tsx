import React, { useState, useEffect } from 'react';
import { DollarSign, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookSaleRecord } from '../../types';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleRecord: BookSaleRecord | null;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  saleRecord,
}) => {
  const { collectPayment } = useApp();
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setPaymentAmount('');
    setNotes('');
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

  if (!isOpen || !saleRecord) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount === '' || Number(paymentAmount) <= 0) return;

    collectPayment(saleRecord.id, Number(paymentAmount), notes || 'Dues collection');
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">Collect Outstanding Dues</h3>
          </div>
          <button
            type="button"
            id="close-collect-pay-modal"
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

        {/* Invoice Summary Box */}
        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Invoice No:</span>
            <span className="font-mono font-bold text-slate-900">{saleRecord.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Customer / Unit:</span>
            <span className="font-bold text-slate-900">
              {saleRecord.customerName} ({saleRecord.unitName})
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-amber-200/80">
            <span className="text-slate-500 font-semibold">Total Invoice Amount:</span>
            <span className="font-bold text-slate-800">Rs. {saleRecord.netAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-800">
            <span className="font-semibold">Paid So Far:</span>
            <span className="font-bold">Rs. {saleRecord.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-amber-900 font-extrabold text-sm pt-1 border-t border-amber-200">
            <span>Current Balance Due:</span>
            <span className="text-rose-700">Rs. {saleRecord.remainingAmount.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Amount Collecting Now (Rs.) <span className="text-rose-500">*</span>
            </label>
            <input
              id="collect-payment-amount-input"
              type="number"
              required
              min={1}
              max={saleRecord.remainingAmount}
              placeholder={`Max Rs. ${saleRecord.remainingAmount}`}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method / Notes</label>
            <input
              type="text"
              placeholder="e.g. Received via Bank Transfer / Cash counter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-collect-pay-btn"
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
              id="submit-collect-payment-btn"
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
            >
              Record Payment Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
