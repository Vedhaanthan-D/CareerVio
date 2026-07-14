import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { LogOut, Save, Share2, Clipboard, GraduationCap } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProfileAcademicsForm from './Profile/ProfileAcademicsForm';
import ProfileSkillsForm from './Profile/ProfileSkillsForm';
import ProfileCompaniesForm from './Profile/ProfileCompaniesForm';

const profileSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").max(100, "Full Name is too long"),
  college: z.string().min(1, "College Name is required").max(150, "College Name is too long"),
  degree: z.string().min(1, "Degree is required"),
  branch: z.string().min(1, "Branch/Major is required"),
  specialization: z.string().optional().nullable(),
  yearOfStudy: z.coerce.number().int().min(1, "Year must be 1-6").max(6, "Year must be 1-6"),
  cgpa: z.coerce.number().min(0, "CGPA must be at least 0").max(10, "CGPA cannot exceed 10"),
  weeklyGoal: z.coerce.number().int().min(1, "Goal must be at least 1 topic").max(50, "Goal cannot exceed 50 topics"),
  targetCompletionDate: z.string().optional().nullable(),
  skills: z.array(z.object({
    name: z.string(),
    level: z.string()
  })),
  targetCompanies: z.array(z.string())
});

/** Renders the student profile page containing editable settings and a shareable preparation card. */
export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('academics');
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeDomainName, setActiveDomainName] = useState('');

  const methods = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      college: '',
      degree: '',
      branch: '',
      specialization: '',
      yearOfStudy: 1,
      cgpa: 0,
      weeklyGoal: 5,
      targetCompletionDate: '',
      skills: [],
      targetCompanies: []
    }
  });

  const { reset } = methods;

  const loadProfileData = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const { data: skillsData } = await supabase
        .from('skill_assessment')
        .select('*')
        .eq('profile_id', user.id);

      reset({
        fullName: profile.full_name || '',
        college: profile.college || '',
        degree: profile.degree || '',
        branch: profile.branch || '',
        specialization: profile.specialization || '',
        yearOfStudy: profile.year_of_study || 1,
        cgpa: profile.cgpa || 0,
        weeklyGoal: profile.weekly_goal || 5,
        targetCompletionDate: profile.target_completion_date || '',
        skills: (skillsData || []).map(s => ({ name: s.skill_name, level: s.self_rated_level })),
        targetCompanies: profile.target_companies || []
      });

      if (profile.selected_domain_id) {
        const { data: template } = await supabase
          .from('roadmap_templates')
          .select('*')
          .eq('domain_id', profile.selected_domain_id)
          .eq('status', 'published')
          .maybeSingle();

        const { data: progress } = await supabase
          .from('roadmap_progress')
          .select('*')
          .eq('profile_id', user.id)
          .eq('domain_id', profile.selected_domain_id);

        if (template?.roadmap_json?.nodes) {
          const subtopics = template.roadmap_json.nodes.filter(n => n.parent);
          const total = subtopics.length;
          const completed = (progress || []).filter(p => p.status === 'done').length;
          setProgressPercent(total > 0 ? Math.round((completed / total) * 100) : 0);
          setActiveDomainName(template.roadmap_json.title || 'Learning Roadmap');
        }
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  }, [user, profile, reset]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          college: data.college,
          degree: data.degree,
          branch: data.branch,
          specialization: data.specialization || null,
          year_of_study: data.yearOfStudy,
          cgpa: data.cgpa,
          weekly_goal: data.weeklyGoal,
          target_completion_date: data.targetCompletionDate || null,
          target_companies: data.targetCompanies
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await supabase.from('skill_assessment').delete().eq('profile_id', user.id);
      if (data.skills.length > 0) {
        const skillsPayload = data.skills.map(s => ({
          profile_id: user.id,
          skill_name: s.name,
          self_rated_level: s.level
        }));
        const { error: skillsError } = await supabase.from('skill_assessment').insert(skillsPayload);
        if (skillsError) throw skillsError;
      }

      await refreshProfile();
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShareText = () => {
    const domainText = activeDomainName ? ` through ${activeDomainName}` : '';
    const shareText = `🚀 Check out my preparation progress on CAREERVIO!\n\n👤 Name: ${profile?.full_name || user.email}\n📚 College: ${profile?.college}\n🎯 Target Companies: ${profile?.target_companies?.join(', ') || 'N/A'}\n📈 Progress: ${progressPercent}%${domainText}\n\nBuilt with CAREERVIO.`;
    navigator.clipboard.writeText(shareText);
    toast.success('Shareable profile summary copied to clipboard!');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully logged out.');
    } catch (err) {
      toast.error(err.message || 'Error signing out.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in w-full">
      <div className="flex justify-between items-center mb-8 border-b border-border-color pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-primary mb-1">Student Profile</h1>
          <p className="text-sm text-text-secondary">Manage your academic details, target companies, and skills assessment.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border-color pb-px">
        {['academics', 'skills', 'companies'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${
              activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          {activeTab === 'academics' && <ProfileAcademicsForm />}
          {activeTab === 'skills' && <ProfileSkillsForm />}
          {activeTab === 'companies' && <ProfileCompaniesForm />}

          <div className="flex justify-between items-center bg-bg-card border border-border-color rounded-xl p-4 shadow-sm">
            <button
              type="button"
              onClick={handleCopyShareText}
              className="px-4 py-2.5 font-heading font-semibold text-xs text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200 inline-flex items-center gap-2 cursor-pointer"
            >
              <Share2 size={14} /> Share Preparation Card
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 font-heading font-semibold text-xs text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/10 disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
