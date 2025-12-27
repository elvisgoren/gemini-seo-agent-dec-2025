
import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, Trash2, X, Building2, BookTemplate } from 'lucide-react';
import { Client } from '../types';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onBack: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients, onAddClient, onDeleteClient, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientBrief, setNewClientBrief] = useState('');
  const [newClientGuidelines, setNewClientGuidelines] = useState('');

  const handleSave = () => {
    if (!newClientName.trim()) return;
    
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName,
      brief: newClientBrief,
      brandGuidelines: newClientGuidelines
    };
    
    onAddClient(newClient);
    setNewClientName('');
    setNewClientBrief('');
    setNewClientGuidelines('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={onBack} 
                className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Client Management
              </h1>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {clients.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No clients added yet</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">Add clients to quickly populate company briefs and guidelines in your strategy generator.</p>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="mt-6 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all shadow-sm"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <button 
                    onClick={() => onDeleteClient(client.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{client.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-[3em] leading-relaxed mb-2">
                  {client.brief || "No brief provided."}
                </p>
                <div className="flex items-center text-xs text-gray-400 gap-1">
                    <BookTemplate className="w-3 h-3" />
                    <span>{client.brandGuidelines ? 'Brand Guidelines Set' : 'No Brand Guidelines'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name</label>
                  <input 
                    type="text" 
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Context</label>
                  <textarea 
                    value={newClientBrief}
                    onChange={(e) => setNewClientBrief(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed"
                    placeholder="Paste the company overview, target audience, USP here..."
                  />
                </div>
                 <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Guidelines</label>
                  <textarea 
                    value={newClientGuidelines}
                    onChange={(e) => setNewClientGuidelines(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed"
                    placeholder="Specific voice & tone rules, banned words, formatting preferences..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!newClientName.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
