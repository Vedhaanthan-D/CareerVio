import React from 'react';
import { BookOpen, Award, GraduationCap, School, User, Calendar, Target, Clock } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/Select';

/** Renders the academic details, weekly goal, and target completion date inputs for the profile form. */
export default function ProfileAcademicsForm() {
  const { register, control, formState: { errors } } = useFormContext();
  const degrees = ['B.Tech', 'B.E', 'MBA', 'M.Tech', 'MCA', 'B.Sc', 'Diploma', 'Other'];
  const branches = ['Computer Science & Eng (CSE)', 'Information Technology (IT)', 'Electronics & Comm (ECE)', 'Electrical & Electronics (EEE)', 'Mechanical Eng', 'Civil Eng', 'Finance', 'Marketing', 'Human Resources', 'Other'];
  const years = [1, 2, 3, 4, 5, 6];

  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md space-y-6 text-left">
      <h3 className="text-lg font-bold font-heading text-text-primary border-b border-border-color pb-3 flex items-center gap-2">
        <GraduationCap className="text-accent" size={20} />
        Academic & Goals Setup
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="fullName">
            Full Name <span className="text-error font-semibold">*</span>
          </label>
          <div className="relative w-full">
            <User size={16} className="absolute left-3 top-3.5 text-text-secondary" />
            <input
              id="fullName"
              type="text"
              className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
              placeholder="e.g. John Doe"
              {...register('fullName')}
            />
          </div>
          {errors.fullName && <p className="text-xs text-error mt-1.5 font-medium">{errors.fullName.message}</p>}
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="college">
            College / University Name <span className="text-error font-semibold">*</span>
          </label>
          <div className="relative w-full">
            <School size={16} className="absolute left-3 top-3.5 text-text-secondary" />
            <input
              id="college"
              type="text"
              className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
              placeholder="e.g. Stanford University"
              {...register('college')}
            />
          </div>
          {errors.college && <p className="text-xs text-error mt-1.5 font-medium">{errors.college.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2">
            Degree <span className="text-error font-semibold">*</span>
          </label>
          <Controller
            control={control}
            name="degree"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <SelectTrigger icon={GraduationCap}>
                  <SelectValue placeholder="Select Degree" />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.degree && <p className="text-xs text-error mt-1.5 font-medium">{errors.degree.message}</p>}
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2">
            Branch / Major <span className="text-error font-semibold">*</span>
          </label>
          <Controller
            control={control}
            name="branch"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <SelectTrigger icon={BookOpen}>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.branch && <p className="text-xs text-error mt-1.5 font-medium">{errors.branch.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="specialization">
            Specialization <span className="text-text-secondary font-normal">(Optional)</span>
          </label>
          <input
            id="specialization"
            type="text"
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
            placeholder="e.g. AI & Data Science"
            {...register('specialization')}
          />
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2">
            Year of Study <span className="text-error font-semibold">*</span>
          </label>
          <Controller
            control={control}
            name="yearOfStudy"
            render={({ field }) => (
              <Select 
                onValueChange={(val) => field.onChange(val ? Number(val) : '')} 
                value={field.value ? String(field.value) : undefined}
              >
                <SelectTrigger icon={Calendar}>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.yearOfStudy && <p className="text-xs text-error mt-1.5 font-medium">{errors.yearOfStudy.message}</p>}
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="cgpa">
            Current CGPA <span className="text-error font-semibold">*</span>
          </label>
          <div className="relative w-full">
            <Award size={16} className="absolute left-3 top-3.5 text-text-secondary" />
            <input
              id="cgpa"
              type="number"
              step="0.01"
              className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
              placeholder="e.g. 8.5"
              {...register('cgpa')}
            />
          </div>
          {errors.cgpa && <p className="text-xs text-error mt-1.5 font-medium">{errors.cgpa.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="weeklyGoal">
            Weekly Study Goal (topics) <span className="text-error font-semibold">*</span>
          </label>
          <div className="relative w-full">
            <Target size={16} className="absolute left-3 top-3.5 text-text-secondary" />
            <input
              id="weeklyGoal"
              type="number"
              className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
              placeholder="e.g. 5"
              {...register('weeklyGoal')}
            />
          </div>
          {errors.weeklyGoal && <p className="text-xs text-error mt-1.5 font-medium">{errors.weeklyGoal.message}</p>}
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="targetCompletionDate">
            Target Completion Date <span className="text-text-secondary font-normal">(Optional)</span>
          </label>
          <div className="relative w-full">
            <Clock size={16} className="absolute left-3 top-3.5 text-text-secondary" />
            <input
              id="targetCompletionDate"
              type="date"
              className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition duration-200"
              {...register('targetCompletionDate')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
