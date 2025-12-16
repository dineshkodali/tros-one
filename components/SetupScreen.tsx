import React, { useState } from 'react';
import { Database, Save, AlertCircle, CheckCircle, Flame } from 'lucide-react';
import { saveFirebaseConfig } from '../firebase';

const SetupScreen: React.FC = () => {
  const [configInput, setConfigInput] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!configInput.trim()) {
      setError('Please paste your configuration object.');
      return;
    }

    // Try to extract JSON if user pasted full JS code
    let cleanJson = configInput;
    if (configInput.includes('const firebaseConfig =')) {
      const match = configInput.match(/const firebaseConfig = ({[\s\S]*?});/);
      if (match && match[1]) {
        cleanJson = match[1];
      }
    }

    // Fix unquoted keys if necessary (simple regex attempt, though JSON.parse expects strict JSON)
    // For now, assume user copies the object structure. 
    // If JSON.parse fails, we prompt them.
    
    const success = saveFirebaseConfig(cleanJson);
    if (!success) {
      setError('Invalid JSON format. Please ensure you copy the object correctly (e.g., {"apiKey": "..."})');
    }
  };

  return (
    <div className="min-h-screen bg-mono-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-mono-primary/10 blur-[100px] animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-mono-accent/20 blur-[120px] animate-pulse-soft"></div>
      </div>

      <div className="w-full max-w-2xl glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-white/60">
        <div className="bg-gradient-primary p-8 text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-white/10 opacity-20 pattern-grid"></div>
           <div className="relative z-10 flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
               <Database size={32} />
             </div>
             <div>
               <h1 className="text-3xl font-bold">Connect Database</h1>
               <p className="opacity-90">Setup Firebase to power your inventory system</p>
             </div>
           </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
             <AlertCircle className="text-orange-600 shrink-0" />
             <div className="text-sm text-orange-800">
               <p className="font-bold mb-1">Missing Configuration</p>
               <p>The application detected invalid or missing API keys. To fix the <code>auth/api-key-not-valid</code> error, please provide your Firebase credentials.</p>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-mono-text flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              Firebase Configuration Object
            </label>
            <textarea 
              value={configInput}
              onChange={(e) => setConfigInput(e.target.value)}
              className="w-full h-48 p-4 bg-mono-bg border border-mono-light rounded-xl font-mono text-xs text-mono-textSec focus:ring-2 focus:ring-mono-primary focus:outline-none custom-scrollbar"
              placeholder={`{
  "apiKey": "AIzaSy...",
  "authDomain": "your-app.firebaseapp.com",
  "projectId": "your-app",
  "storageBucket": "your-app.firebasestorage.app",
  "messagingSenderId": "123456...",
  "appId": "1:12345..."
}`}
            />
            <p className="text-xs text-mono-textSec">
              Go to <a href="https://console.firebase.google.com" target="_blank" className="text-mono-primary hover:underline">Firebase Console</a> &gt; Project Settings &gt; General &gt; Your Apps &gt; Config.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="pt-4 border-t border-mono-light flex justify-end">
            <button 
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-mono-primary/20 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;