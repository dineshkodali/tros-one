import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  filters: string[];
  onExport?: () => void;
  onImport?: () => void;
}

const DataTable = <T extends { id: string }>({ title, data, columns, filters, onExport, onImport }: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Filter Section */}
      <div className="bg-white border border-mono-light rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-mono-text">{title}</h2>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-textSec" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-9 pr-4 py-2 bg-mono-light/30 border border-mono-light rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-mono-primary"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isFilterOpen ? 'bg-mono-light border-mono-accent text-mono-primary' : 'bg-white border-mono-light text-mono-text hover:bg-mono-light'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-3 h-3 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={onExport} className="p-2 text-mono-primary hover:bg-mono-light rounded-lg border border-transparent hover:border-mono-light transition-colors" title="Export CSV">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onImport} className="p-2 text-mono-primary hover:bg-mono-light rounded-lg border border-transparent hover:border-mono-light transition-colors" title="Import CSV">
              <Upload className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="p-4 bg-mono-light/30 rounded-lg border border-mono-light mb-2 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            {filters.map((filter, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-semibold text-mono-textSec uppercase tracking-wider">{filter}</label>
                <select className="w-full p-2 bg-white border border-mono-secondary/20 rounded-md text-sm text-mono-text focus:border-mono-primary focus:outline-none">
                  <option>All {filter}</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            ))}
            <div className="col-span-2 md:col-span-4 flex justify-end gap-2 mt-2">
              <button className="px-4 py-2 text-sm text-mono-accent hover:text-mono-primary font-medium">Clear All</button>
              <button className="px-4 py-2 text-sm bg-mono-primary text-white rounded-md hover:bg-mono-secondary transition-colors shadow-sm">Apply Filters</button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-mono-light rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-mono-primary text-white">
                {columns.map((col, idx) => (
                  <th key={idx} className={`p-4 text-sm font-semibold tracking-wide whitespace-nowrap ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
                <th className="p-4 text-sm font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mono-light">
              {data.map((row, rowIdx) => (
                <tr 
                  key={row.id} 
                  className={`
                    hover:bg-mono-accent/20 transition-colors group
                    ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-mono-light/30'}
                  `}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="p-4 text-sm text-mono-text whitespace-nowrap">
                      {typeof col.accessor === 'function' 
                        ? col.accessor(row) 
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-mono-secondary hover:bg-mono-light rounded-md transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-mono-primary hover:bg-mono-light rounded-md transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-mono-light flex flex-col md:flex-row justify-between items-center gap-4 bg-white text-sm text-mono-textSec">
          <span>Showing 1 to {data.length} of {data.length} entries</span>
          <div className="flex gap-2">
             <button className="px-3 py-1 border border-mono-light rounded hover:bg-mono-light disabled:opacity-50">Previous</button>
             <button className="px-3 py-1 bg-mono-primary text-white rounded hover:bg-mono-secondary">1</button>
             <button className="px-3 py-1 border border-mono-light rounded hover:bg-mono-light">2</button>
             <button className="px-3 py-1 border border-mono-light rounded hover:bg-mono-light disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
