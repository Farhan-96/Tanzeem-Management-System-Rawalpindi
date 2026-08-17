import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AssetCategory, AssetStatus, StoredAttachment } from '../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { AttachmentPicker } from '../AttachmentPicker';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose }) => {
  const { addAsset, currentUser } = useApp();

  const [name, setName] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [category, setCategory] = useState<AssetCategory>('IT Equipment');
  const [status, setStatus] = useState<AssetStatus>('Working');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [location, setLocation] = useState('Main Office');
  const [issuedToPerson, setIssuedToPerson] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>(0);
  const [serialNumber, setSerialNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<StoredAttachment[]>([]);

  const handleClose = () => {
    setName('');
    setAssetTag('');
    setIssuedToPerson('');
    setRemarks('');
    setSerialNumber('');
    setAttachments([]);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || quantity === '') return;

    addAsset({
      name,
      assetTag: assetTag || `AST-${Math.floor(100 + Math.random() * 900)}`,
      category,
      status,
      quantity: Number(quantity),
      location,
      issuedToPerson: issuedToPerson || undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: Number(purchaseCost) || 0,
      serialNumber,
      remarks,
      attachments,
    });

    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <ModalHeader onClose={handleClose} closeId="close-add-asset-modal">
        <div className="flex items-center space-x-2 min-w-0">
          <Building2 className="w-5 h-5 text-teal-700 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Add Office Asset</h3>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
        <ModalBody className="space-y-4">
          {/* Asset Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Asset / Equipment Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dell OptiPlex Desktop Computer Set"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Tag & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unique Tag ID (Auto-generated if empty)
              </label>
              <input
                type="text"
                placeholder="e.g. AST-0105"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
              >
                <option value="IT Equipment">IT Equipment</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Stationery">Stationery</option>
                <option value="Appliances">Appliances</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Condition Status & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Condition Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
              >
                <option value="Working">Working</option>
                <option value="Damaged">Damaged</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Location & Assigned Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room / Office Location</label>
              <input
                type="text"
                placeholder="e.g. Room 102, Main Hall"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issued / In Use Person Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Tariq Mahmood"
                value={issuedToPerson}
                onChange={(e) => setIssuedToPerson(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Cost & Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (Rs.)</label>
              <input
                type="number"
                min={0}
                placeholder="50000"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Serial Number (If applicable)</label>
              <input
                type="text"
                placeholder="e.g. SN-88912-DL"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Maintenance Notes</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Warranty active till Dec 2026..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              rows={2}
            />
          </div>

          <AttachmentPicker
            label="Bills, invoices, photos, or PDFs"
            hint="Store purchase bills, warranty papers, or photos with this asset."
            kind="asset-document"
            value={attachments}
            onChange={setAttachments}
            uploadedBy={currentUser?.name}
          />

        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            id="cancel-add-asset-btn"
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
            id="submit-add-asset-btn"
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md"
          >
            Save Asset
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
