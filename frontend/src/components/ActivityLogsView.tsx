import React, { useState } from 'react';
import { FileText, Search, ShieldCheck, Clock, User, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ActivityLogsView: React.FC = () => {
  const { logs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('All');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Activity Log</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200">
              {logs.length} Total Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security and operational audit log of inventory changes, sales entries, payment collections, and user role switches.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="audit-log-search-input"
            type="text"
            placeholder="Search log activity, details, or user name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <select
          id="audit-log-module-filter"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
        >
          <option value="All">All Modules</option>
          <option value="Books">Books</option>
          <option value="Arrivals">Arrivals</option>
          <option value="Lending">Issued Books</option>
          <option value="Sales">Sales</option>
          <option value="Assets">Assets</option>
          <option value="Auth">Sign-in & System</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User & Role</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{log.action}</td>
                  <td className="p-3.5 text-slate-600">{log.details}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    {logs.length === 0
                      ? 'No activity yet. Sign-ins, sales, lending, and asset changes will appear here.'
                      : 'No activity logs found for current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
