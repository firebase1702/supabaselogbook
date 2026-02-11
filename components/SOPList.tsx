
import React, { useState } from 'react';
import { SOP, UserRole } from '../types';
import { Book, ChevronDown, ChevronRight, Search, ShieldAlert, Zap, Wrench, Siren, Layers, Box, UploadCloud, Plus, X, AlertCircle, FileText, Link as LinkIcon, ExternalLink, FileUp, Trash2, Loader2 } from 'lucide-react';
import { getSOPSignedUrl } from '../services/supabaseClient';

interface SOPListProps {
  sops: SOP[];
  onAddSOP?: (sop: SOP) => void;
  onDeleteSOP?: (id: string) => void;
  role: UserRole;
}

type TabType = 'General' | 'Unit 1-2' | 'Unit 3-4';
type ContentType = 'text' | 'pdf' | 'url';

const SOPList: React.FC<SOPListProps> = ({ sops, onAddSOP, onDeleteSOP, role }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Unit 1-2');
  
  // State to track which PDF is currently being fetched
  const [openingPdfId, setOpeningPdfId] = useState<string | null>(null);

  // Upload/Add State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Delete State
  const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);

  // New SOP Form State
  const [newSOP, setNewSOP] = useState<{
    title: string;
    category: SOP['category'];
    targetUnit: SOP['targetUnit'];
    type: ContentType;
    contentRaw: string;
    file: File | null;
    url: string;
  }>({
    title: '',
    category: 'Operation',
    targetUnit: 'Unit 1-2',
    type: 'text',
    contentRaw: '',
    file: null,
    url: ''
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryIcon = (category: SOP['category']) => {
    switch (category) {
      case 'Safety': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Operation': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'Maintenance': return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'Emergency': return <Siren className="w-5 h-5 text-amber-600" />;
      default: return <Book className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewSOP({ ...newSOP, file: e.target.files[0] });
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (newSOP.type === 'pdf' && !newSOP.file) {
      alert("Mohon pilih file PDF terlebih dahulu.");
      return;
    }
    if (newSOP.type === 'url' && !newSOP.url) {
      alert("Mohon masukkan link URL.");
      return;
    }
    
    setIsUploadModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleFinalConfirm = () => {
    if (onAddSOP) {
      let finalSOP: SOP = {
        id: `sop-${Date.now()}`,
        title: newSOP.title,
        category: newSOP.category,
        targetUnit: newSOP.targetUnit,
        type: newSOP.type,
      };

      if (newSOP.type === 'text') {
        finalSOP.content = newSOP.contentRaw.split('\n').filter(line => line.trim() !== '');
      } else if (newSOP.type === 'pdf' && newSOP.file) {
        // We pass the raw file to App.tsx to handle the upload
        finalSOP.rawFile = newSOP.file;
        finalSOP.fileName = newSOP.file.name;
      } else if (newSOP.type === 'url') {
        finalSOP.linkUrl = newSOP.url;
      }

      onAddSOP(finalSOP);
      
      // Reset State
      setIsConfirmModalOpen(false);
      setNewSOP({
        title: '',
        category: 'Operation',
        targetUnit: 'Unit 1-2',
        type: 'text',
        contentRaw: '',
        file: null,
        url: ''
      });
    }
  };

  const confirmDelete = () => {
    if (onDeleteSOP && sopToDelete) {
        onDeleteSOP(sopToDelete.id);
        setSopToDelete(null);
    }
  };

  // Helper to open PDF with Google Viewer via Signed URL
  const handleOpenPdf = async (sop: SOP) => {
    if (!sop.fileUrl) {
      alert("URL file tidak ditemukan.");
      return;
    }

    setOpeningPdfId(sop.id);
    try {
        // Extract the file path from the full URL.
        let filePath = '';
        try {
            const urlObj = new URL(sop.fileUrl);
            const parts = urlObj.pathname.split('/dokumen-sop/');
            if (parts.length > 1) {
                filePath = decodeURIComponent(parts[1]);
            } else {
                // Fallback: use fileName if available, or try last part of URL
                filePath = sop.fileName || urlObj.pathname.split('/').pop() || '';
            }
        } catch (e) {
            // If fileUrl is not a full URL but just a path
            filePath = sop.fileUrl;
        }

        if (!filePath) throw new Error("Path file tidak ditemukan.");

        // Request Signed URL valid for 60 minutes (3600 seconds)
        const signedUrl = await getSOPSignedUrl(filePath, 3600);
        
        if (signedUrl) {
            // Use Google Docs Viewer to force preview in browser (prevents auto-download on mobile)
            const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`;
            window.open(googleViewerUrl, '_blank');
        } else {
            throw new Error("Gagal mendapatkan link valid.");
        }
    } catch (error: any) {
        console.error("Error opening PDF:", error);
        alert("Gagal membuka dokumen: " + (error.message || "Unknown error"));
    } finally {
        setOpeningPdfId(null);
    }
  };

  // Filter Logic
  const filteredSOPs = sops.filter(sop => {
    const matchesTab = sop.targetUnit === activeTab;
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sop.content && sop.content.some(step => step.toLowerCase().includes(searchTerm.toLowerCase())));
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Upload Modal (Form) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  Upload SOP Baru
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <form id="sopForm" onSubmit={handleInitialSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Judul SOP</label>
                      <input 
                        required
                        type="text" 
                        value={newSOP.title}
                        onChange={e => setNewSOP({...newSOP, title: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Contoh: Prosedur Start-up Genset"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
                        <select 
                          value={newSOP.category}
                          onChange={e => setNewSOP({...newSOP, category: e.target.value as SOP['category']})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Operation">Operation</option>
                          <option value="Safety">Safety</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Unit</label>
                        <select 
                          value={newSOP.targetUnit}
                          onChange={e => setNewSOP({...newSOP, targetUnit: e.target.value as SOP['targetUnit']})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Unit 1-2">Unit 1-2</option>
                          <option value="Unit 3-4">Unit 3-4</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>

                    {/* Content Type Selector */}
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipe Konten</label>
                       <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewSOP({...newSOP, type: 'text'})}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${newSOP.type === 'text' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                             <FileText className="w-5 h-5 mb-1" />
                             <span className="text-xs font-bold">Manual Text</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewSOP({...newSOP, type: 'pdf'})}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${newSOP.type === 'pdf' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                             <FileUp className="w-5 h-5 mb-1" />
                             <span className="text-xs font-bold">Upload PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewSOP({...newSOP, type: 'url'})}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${newSOP.type === 'url' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                             <LinkIcon className="w-5 h-5 mb-1" />
                             <span className="text-xs font-bold">Link URL</span>
                          </button>
                       </div>
                    </div>

                    {/* Conditional Input Fields */}
                    {newSOP.type === 'text' && (
                      <div className="animate-in fade-in duration-300">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Langkah / Isi SOP</label>
                        <textarea 
                          required
                          value={newSOP.contentRaw}
                          onChange={e => setNewSOP({...newSOP, contentRaw: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-40 text-sm"
                          placeholder="Tuliskan langkah-langkah SOP di sini. Pisahkan setiap langkah dengan baris baru (Enter)."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">* Pisahkan setiap langkah dengan baris baru (Enter)</p>
                      </div>
                    )}

                    {newSOP.type === 'pdf' && (
                       <div className="animate-in fade-in duration-300">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih File PDF</label>
                          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                             <input 
                               type="file" 
                               id="pdf-upload"
                               accept=".pdf"
                               onChange={handleFileChange}
                               className="hidden"
                             />
                             <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                   <UploadCloud className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700">
                                   {newSOP.file ? newSOP.file.name : 'Klik untuk upload file PDF'}
                                </span>
                                <span className="text-xs text-slate-400">Maksimal 5MB</span>
                             </label>
                          </div>
                       </div>
                    )}

                    {newSOP.type === 'url' && (
                       <div className="animate-in fade-in duration-300">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Eksternal</label>
                          <input 
                            required
                            type="url"
                            value={newSOP.url}
                            onChange={e => setNewSOP({...newSOP, url: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://docs.google.com/..."
                          />
                       </div>
                    )}

                 </form>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsUploadModalOpen(false)}
                   className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors text-sm"
                 >
                   Batal
                 </button>
                 <button 
                   type="submit" 
                   form="sopForm"
                   className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-sm"
                 >
                   Simpan SOP
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Upload Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <UploadCloud className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Upload</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Apakah Anda yakin ingin menambahkan SOP <strong>"{newSOP.title}"</strong> ke dalam kategori <strong>{newSOP.category}</strong>?
              </p>
              
              <div className="bg-slate-50 p-3 rounded-lg mb-6 text-left border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Preview Konten:</p>
                <div className="text-sm text-slate-700 italic truncate flex items-center gap-2">
                   {newSOP.type === 'text' && (
                     <>
                        <FileText className="w-4 h-4 text-slate-400" />
                        "{newSOP.contentRaw.split('\n')[0] || '...'}"
                     </>
                   )}
                   {newSOP.type === 'pdf' && (
                     <>
                        <FileUp className="w-4 h-4 text-red-500" />
                        {newSOP.file ? newSOP.file.name : 'File PDF'}
                     </>
                   )}
                   {newSOP.type === 'url' && (
                     <>
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                        {newSOP.url}
                     </>
                   )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setIsUploadModalOpen(true); // Return to editing
                  }}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Edit Kembali
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Ya, Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sopToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus SOP?</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Apakah Anda yakin ingin menghapus prosedur <strong>"{sopToDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSopToDelete(null)}
                            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari prosedur operasional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Upload Button - ONLY FOR ADMIN */}
        {role === 'admin' && (
            <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
            >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Upload SOP Baru</span>
            <span className="sm:hidden">Upload</span>
            </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center justify-between sm:justify-start gap-2 overflow-x-auto">
        {(['Unit 1-2', 'Unit 3-4', 'General'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
                setActiveTab(tab);
                setExpandedId(null);
            }}
            className={`
              flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap
              ${activeTab === tab 
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
            `}
          >
            {tab === 'General' ? <Layers className="w-4 h-4" /> : <Box className="w-4 h-4" />}
            {tab === 'General' ? 'Umum / Safety' : tab}
          </button>
        ))}
      </div>

      {/* SOP List */}
      <div className="space-y-3 min-h-[300px]">
        {filteredSOPs.length > 0 ? (
          filteredSOPs.map((sop) => (
            <div key={sop.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-2">
              <button
                onClick={() => toggleExpand(sop.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-colors">
                    {getCategoryIcon(sop.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{sop.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                            {sop.category}
                        </span>
                        {sop.targetUnit !== 'General' && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {sop.targetUnit}
                            </span>
                        )}
                        {sop.type === 'pdf' && (
                           <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <FileUp className="w-3 h-3" /> PDF
                           </span>
                        )}
                        {sop.type === 'url' && (
                           <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <LinkIcon className="w-3 h-3" /> Link
                           </span>
                        )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {role === 'admin' && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSopToDelete(sop);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Hapus SOP"
                        >
                            <Trash2 className="w-4 h-4" />
                        </div>
                    )}
                    {expandedId === sop.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </div>
              </button>
              
              {expandedId === sop.id && (
                <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
                  <div className="space-y-3 pl-4 border-l-2 border-blue-200 ml-3">
                    
                    {/* Render Content Based on Type */}
                    {sop.type === 'text' && sop.content && (
                       sop.content.map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-slate-700">
                          <span className="font-mono text-blue-600 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                          <p className="leading-relaxed">{step}</p>
                        </div>
                      ))
                    )}

                    {sop.type === 'pdf' && sop.fileUrl && (
                       <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                             <FileUp className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-sm">{sop.fileName || 'Dokumen SOP.pdf'}</h4>
                             <p className="text-xs text-slate-500">File PDF Terlampir (Private Access)</p>
                          </div>
                          
                          {/* Updated Button to use Google Docs Viewer */}
                          <button 
                            onClick={() => handleOpenPdf(sop)}
                            disabled={openingPdfId === sop.id}
                            className="ml-auto px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                          >
                            {openingPdfId === sop.id ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Membuka...
                                </>
                            ) : (
                                'Buka Preview'
                            )}
                          </button>
                       </div>
                    )}

                    {sop.type === 'url' && sop.linkUrl && (
                       <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                             <LinkIcon className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                             <h4 className="font-bold text-slate-800 text-sm">Dokumen Eksternal</h4>
                             <p className="text-xs text-blue-500 truncate">{sop.linkUrl}</p>
                          </div>
                          <a 
                             href={sop.linkUrl} 
                             target="_blank"
                             rel="noopener noreferrer"
                             className="ml-auto px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                             Buka Link <ExternalLink className="w-3 h-3" />
                          </a>
                       </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Tidak ada SOP ditemukan.</p>
            <p className="text-sm opacity-70">
                {searchTerm 
                    ? `Tidak ada hasil untuk "${searchTerm}" di tab ${activeTab}` 
                    : `Belum ada dokumen SOP untuk kategori ${activeTab}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOPList;
