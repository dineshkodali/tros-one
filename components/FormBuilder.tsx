import React from 'react';
import { GripVertical, Type, Hash, Mail, Calendar, UploadCloud, CheckSquare, List, Plus } from 'lucide-react';

const FormBuilder: React.FC = () => {
  const fieldTypes = [
    { icon: <Type size={18} />, label: 'Text Input' },
    { icon: <Hash size={18} />, label: 'Number' },
    { icon: <Mail size={18} />, label: 'Email' },
    { icon: <List size={18} />, label: 'Dropdown' },
    { icon: <CheckSquare size={18} />, label: 'Checkbox' },
    { icon: <Calendar size={18} />, label: 'Date Picker' },
    { icon: <UploadCloud size={18} />, label: 'File Upload' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in">
      {/* Sidebar Palette */}
      <div className="w-full md:w-64 bg-white border border-mono-light rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 bg-mono-primary text-white font-semibold">
          Field Palette
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          <p className="text-xs text-mono-textSec mb-2 uppercase tracking-wide">Drag fields to canvas</p>
          {fieldTypes.map((field, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 bg-mono-bg border border-mono-light rounded-lg cursor-grab hover:border-mono-accent hover:shadow-sm transition-all group"
            >
              <span className="text-mono-textSec group-hover:text-mono-primary">{field.icon}</span>
              <span className="text-sm font-medium text-mono-text">{field.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-white border border-mono-light rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-mono-light flex justify-between items-center bg-gray-50 rounded-t-xl">
          <input 
            type="text" 
            defaultValue="New Vendor Registration Form" 
            className="bg-transparent text-lg font-bold text-mono-text focus:outline-none border-b border-transparent focus:border-mono-primary"
          />
          <div className="flex gap-2">
             <button className="px-4 py-2 text-sm text-mono-textSec hover:bg-mono-light rounded-lg transition-colors">Preview</button>
             <button className="px-4 py-2 text-sm bg-mono-primary text-white rounded-lg hover:bg-mono-secondary shadow-sm transition-colors">Save Form</button>
          </div>
        </div>

        <div className="flex-1 p-8 bg-mono-bg overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Simulated Dropped Fields */}
            <div className="bg-white p-6 rounded-lg border-l-4 border-mono-primary shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 cursor-pointer text-mono-textSec hover:text-red-500">Trash</div>
              <div className="flex items-center gap-4 mb-4">
                 <GripVertical className="text-mono-light cursor-move" />
                 <input type="text" defaultValue="Vendor Name" className="font-semibold text-mono-text focus:outline-none border-b border-dashed border-gray-300 focus:border-mono-primary w-full" />
              </div>
              <input type="text" placeholder="Enter vendor full name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-sm pointer-events-none" />
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-transparent hover:border-mono-accent border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 cursor-pointer text-mono-textSec hover:text-red-500">Trash</div>
               <div className="flex items-center gap-4 mb-4">
                 <GripVertical className="text-mono-light cursor-move" />
                 <input type="text" defaultValue="Business Email" className="font-semibold text-mono-text focus:outline-none border-b border-dashed border-gray-300 focus:border-mono-primary w-full" />
              </div>
              <input type="email" placeholder="contact@business.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-sm pointer-events-none" />
            </div>

             <div className="bg-white p-6 rounded-lg border-l-4 border-transparent hover:border-mono-accent border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 cursor-pointer text-mono-textSec hover:text-red-500">Trash</div>
               <div className="flex items-center gap-4 mb-4">
                 <GripVertical className="text-mono-light cursor-move" />
                 <input type="text" defaultValue="Upload License" className="font-semibold text-mono-text focus:outline-none border-b border-dashed border-gray-300 focus:border-mono-primary w-full" />
              </div>
              <div className="w-full p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-mono-textSec pointer-events-none">
                 <UploadCloud className="w-8 h-8 mb-2" />
                 <span className="text-sm">Drag and drop file here</span>
              </div>
            </div>

            {/* Drop Zone Placeholder */}
            <div className="h-32 border-2 border-dashed border-mono-accent/30 bg-mono-light/20 rounded-lg flex flex-col items-center justify-center text-mono-accent transition-colors">
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Drop fields here</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
