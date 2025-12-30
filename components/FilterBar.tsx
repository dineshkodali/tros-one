import React from "react";
import {
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "text";
  options?: string[];
}

interface SortOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterOptions: FilterOption[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  sortOptions: SortOption[];
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSortChange: (key: string, direction: "asc" | "desc") => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterOptions,
  filters,
  onFilterChange,
  sortOptions,
  sortConfig,
  onSortChange,
}) => {
  const handleClearAll = () => {
    filterOptions.forEach((f) => onFilterChange(f.key, ""));
    onSearchChange("");
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  return (
    <div className="w-full mb-1 md:mb-2">
      <div className="w-full md:max-w-4xl md:mx-auto flex flex-col gap-3 md:gap-4">

        {/* Search Row - Centered and Clean */}
        <div className="relative w-full shadow-sm rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#064e3b]" />
          </div>
          <input
            type="text"
            placeholder="Search items, brands, or IDs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-12 pr-12 py-3 bg-white border border-emerald-100 rounded-xl text-base font-medium text-gray-900 placeholder-emerald-800/30 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filters Row - Inline & Scrollable */}
        <div
          className="
    flex items-center gap-3
    overflow-x-auto no-scrollbar
    py-1
    flex-nowrap
  "
        >
          {/* Label (Hidden on small mobile) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#064e3b] uppercase tracking-wide mr-2 opacity-70">
            <Filter size={14} /> Filters:
          </div>

          {/* Sort Dropdown */}
          <div className="relative group shrink-0">
            <div className="flex items-center bg-white border border-emerald-100 rounded-lg h-10 pl-3 pr-2 shadow-sm cursor-pointer hover:border-[#064e3b] transition-colors">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-2">
                Sort
              </span>
              <select
                value={sortConfig?.key || ""}
                onChange={(e) =>
                  onSortChange(e.target.value, sortConfig?.direction || "asc")
                }
                className="bg-transparent text-sm font-bold text-[#064e3b] outline-none appearance-none pr-6 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-9 text-[#064e3b] pointer-events-none"
              />

              <div className="w-px h-5 bg-gray-200 mx-2"></div>

              <button
                onClick={() =>
                  onSortChange(
                    sortConfig?.key || sortOptions[0].key,
                    sortConfig?.direction === "asc" ? "desc" : "asc"
                  )
                }
                className="text-[#064e3b] hover:bg-emerald-50 rounded p-1"
              >
                {sortConfig?.direction === "asc" ? (
                  <ArrowUp size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Filter Chips */}
          {filterOptions.map((option) => (
            <div key={option.key} className="relative shrink-0">
              {option.type === "select" ? (
                <div
                  className={`relative flex items-center h-10 px-3 rounded-lg border transition-all cursor-pointer ${
                    filters[option.key]
                      ? "bg-[#064e3b] border-[#064e3b] text-white shadow-md"
                      : "bg-white border-emerald-100 text-gray-700 hover:border-[#064e3b]"
                  }`}
                >
                  <select
                    value={filters[option.key] || ""}
                    onChange={(e) => onFilterChange(option.key, e.target.value)}
                    className={`appearance-none bg-transparent text-sm font-medium outline-none pr-5 cursor-pointer w-full ${
                      filters[option.key] ? "text-white font-bold" : ""
                    }`}
                  >
                    <option value="" className="text-gray-500">
                      {option.label}
                    </option>
                    {option.options?.map((opt) => (
                      <option key={opt} value={opt} className="text-gray-900">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`absolute right-2 w-3 h-3 pointer-events-none ${
                      filters[option.key] ? "text-white" : "text-gray-400"
                    }`}
                  />
                </div>
              ) : (
                <div
                  className={`relative flex items-center h-10 bg-white border rounded-lg px-3 shadow-sm min-w-[140px] transition-colors ${
                    filters[option.key]
                      ? "border-[#064e3b] ring-1 ring-[#064e3b]/20"
                      : "border-emerald-100"
                  }`}
                >
                  <input
                    type="text"
                    value={filters[option.key] || ""}
                    onChange={(e) => onFilterChange(option.key, e.target.value)}
                    placeholder={option.label}
                    className="bg-transparent text-sm text-gray-900 font-medium outline-none w-full placeholder:text-gray-400"
                  />
                  {filters[option.key] && (
                    <button
                      onClick={() => onFilterChange(option.key, "")}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Clear All Pill */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="shrink-0 h-9 px-3 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto md:ml-0"
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
