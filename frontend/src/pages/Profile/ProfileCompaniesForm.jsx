import React, { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

/** Renders the target companies selection list and tag entry. */
export default function ProfileCompaniesForm() {
  const { watch, setValue } = useFormContext();
  const targetCompanies = watch('targetCompanies') || [];
  const [customCompany, setCustomCompany] = useState('');

  const popularCompanies = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix',
    'Goldman Sachs', 'J.P. Morgan', 'McKinsey & Co', 'BCG',
    'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant',
    'NVIDIA', 'Adobe', 'Salesforce', 'Uber'
  ];

  const addCompany = (companyName) => {
    if (!companyName.trim()) return;
    if (targetCompanies.some(c => c.toLowerCase() === companyName.toLowerCase())) return;
    setValue('targetCompanies', [...targetCompanies, companyName.trim()], { shouldValidate: true });
    setCustomCompany('');
  };

  const removeCompany = (indexToRemove) => {
    setValue('targetCompanies', targetCompanies.filter((_, idx) => idx !== indexToRemove), { shouldValidate: true });
  };

  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md space-y-6 text-left">
      <div>
        <h3 className="text-lg font-bold font-heading text-text-primary mb-1.5 flex items-center gap-2">
          <Target className="text-accent" size={20} />
          Target Companies
        </h3>
        <p className="text-xs text-text-secondary">Select the companies you want to prepare for. We will use this to prioritize resource suggestions.</p>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {popularCompanies.map((company) => {
            const isAdded = targetCompanies.some(c => c.toLowerCase() === company.toLowerCase());
            return (
              <button
                key={company}
                type="button"
                className={`px-3 py-1.5 border rounded-full text-xs transition duration-200 cursor-pointer outline-none select-none
                  ${isAdded ? 'bg-accent/10 border-accent text-accent' : 'bg-bg-secondary border-border-color text-text-secondary hover:border-text-secondary'}`}
                onClick={() => {
                  if (isAdded) {
                    removeCompany(targetCompanies.findIndex(c => c.toLowerCase() === company.toLowerCase()));
                  } else {
                    addCompany(company);
                  }
                }}
              >
                {company} {isAdded ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <label className="block text-xs font-semibold font-heading text-text-primary" htmlFor="custom-company">Add Other Company</label>
        <div className="flex gap-2">
          <input
            id="custom-company"
            type="text"
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
            placeholder="e.g. Stripe, Airbnb..."
            value={customCompany}
            onChange={(e) => setCustomCompany(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCompany(customCompany);
              }
            }}
          />
          <button
            type="button"
            className="px-5 font-heading font-semibold text-sm text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200 flex items-center justify-center cursor-pointer"
            onClick={() => addCompany(customCompany)}
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold font-heading text-text-primary">Your Target List ({targetCompanies.length})</label>
        {targetCompanies.length === 0 ? (
          <div className="text-center p-6 bg-bg-secondary border border-dashed border-border-color rounded-lg text-text-secondary text-xs">
            No companies added yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {targetCompanies.map((company, index) => (
              <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent rounded-full text-xs text-accent">
                {company}
                <button
                  type="button"
                  className="text-accent hover:text-accent-hover cursor-pointer p-0.5"
                  onClick={() => removeCompany(index)}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
