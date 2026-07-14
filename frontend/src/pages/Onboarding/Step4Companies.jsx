import React, { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

export default function Step4Companies() {
  const { watch, setValue, formState: { errors } } = useFormContext();
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
    
    if (targetCompanies.some(c => c.toLowerCase() === companyName.toLowerCase())) {
      return;
    }

    const newCompanies = [...targetCompanies, companyName.trim()];
    setValue('targetCompanies', newCompanies, { shouldValidate: true });
    setCustomCompany('');
  };

  const removeCompany = (indexToRemove) => {
    const newCompanies = targetCompanies.filter((_, idx) => idx !== indexToRemove);
    setValue('targetCompanies', newCompanies, { shouldValidate: true });
  };

  return (
    <div className="animate-fade-in text-left">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold font-heading text-text-primary mb-1">Target Companies <span className="text-error font-semibold">*</span></h3>
        <p className="text-sm text-text-secondary">Select the companies you want to crack. We will customize your resources accordingly.</p>
      </div>

      {/* Popular companies selector */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3 text-accent font-heading font-semibold text-sm">
          <Target size={16} />
          <span>Popular Companies</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {popularCompanies.map((company) => {
            const isAdded = targetCompanies.some(c => c.toLowerCase() === company.toLowerCase());
            return (
              <button
                key={company}
                type="button"
                className={`px-3.5 py-1.5 border rounded-full text-xs transition duration-200 cursor-pointer outline-none select-none
                  ${isAdded 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'bg-bg-secondary border-border-color text-text-secondary hover:border-text-secondary hover:text-text-primary'}`}
                onClick={() => {
                  if (isAdded) {
                    const idx = targetCompanies.findIndex(c => c.toLowerCase() === company.toLowerCase());
                    removeCompany(idx);
                  } else {
                    addCompany(company);
                  }
                }}
              >
                {company}
                {isAdded ? ' ✓' : ' +'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Company Tag */}
      <div className="flex flex-col items-start w-full mb-6">
        <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="custom-company">Add Other Company</label>
        <div className="flex gap-2.5 w-full">
          <input
            id="custom-company"
            type="text"
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
            placeholder="e.g. Stripe, Airbnb, Tesla..."
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
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Target Companies Selected List */}
      <div className="w-full">
        <label className="block text-xs font-semibold font-heading text-text-primary mb-3">Your Target List ({targetCompanies.length})</label>
        
        {targetCompanies.length === 0 ? (
          <div className="text-center p-6 bg-bg-secondary border border-dashed border-border-color rounded-lg text-text-secondary text-sm">
            No companies added yet. Select from recommendations or add custom ones.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {targetCompanies.map((company, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent/10 border border-accent rounded-full text-xs text-accent transition duration-200"
              >
                {company}
                <button
                  type="button"
                  className="text-accent hover:text-accent-hover cursor-pointer p-0.5 rounded-full transition duration-150 flex items-center"
                  onClick={() => removeCompany(index)}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {errors.targetCompanies && (
        <p className="text-xs text-error mt-3 font-medium text-center">{errors.targetCompanies.message}</p>
      )}
    </div>
  );
}
