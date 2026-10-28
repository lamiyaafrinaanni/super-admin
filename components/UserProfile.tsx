
import React, { useState, useRef } from 'react';
import { User, SocialPlatform, SocialPageRequest, SocialRequestStatus } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Facebook, Instagram, Video, LogOut, Settings, ShieldCheck, CheckCircle, Clock, X, AlertCircle, ExternalLink, Edit, Save, Camera, Globe, Building, Phone, Lock, FileText, MapPin, Users, ChevronLeft } from './Icons';
import { db } from '../services/db';
import { updateKnowledgeBase } from '../services/geminiService';

interface UserProfileProps {
    user: User;
    onLogout?: () => void;
    onConnectSocial?: (platform: SocialPlatform) => void;
    socialRequests?: SocialPageRequest[];
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onConnectSocial, socialRequests = [], showToast }) => {
    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editTab, setEditTab] = useState<'personal' | 'business' | 'security'>('personal');
    
    // Form States
    const [formData, setFormData] = useState<User>(user);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    
    // Derived Data
    const myAccounts = socialRequests.filter(req => req.userId === user.id);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageError = (id: string) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (formData.paymentSystemDesc) {
            const wordCount = formData.paymentSystemDesc.split(/\s+/).length;
            if (wordCount > 200) {
                alert(`Payment System description exceeds 200 words (Current: ${wordCount}). Please shorten it.`);
                return;
            }
        }

        try {
            await db.put('users', formData);
            
            const kycSummary = `
                Company: ${formData.companyName || 'N/A'}
                Category: ${formData.businessCategory || 'N/A'}
                Description: ${formData.businessDescription || 'N/A'}
                Country: ${formData.businessCountry || 'N/A'}
                Website: ${formData.website || 'N/A'}
                Payment Info: ${formData.paymentSystemDesc || 'N/A'}
            `;
            updateKnowledgeBase(user.id, 'KYC', kycSummary);

            setIsEditMode(false);
            showToast?.("Information Updated Successfully!", "success");
        } catch (e) {
            console.error(e);
            showToast?.("Failed to update information.", "error");
        }
    };

    const handlePasswordChange = async () => {
        if (!passData.current || !passData.new || !passData.confirm) {
            alert("Please fill all password fields.");
            return;
        }
        if (passData.new !== passData.confirm) {
            alert("New passwords do not match.");
            return;
        }
        if (passData.current !== user.password) {
            alert("Current password is incorrect.");
            return;
        }

        try {
            const updatedUser = { ...user, password: passData.new };
            await db.put('users', updatedUser);
            setPassData({ current: '', new: '', confirm: '' });
            showToast?.("Password changed successfully!", "success");
        } catch (e) {
            showToast?.("Failed to update password.", "error");
        }
    };

    const getKYCBadgeStyles = (status?: string) => {
        switch (status) {
            case 'Verified':
                return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200';
            case 'Pending':
                return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200';
            default:
                return 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-white/5';
        }
    };

    if (isEditMode) {
        return (
            <div className="space-y-6 pb-24 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsEditMode(false)} 
                        className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white"/>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                </div>

                <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'personal', label: 'Personal Info', icon: <Users className="w-4 h-4"/> },
                            { id: 'business', label: 'Business KYC', icon: <Building className="w-4 h-4"/> },
                            { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4"/> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setEditTab(tab.id as any)}
                                className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                                    editTab === tab.id 
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' 
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-8 bg-white dark:bg-transparent">
                        {editTab === 'personal' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex flex-col items-center">
                                    <div className="relative group">
                                        <img 
                                            src={formData.avatar} 
                                            className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-white/10 object-cover shadow-lg"
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <Camera className="w-8 h-8 text-white"/>
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors border-2 border-white dark:border-slate-900"
                                        >
                                            <Camera className="w-4 h-4"/>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*"/>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">Update Profile Photo</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Full Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Primary Phone (Read-Only)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                value={formData.username}
                                                disabled
                                                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Secondary Mobile</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                name="secondaryMobile"
                                                value={formData.secondaryMobile || ''}
                                                onChange={handleInputChange}
                                                placeholder="Alternative contact number"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                name="address"
                                                value={formData.address || ''}
                                                onChange={handleInputChange}
                                                placeholder="Your full address"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {editTab === 'business' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all ${
                                    formData.kycStatus === 'Verified' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                                    formData.kycStatus === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                                    'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10'
                                }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl shadow-lg ${
                                            formData.kycStatus === 'Verified' ? 'bg-green-500 text-white' :
                                            formData.kycStatus === 'Pending' ? 'bg-amber-500 text-white' :
                                            'bg-gray-400 text-white'
                                        }`}>
                                            <ShieldCheck className="w-6 h-6"/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">KYC Status: {formData.kycStatus || 'Unverified'}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formData.kycStatus === 'Verified' ? 'Your identity and business have been fully verified.' :
                                                 formData.kycStatus === 'Pending' ? 'Your verification is currently being reviewed by an admin.' :
                                                 'Complete the form below and save to submit for verification.'}
                                            </p>
                                        </div>
                                    </div>
                                    {formData.kycStatus !== 'Verified' && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                                            <Clock className="w-4 h-4 text-gray-400"/>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verification required</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Company Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                name="companyName"
                                                value={formData.companyName || ''}
                                                onChange={handleInputChange}
                                                placeholder="Your Business Name"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Category</label>
                                        <input 
                                            type="text" 
                                            name="businessCategory"
                                            value={formData.businessCategory || ''}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Retail, Tech, Fashion"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Business Country</label>
                                        <select 
                                            name="businessCountry"
                                            value={formData.businessCountry || 'Bangladesh'}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white cursor-pointer"
                                        >
                                            <option>Bangladesh</option>
                                            <option>India</option>
                                            <option>USA</option>
                                            <option>UK</option>
                                            <option>UAE</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                name="website"
                                                value={formData.website || ''}
                                                onChange={handleInputChange}
                                                placeholder="https://yourbusiness.com"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Description</label>
                                        <textarea 
                                            name="businessDescription"
                                            value={formData.businessDescription || ''}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Briefly describe your business..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex justify-between">
                                            <span>Payment System Description</span>
                                            <span className={`text-[10px] ${
                                                (formData.paymentSystemDesc?.split(/\s+/).length || 0) > 200 ? 'text-red-500' : 'text-gray-400'
                                            }`}>
                                                {formData.paymentSystemDesc?.split(/\s+/).filter(w => w).length || 0} / 200 Words
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"/>
                                            <textarea 
                                                name="paymentSystemDesc"
                                                value={formData.paymentSystemDesc || ''}
                                                onChange={handleInputChange}
                                                rows={4}
                                                placeholder="Describe your payment methods and policies (Max 200 words)..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {editTab === 'security' && (
                            <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-6 rounded-2xl flex items-start gap-4">
                                    <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-xl text-orange-600 dark:text-orange-400">
                                        <Lock className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-orange-900 dark:text-orange-100 text-lg">Change Password</h4>
                                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Ensure your new password is strong and secure.</p>
                                    </div>
                                </div>

                                <div className="space-y-5 bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Current Password</label>
                                        <input 
                                            type="password"
                                            value={passData.current}
                                            onChange={e => setPassData({...passData, current: e.target.value})}
                                            placeholder="Enter current password"
                                            className="w-full px-4 py-3 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">New Password</label>
                                        <input 
                                            type="password"
                                            value={passData.new}
                                            onChange={e => setPassData({...passData, new: e.target.value})}
                                            placeholder="Enter new password"
                                            className="w-full px-4 py-3 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Confirm New Password</label>
                                        <input 
                                            type="password"
                                            value={passData.confirm}
                                            onChange={e => setPassData({...passData, confirm: e.target.value})}
                                            placeholder="Repeat new password"
                                            className="w-full px-4 py-3 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    
                                    <button 
                                        onClick={handlePasswordChange}
                                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg mt-2 active:scale-95"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsEditMode(false)}
                            className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveProfile}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5"/> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 animate-fade-in relative">
             
             <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-white/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <img 
                            src={user.avatar} 
                            className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover bg-gray-200 dark:bg-gray-800"
                        />
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                            {user.kycStatus === 'Verified' && (
                                <div className="bg-blue-500 text-white p-0.5 rounded-full" title="Verified Professional">
                                    <CheckCircle className="w-4 h-4"/>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium font-mono text-sm mb-3">{user.username}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1.5 transition-all shadow-sm ${getKYCBadgeStyles(user.kycStatus)}`}>
                                {user.kycStatus === 'Verified' ? <CheckCircle className="w-3.5 h-3.5"/> : <ShieldCheck className="w-3.5 h-3.5"/>}
                                KYC {user.kycStatus || 'Unverified'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 transition-all shadow-sm">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto items-center">
                        <QRCodeSVG value={user.id} size={80} className="bg-white p-1 rounded-lg" />
                        <button 
                            onClick={() => setIsEditMode(true)}
                            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Settings className="w-4 h-4"/> Edit Profile
                        </button>
                    </div>
                 </div>
             </div>

             <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-500"/> Connected Platforms
                    </h3>
                    <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Connect New</button>
                </div>

                {myAccounts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 border-dashed">
                        <Video className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                        <p>No social accounts connected yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {myAccounts.map(account => (
                            <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative shrink-0">
                                        {account.pageProfilePhoto && !imageErrors[account.id] ? (
                                            <img 
                                                src={account.pageProfilePhoto} 
                                                alt={account.pageName} 
                                                onError={() => handleImageError(account.id)}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-white/10" 
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${
                                                account.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600' : 
                                                account.platform === SocialPlatform.INSTAGRAM ? 'bg-pink-600' : 'bg-black'
                                            }`}>
                                                {account.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-6 h-6"/> : 
                                                    account.platform === SocialPlatform.INSTAGRAM ? <Instagram className="w-6 h-6"/> : <Video className="w-6 h-6"/>}
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 text-white text-[10px] ${
                                            account.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600' : 
                                            account.platform === SocialPlatform.INSTAGRAM ? 'bg-pink-600' : 'bg-black'
                                        }`}>
                                            {account.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-3 h-3"/> : 
                                                account.platform === SocialPlatform.INSTAGRAM ? <Instagram className="w-3 h-3"/> : <Video className="w-3 h-3"/>}
                                        </div>
                                    </div>
                                    
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 dark:text-gray-200 text-base truncate">{account.pageName || account.platform}</p>
                                        <a href={account.pageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                                            <ExternalLink className="w-3 h-3 shrink-0"/> {account.pageUrl}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                        account.status === SocialRequestStatus.VERIFIED ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200' : 
                                        account.status === SocialRequestStatus.PENDING ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200' :
                                        'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200'
                                    }`}>
                                        {account.status === SocialRequestStatus.VERIFIED && <CheckCircle className="w-3 h-3"/>}
                                        {account.status === SocialRequestStatus.PENDING && <Clock className="w-3 h-3"/>}
                                        {account.status === SocialRequestStatus.REJECTED && <AlertCircle className="w-3 h-3"/>}
                                        {account.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-6 border-t border-gray-200 dark:border-white/10 mt-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Add New Connection</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button 
                            onClick={() => onConnectSocial && onConnectSocial(SocialPlatform.FACEBOOK)}
                            className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-bold text-sm"
                        >
                            <Facebook className="w-4 h-4"/> Facebook
                        </button>
                        <button 
                            onClick={() => onConnectSocial && onConnectSocial(SocialPlatform.INSTAGRAM)}
                            className="flex items-center justify-center gap-2 p-3 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors font-bold text-sm"
                        >
                            <Instagram className="w-4 h-4"/> Instagram
                        </button>
                        <button 
                            onClick={() => onConnectSocial && onConnectSocial(SocialPlatform.TIKTOK)}
                            className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-bold text-sm"
                        >
                            <Video className="w-4 h-4"/> TikTok
                        </button>
                    </div>
                </div>
             </div>

             <div className="max-w-2xl mx-auto mt-8">
                 <button 
                    onClick={onLogout}
                    className="w-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                 >
                     <LogOut className="w-5 h-5"/> Sign Out
                 </button>
                 <p className="text-center text-gray-500 dark:text-gray-600 text-xs mt-4 font-mono">AdWallet Pro v2.6.0</p>
             </div>
        </div>
    );
};
