import React, { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { getSkillGroups } from '../Onboarding/Step3Skills';

/** Renders the skills rating list and recommended skills categories for the profile form. */
export default function ProfileSkillsForm() {
  const { watch, setValue } = useFormContext();
  const domainGoal = watch('domainGoal') || 'Frontend Development';
  const skills = watch('skills') || [];
  const [customSkill, setCustomSkill] = useState('');

  const skillGroups = getSkillGroups(domainGoal);

  const addSkill = (skillName, level = '3') => {
    if (!skillName.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) return;
    setValue('skills', [...skills, { name: skillName.trim(), level }], { shouldValidate: true });
    setCustomSkill('');
  };

  const removeSkill = (indexToRemove) => {
    setValue('skills', skills.filter((_, idx) => idx !== indexToRemove), { shouldValidate: true });
  };

  const handleLevelChange = (indexToUpdate, newLevel) => {
    setValue('skills', skills.map((s, idx) => idx === indexToUpdate ? { ...s, level: newLevel } : s), { shouldValidate: true });
  };

  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md space-y-6 text-left">
      <div>
        <h3 className="text-lg font-bold font-heading text-text-primary mb-1.5 flex items-center gap-2">
          <Sparkles className="text-accent" size={20} />
          Skills Profile
        </h3>
        <p className="text-xs text-text-secondary">Rate your proficiency from 1 (Beginner) to 5 (Expert) or select from recommended skills below.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold font-heading text-text-primary">Your Skills ({skills.length})</label>
        {skills.length === 0 ? (
          <div className="text-center p-6 bg-bg-secondary border border-dashed border-border-color rounded-lg text-text-secondary text-xs">
            No skills added. Add custom skills or select from the recommendations.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {skills.map((skill, index) => (
              <div key={index} className="flex justify-between items-center p-2.5 px-4 bg-bg-secondary border border-border-color rounded-lg">
                <span className="font-semibold text-sm text-text-primary">{skill.name}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const isActive = Number(skill.level) >= num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleLevelChange(index, String(num))}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition duration-200 cursor-pointer select-none outline-none
                            ${isActive ? 'bg-accent border-accent text-black shadow-sm' : 'bg-bg-card border-border-color text-text-secondary hover:border-text-secondary'}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="text-error hover:text-red-500 cursor-pointer p-1 transition duration-150 flex items-center"
                    onClick={() => removeSkill(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <label className="block text-xs font-semibold font-heading text-text-primary" htmlFor="custom-skill">Add Custom Skill</label>
        <div className="flex gap-2">
          <input
            id="custom-skill"
            type="text"
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
            placeholder="e.g. Docker, Public Speaking..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(customSkill);
              }
            }}
          />
          <button
            type="button"
            className="px-5 font-heading font-semibold text-sm text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200 flex items-center justify-center cursor-pointer"
            onClick={() => addSkill(customSkill)}
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold font-heading text-text-primary">Recommended for {domainGoal}</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {skillGroups.map((group) => (
            <div key={group.title} className="bg-bg-secondary border border-border-color/60 rounded-lg p-3">
              <h4 className="text-[10px] font-bold font-heading text-accent uppercase tracking-wider mb-2 border-b border-border-color/40 pb-1">{group.title}</h4>
              <div className="flex flex-wrap gap-1.5">
                {group.skills.map((skill) => {
                  const isAdded = skills.some(s => s.name.toLowerCase() === skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      type="button"
                      className={`px-2 py-1 border rounded text-[10px] font-medium transition duration-150 cursor-pointer outline-none select-none
                        ${isAdded ? 'bg-accent/10 border-accent text-accent' : 'bg-bg-card border-border-color text-text-secondary hover:border-text-secondary'}`}
                      onClick={() => isAdded ? removeSkill(skills.findIndex(s => s.name.toLowerCase() === skill.toLowerCase())) : addSkill(skill)}
                    >
                      {skill} {isAdded ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
