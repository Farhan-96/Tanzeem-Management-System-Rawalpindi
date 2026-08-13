import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  UserCheck,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfficeAsset, AssetStatus, AssetCategory } from '../types';

interface OfficeAssetsViewProps {
  openAddAssetModal: () => void;
}

export const OfficeAssetsView: React.FC<OfficeAssetsViewProps> = ({ openAddAssetModal }) => {
  const { assets, updateAssetStatus, assignAsset, deleteAsset, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [assignModalAsset, setAssignModalAsset] = useState<OfficeAsset | null>(null);
  const [personInput, setPersonInput] = useState('');
  const [deptInput, setDeptInput] = useState('');

  const categories: AssetCategory[] = [
    'Electronics',
    'Furniture',
    'IT Equipment',
    'Stationery',
    'Appliances',
    'Vehicles',
    'Other',
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.issuedToPerson && asset.issuedToPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignModalAsset && personInput) {
      assignAsset(assignModalAsset.id, personInput, deptInput || 'General Staff');
      setAssignModalAsset(null);
      setPersonInput('');
      setDeptInput('');
    }
  };

  const statusBadges: Record<AssetStatus, { bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
    Working: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Working', icon: CheckCircle2 },
    Damaged: { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'Damaged', icon: AlertTriangle },
    'Under Repair': { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Under Repair', icon: Wrench },
    Disposed: { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: 'Disposed', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Office Assets & Equipment Inventory (Purpose 5)</h2>
            <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
              {assets.length} Registered Groups
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor all office items, working vs damaged conditions, and track staff assignment or department placement.
          </p>
        </div>

        <button
          id="add-office-asset-btn"
          onClick={openAddAssetModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Add New Office Asset</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="asset-search-input"
            type="text"
            placeholder="Search asset name, tag ID, room location, or assigned person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          id="asset-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Working">Working</option>
          <option value="Damaged">Damaged</option>
          <option value="Under Repair">Under Repair</option>
          <option value="Disposed">Disposed</option>
        </select>

        {/* Category Filter */}
        <select
          id="asset-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const StatusIcon = statusBadges[asset.status].icon;

          return (
            <div
              key={asset.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Tag & Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {asset.assetTag}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[asset.status].bg}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusBadges[asset.status].text}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-serif line-clamp-1">{asset.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{asset.category} &bull; Qty: {asset.quantity}</p>

                {/* Location & Assigned Person */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Location</span>
                    <span className="font-medium text-slate-800">{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Issued / In Use By</span>
                    <span className="font-bold text-teal-800">
                      {asset.issuedToPerson ? `${asset.issuedToPerson}` : 'Unassigned (In Store)'}
                    </span>
                  </div>
                  {asset.purchaseCost > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Cost</span>
                      <span className="font-semibold text-slate-800">Rs. {asset.purchaseCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {asset.remarks && (
                  <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">"{asset.remarks}"</p>
                )}
              </div>

              {/* Status Update & Assign Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center space-x-1">
                  <button
                    id={`assign-person-${asset.id}`}
                    onClick={() => {
                      setAssignModalAsset(asset);
                      setPersonInput(asset.issuedToPerson || '');
                      setDeptInput(asset.issuedToDept || '');
                    }}
                    className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign Person</span>
                  </button>

                  <select
                    id={`change-status-${asset.id}`}
                    value={asset.status}
                    onChange={(e) => updateAssetStatus(asset.id, e.target.value as AssetStatus)}
                    className="px-2 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <option value="Working">Working</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                {currentUser.role === 'Admin' && (
                  <button
                    id={`delete-asset-${asset.id}`}
                    onClick={() => {
                      if (window.confirm(`Delete asset "${asset.name}"?`)) {
                        deleteAsset(asset.id);
                      }
                    }}
                    title="Delete Asset"
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
            No office assets found matching filter criteria.
          </div>
        )}
      </div>

      {/* Assign Person Modal */}
      {assignModalAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
          >
            <h3 className="text-lg font-bold text-slate-900 font-serif mb-1">
              Assign Asset To Staff / User
            </h3>
            <p className="text-xs text-slate-500 mb-4">Asset: {assignModalAsset.name} [{assignModalAsset.assetTag}]</p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Person Name (In Use By)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mahmood, Admin Office"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Office Location</label>
                <input
                  type="text"
                  placeholder="e.g. IT Department, Main Office"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAssignModalAsset(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
