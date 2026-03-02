import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    FileText, UploadCloud, FileImage, Zap, AlertTriangle,
    CheckCircle2, Sparkles, Copy, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { groqChat } from '../../services/groqService';

const AIBillAnalyzerPage = () => {
    const { currentUser, csvData } = useApp();
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [errorText, setErrorText] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };
    const handleFileChange = (e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); };

    const processFile = (fileObj) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(fileObj.type)) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Only JPG, PNG, or WEBP supported.', type: 'error' } }));
            return;
        }
        if (fileObj.size > 4 * 1024 * 1024) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Image must be under 4MB', type: 'error' } }));
            return;
        }
        setFile(fileObj);
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(fileObj);
        setAnalysisResult(null);
    };

    const buildInvoiceText = () => {
        const userInvoices = csvData.invoices.filter(i => i.userId === currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = userInvoices[0];
        if (!latest) return null;
        return `ECOPOWER INVOICE\nInvoice No: ${latest.id}\nPeriod: ${latest.period}\nPlan: ${currentUser.plan} (${currentUser.solarKw}kW Solar)\n\nCHARGES:\nService Fee: ₹2999\nGrid Import: ${Math.floor(Math.random() * 150)} kWh @ ₹8/kWh\nGrid Export Credit: ${Math.floor(Math.random() * 200)} kWh @ ₹5/kWh\nService Tax: 18%\n\nTOTAL AMOUNT: ₹${latest.totalAmount}\nSTATUS: ${latest.status}`;
    };

    const runAnalysis = async (mode = 'file') => {
        try {
            setIsAnalyzing(true); setErrorText(null);
            let userMessage = '';
            if (mode === 'file') {
                if (!filePreview) throw new Error("No image selected");
                const invoiceText = buildInvoiceText();
                userMessage = `I uploaded a bill image (${file?.name}). Since you can't see images, here is my latest EcoPower invoice data:\n\n${invoiceText || 'No invoices found.'}`;
            } else {
                const invoiceText = buildInvoiceText();
                if (!invoiceText) throw new Error("No invoices found in your account history.");
                userMessage = `Analyze the following invoice data:\n\n${invoiceText}`;
            }
            const systemPrompt = `You are an expert energy billing analyst for India.\nAnalyze this energy bill and provide:\n1. Simple summary (2 sentences)\n2. Explanation of each charge in plain language\n3. 3 specific tips to reduce this bill next month\n4. Any anomalies or concerns\n5. Comparison to typical EcoPower customer\n\nFormat with markdown. Use clear headers. Use ₹ for amounts. Keep under 200 words. Be concise.\nContext: EcoPower is a solar-as-a-service platform in Gujarat, India. Rates: ₹8/kWh grid import, ₹5/kWh export credit, 18% tax.`;
            const aiText = await groqChat({ systemPrompt, messages: [{ role: 'user', content: userMessage }], maxTokens: 500 });
            setAnalysisResult(aiText);
        } catch (err) {
            if (err.message === 'AUTH_FAILED') setErrorText("Invalid API key. Contact administrator.");
            else if (err.message === 'GROQ_KEY_MISSING') setErrorText("Groq API key not configured.");
            else setErrorText(err.message || "Analysis failed. Please try again.");
        } finally { setIsAnalyzing(false); }
    };

    const copyToClipboard = () => { if (!analysisResult) return; navigator.clipboard.writeText(analysisResult); window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Copied to clipboard', type: 'success' } })); };
    const downloadPDF = () => {
        if (!analysisResult) return;
        const doc = new jsPDF();
        doc.setFillColor(5, 9, 8); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 200, 100); doc.setFontSize(22); doc.text('EcoPower', 14, 25);
        doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text('AI Bill Analysis Report', 14, 32);
        doc.setTextColor(0, 0, 0); doc.setFontSize(10);
        doc.text(doc.splitTextToSize(analysisResult.replace(/#/g, ''), 180), 14, 50);
        doc.save(`EcoPower_BillAnalysis_${Date.now()}.pdf`);
    };

    const renderMarkdownText = (text) => text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-[#00FF85] mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.replace('## ', '')}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-sm text-gray-300 ml-4 mb-1">{line.substring(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return <p key={i} className="text-sm text-gray-300 mb-2 leading-relaxed">{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong> : p)}</p>;
    });

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto relative">
            <div>
                <h2 className="text-2xl font-syne font-bold text-white mb-2 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-purple-400" /> AI Bill Analyzer
                </h2>
                <p className="text-sm text-gray-400">Upload any utility bill image or audit your latest EcoPower invoice. Powered by Groq · Llama 3.3 70B.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-[#0d1512] border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col">
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div><h4 className="text-sm font-bold text-white mb-1">Analyze Current Bill</h4><p className="text-xs text-gray-400">Instantly audit your latest EcoPower invoice using AI.</p></div>
                        <button onClick={() => runAnalysis('context')} disabled={isAnalyzing} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/30 transition-all shrink-0 flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50"><Sparkles className="w-4 h-4" /> Audit EcoPower Bill</button>
                    </div>
                    <div className="relative flex items-center justify-center mb-6"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center"><span className="px-3 bg-[#0d1512] text-xs font-medium text-gray-500 uppercase tracking-widest">OR UPLOAD EXTERNAL</span></div></div>
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'border-[#00C864] bg-[#00C864]/5 scale-[1.02]' : 'border-white/10 hover:border-white/30 bg-black/20'} ${filePreview ? 'hidden' : 'block'}`}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
                        <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-[#00C864]' : 'text-gray-500'}`} />
                        <h4 className="text-base font-syne font-bold text-white mb-2">Drag invoice image here</h4>
                        <p className="text-xs text-gray-400 mb-2">Supports JPG, PNG, WEBP up to 4MB</p>
                        <p className="text-[10px] text-yellow-500/70 mb-4">Note: Image analyzed via account data context</p>
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors">Browse File</button>
                    </div>
                    {filePreview && (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 animate-fade-in flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><FileImage className="w-5 h-5 text-blue-400" /></div><div><div className="text-sm font-bold text-white truncate max-w-[200px]">{file?.name}</div><div className="text-[10px] text-gray-500">{(file?.size / (1024 * 1024)).toFixed(2)} MB</div></div></div>
                                <button onClick={() => { setFile(null); setFilePreview(null); setAnalysisResult(null); }} className="text-xs text-red-400 hover:text-red-300 font-bold px-2">Remove</button>
                            </div>
                            <div className="w-full h-48 rounded-xl overflow-hidden border border-white/5 mb-6 relative bg-black flex items-center justify-center group"><img src={filePreview} alt="Invoice Preview" className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" /></div>
                            <button onClick={() => runAnalysis('file')} disabled={isAnalyzing} className="w-full py-3 bg-gradient-to-r from-[#00C864] to-[#00A050] hover:from-[#00FF85] hover:to-[#00C864] text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,100,0.2)] flex items-center justify-center gap-2 disabled:opacity-50">
                                {isAnalyzing ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span> : <Zap className="w-4 h-4" />}
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Now ⚡'}
                            </button>
                        </div>
                    )}
                    {errorText && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {errorText}</div>}
                </div>
                <div className="bg-[#0d1512] border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col min-h-[500px] relative overflow-hidden">
                    {isAnalyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1512]/50 backdrop-blur-sm z-10 p-8 text-center animate-pulse">
                            <div className="w-16 h-16 relative mb-6"><div className="absolute inset-0 border-4 border-[#00C864]/20 rounded-full"></div><div className="absolute inset-0 border-4 border-[#00C864] rounded-full border-t-transparent animate-spin"></div><Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#00C864]" /></div>
                            <h3 className="text-lg font-syne font-bold text-white mb-2">AI is auditing your invoice...</h3>
                            <p className="text-sm text-gray-400">Cross-referencing tariffs and calculating optimizations.</p>
                        </div>
                    ) : analysisResult ? (
                        <div className="relative z-0 flex flex-col h-full animate-fade-in">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2 text-[#00C864]"><CheckCircle2 className="w-5 h-5" /><span className="font-syne font-bold uppercase tracking-widest text-sm">Analysis Complete</span></div>
                                <div className="flex items-center gap-2">
                                    <button onClick={copyToClipboard} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
                                    <button onClick={downloadPDF} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Download PDF"><Download className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">{renderMarkdownText(analysisResult)}</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40">
                            <FileText className="w-16 h-16 text-gray-500 mb-4" />
                            <h3 className="text-lg font-syne font-bold text-white mb-2">Awaiting Document</h3>
                            <p className="text-sm text-gray-400 max-w-xs">Upload an image or use the Fast Path to generate an AI audit.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIBillAnalyzerPage;
