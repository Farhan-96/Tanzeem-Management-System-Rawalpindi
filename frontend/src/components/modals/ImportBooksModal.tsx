import React, { useState } from 'react';
import { FileSpreadsheet, AlertCircle, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseBookSpreadsheetFile, type BookImportRow } from '../../utils/parseBookSpreadsheet';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

interface ImportBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportBooksModal: React.FC<ImportBooksModalProps> = ({ isOpen, onClose }) => {
  const { importBooks } = useApp();
  const [rows, setRows] = useState<BookImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setRows([]);
    setFileName('');
    setErrorMessage('');
    setResultMessage('');
    setParsing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setErrorMessage('');
    setResultMessage('');
    setFileName(file.name);
    try {
      const parsed = await parseBookSpreadsheetFile(file);
      if (parsed.length === 0) {
        setRows([]);
        setErrorMessage('No book rows found. Use columns like Item Name, Retail Price, Quantity, and Code.');
      } else {
        setRows(parsed);
      }
    } catch (err) {
      setRows([]);
      setErrorMessage(err instanceof Error ? err.message : 'Could not read this spreadsheet.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    if (rows.length === 0) return;
    const result = importBooks(rows);
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }
    handleClose();
  };

  const totalCopies = rows.reduce((sum, row) => sum + row.totalQuantity, 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl">
      <ModalHeader onClose={handleClose} closeId="close-import-books-modal">
        <div className="flex items-center space-x-2 min-w-0">
          <FileSpreadsheet className="w-5 h-5 shrink-0 text-emerald-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Import Books from Excel</h3>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <label className="block rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 cursor-pointer hover:bg-emerald-50">
          <div className="flex items-center space-x-3">
            <Upload className="w-5 h-5 text-emerald-700" />
            <div>
              <div className="font-bold text-slate-800">Choose Excel or CSV file</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Expected columns: Id, Item Name, Retail Price, Quantity, Code
              </div>
              {fileName && <div className="text-[11px] text-emerald-800 font-medium mt-1">{fileName}</div>}
            </div>
          </div>
          <input
            id="import-books-file-input"
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {parsing && <p className="text-slate-500">Reading spreadsheet…</p>}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="px-2 py-1 bg-slate-100 rounded-lg font-semibold">{rows.length} titles</span>
              <span className="px-2 py-1 bg-slate-100 rounded-lg font-semibold">{totalCopies} copies</span>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2">Title</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 25).map((row, i) => (
                    <tr key={`${row.isbn}-${i}`}>
                      <td className="p-2 font-medium text-slate-800">{row.title}</td>
                      <td className="p-2 font-bold text-emerald-800">{row.totalQuantity}</td>
                      <td className="p-2">Rs. {row.price.toLocaleString()}</td>
                      <td className="p-2 font-mono text-slate-500">{row.isbn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 25 && (
                <p className="p-2 text-[11px] text-slate-500 text-center">Showing first 25 of {rows.length} rows</p>
              )}
            </div>
            {resultMessage && <p className="text-emerald-700 font-medium">{resultMessage}</p>}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
        >
          Cancel
        </button>
        <button
          type="button"
          id="confirm-import-books-btn"
          disabled={rows.length === 0 || parsing}
          onClick={handleImport}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow-md"
        >
          Import {rows.length > 0 ? `${rows.length} Books` : 'Books'}
        </button>
      </ModalFooter>
    </Modal>
  );
};
