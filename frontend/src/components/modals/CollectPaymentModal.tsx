import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookSaleRecord, StoredAttachment } from '../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { AttachmentPicker } from '../AttachmentPicker';

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
  const { collectPayment, currentUser } = useApp();
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<StoredAttachment[]>([]);

  const handleClose = () => {
    setPaymentAmount('');
    setNotes('');
    setAttachments([]);
    onClose();
  };

  if (!isOpen || !saleRecord) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount === '' || Number(paymentAmount) <= 0) return;

    collectPayment(saleRecord.id, Number(paymentAmount), notes || 'Dues collection', attachments);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <ModalHeader onClose={handleClose} closeId="close-collect-pay-modal">
        <div className="flex items-center space-x-2 min-w-0">
          <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Collect Payment</h3>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
        <ModalBody className="space-y-4">
        {/* Invoice Summary Box */}
        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Invoice No:</span>
            <span className="font-mono font-bold text-slate-900">{saleRecord.invoiceNo}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 font-semibold shrink-0">Customer / Unit:</span>
            <span className="font-bold text-slate-900 text-right break-words">
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

          <AttachmentPicker
            label="Payment proof (PDF or image)"
            hint="Save bank slip, receipt, or screenshot showing this amount was paid."
            kind="payment-proof"
            value={attachments}
            onChange={setAttachments}
            uploadedBy={currentUser?.name}
          />
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            id="cancel-collect-pay-btn"
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
            id="submit-collect-payment-btn"
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
          >
            Save Payment
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
