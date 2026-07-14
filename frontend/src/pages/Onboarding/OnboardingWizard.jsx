import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Domain from './Step2Domain';
import Step3Skills from './Step3Skills';
import Step4Companies from './Step4Companies';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const DRAFT_KEY = 'onboarding_draft';

const onboardingSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").max(100, "Full Name is too long"),
  college: z.string().min(1, "College Name is required").max(150, "College Name is too long"),
  degree: z.string().min(1, "Degree is required"),
  branch: z.string().min(1, "Branch/Major is required"),
  specialization: z.string().optional().nullable(),
  yearOfStudy: z.coerce.number({ invalid_type_error: "Year of Study is required" }).int().min(1, "Year must be 1-6").max(6, "Year must be 1-6"),
  cgpa: z.coerce.number({ invalid_type_error: "CGPA is required" }).min(0, "CGPA must be at least 0").max(10, "CGPA cannot exceed 10"),
  domainGoal: z.string().min(1, "Domain Goal is required"),
  selectedDomainId: z.string().min(1, "Selected Domain ID is required"),
  skills: z.array(z.object({
    name: z.string(),
    level: z.string()
  })).min(1, "At least one skill is required"),
  targetCompanies: z.array(z.string()).min(1, "At least one target company is required")
});

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem('onboarding_step');
    return savedStep ? Number(savedStep) : 1;
  });
  const [loading, setLoading] = useState(false);

  const getInitialValues = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    const defaults = {
      fullName: '',
      college: '',
      degree: '',
      branch: '',
      specialization: '',
      yearOfStudy: '',
      cgpa: '',
      domainGoal: '',
      selectedDomainId: '',
      skills: [],
      targetCompanies: []
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  };

  const methods = useForm({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: getInitialValues()
  });

  const { formState: { errors }, watch, setValue } = methods;
  const watchedValues = watch();

  // Populate full name from user metadata if empty
  useEffect(() => {
    if (user && !watchedValues.fullName) {
      setValue('fullName', user.user_metadata?.full_name || '');
    }
  }, [user, setValue, watchedValues.fullName]);

  // Sync with localStorage on any value change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedValues));
  }, [watchedValues]);

  // Persist step changes
  useEffect(() => {
    localStorage.setItem('onboarding_step', step);
  }, [step]);

  const isCurrentStepValid = (() => {
    switch (step) {
      case 1:
        const step1Fields = ['fullName', 'college', 'degree', 'branch', 'yearOfStudy', 'cgpa'];
        return step1Fields.every(field => {
          const val = watchedValues[field];
          const hasError = !!errors[field];
          return val !== undefined && val !== null && val !== '' && !hasError;
        });
      case 2:
        return !!watchedValues.domainGoal && !errors.domainGoal && !!watchedValues.selectedDomainId && !errors.selectedDomainId;
      case 3:
        return Array.isArray(watchedValues.skills) && watchedValues.skills.length > 0 && !errors.skills;
      case 4:
        return Array.isArray(watchedValues.targetCompanies) && watchedValues.targetCompanies.length > 0 && !errors.targetCompanies;
      default:
        return false;
    }
  })();

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.fullName,
          email: user.email,
          college: data.college,
          degree: data.degree,
          branch: data.branch,
          specialization: data.specialization || null,
          year_of_study: parseInt(data.yearOfStudy),
          cgpa: parseFloat(data.cgpa),
          domain_goal: data.domainGoal,
          selected_domain_id: data.selectedDomainId,
          target_companies: data.targetCompanies,
          onboarding_complete: true,
        });

      if (profileError) throw profileError;

      await supabase
        .from('skill_assessment')
        .delete()
        .eq('profile_id', user.id);

      if (data.skills.length > 0) {
        const skillsData = data.skills.map(s => ({
          profile_id: user.id,
          skill_name: s.name,
          self_rated_level: s.level,
        }));

        const { error: skillsError } = await supabase
          .from('skill_assessment')
          .insert(skillsData);

        if (skillsError) throw skillsError;
      }

      await refreshProfile();

      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem('onboarding_step');

      toast.success('Onboarding complete! Profile successfully created.');
      navigate('/roadmap');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      toast.error(err.message || 'Failed to save onboarding profile.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Academics' },
    { num: 2, label: 'Goal' },
    { num: 3, label: 'Skills' },
    { num: 4, label: 'Targets' }
  ];

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="w-full min-h-full flex items-start justify-center py-10 px-4 bg-bg-primary"
      >
        <div className="w-full max-w-[1400px] bg-bg-card border border-border-color rounded-xl shadow-lg hover:border-accent/20 transition-all duration-200 relative flex flex-col">
          
          {/* Wizard Step Indicator */}
          <div className="relative flex justify-between items-center p-6 pb-0">
            {/* Connector Line behind steps */}
            <div className="absolute top-10 left-11 right-11 h-[2px] bg-border-color z-0" />

            {/* Active Connector Progress */}
            <div 
              className="absolute top-10 left-11 h-[2px] bg-accent z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 79 + 2}%` }}
            />

            {stepsList.map((s) => {
              const isCompleted = s.num < step;
              const isActive = s.num === step;
              
              return (
                <div key={s.num} className="flex flex-col items-center flex-1 text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-heading transition-all duration-200 
                    ${isCompleted 
                      ? 'bg-accent border border-accent text-black' 
                      : isActive 
                        ? 'bg-bg-secondary border-2 border-accent text-accent' 
                        : 'bg-bg-card border border-border-color text-text-secondary'}`}
                  >
                    {s.num}
                  </div>
                  <span className={`mt-2 text-[11px] font-semibold tracking-wide uppercase transition-colors duration-200
                    ${isActive 
                      ? 'text-accent' 
                      : isCompleted 
                        ? 'text-text-primary' 
                        : 'text-text-secondary'}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Component — scrollable area */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStep()}
          </div>

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center border-t border-border-color p-6 pt-4 shrink-0">
            <button
              type="button"
              className="px-5 py-2.5 font-heading font-semibold text-sm text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={step === 1 || loading}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="px-5 py-2.5 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 flex items-center gap-2 cursor-pointer disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed"
                onClick={handleNext}
                disabled={!isCurrentStepValid}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 flex items-center gap-2 cursor-pointer disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed"
                disabled={loading || !isCurrentStepValid}
              >
                {loading ? (
                  'Saving Profile...'
                ) : (
                  <>
                    Complete Onboarding
                    <CheckCircle size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );

  function renderStep() {
    switch (step) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2Domain />;
      case 3:
        return <Step3Skills />;
      case 4:
        return <Step4Companies />;
      default:
        return null;
    }
  }
}
