'use client';
import React, { useState } from 'react';
import { User, School, DollarSign, CheckCircle2, Save } from 'lucide-react';
import { UserProfile } from '@/types';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState({
    name: userProfile.name,
    email: userProfile.email,
    university: userProfile.university,
    graduationYear: userProfile.graduationYear,
    gpa: userProfile.gpa,
    minSalary: userProfile.minSalary,
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-slate-900">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Profile & Job Preferences</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Customize your search preferences to tailor AI job matching scores and roadmaps.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-6">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Education Details */}
        <div className="space-y-4 pt-4 border-t-2 border-slate-100">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            <span>Academic Background</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">University / College</label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Graduation Year</label>
              <input
                type="text"
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Cumulative GPA</label>
              <input
                type="text"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Salary Preferences */}
        <div className="space-y-4 pt-4 border-t-2 border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Target Minimum Compensation</span>
            </h2>
            <span className="text-sm font-black text-emerald-700">
              ${formData.minSalary} / hr (${formData.minSalary * 2000} / yr)
            </span>
          </div>

          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={formData.minSalary}
            onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {savedMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
            <span>Profile settings updated successfully!</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>

      </form>

    </div>
  );
};
