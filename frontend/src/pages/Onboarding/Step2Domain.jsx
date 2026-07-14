import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { 
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock, 
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  PenTool, Palette, Video, Compass, TrendingUp, Briefcase, Megaphone, 
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home, Sparkles
} from 'lucide-react';

const ICON_MAP = {
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock, 
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  Figma: PenTool, Palette, Video, Compass, TrendingUp, Briefcase, Megaphone, 
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home
};

const CATEGORIES = ['Technology', 'Design', 'Management', 'Core Engineering'];

const FALLBACK_DOMAINS = [
  // Technology
  { id: 'frontend-development', name: 'Frontend Development', category: 'Technology', subcategory: 'Web Development', description: 'Master HTML, CSS, JavaScript, React, and build beautiful interactive user interfaces.', icon: 'Code' },
  { id: 'backend-development', name: 'Backend Development', category: 'Technology', subcategory: 'Web Development', description: 'Design servers, APIs, databases, authentication, and handle backend scalability.', icon: 'Server' },
  { id: 'full-stack-development', name: 'Full Stack Development', category: 'Technology', subcategory: 'Web Development', description: 'Learn both frontend and backend development to build and deploy complete end-to-end web apps.', icon: 'Layers' },
  { id: 'mobile-app-development', name: 'Mobile App Development', category: 'Technology', subcategory: 'Mobile Development', description: 'Build cross-platform mobile apps for iOS and Android using Flutter or React Native.', icon: 'Smartphone' },
  { id: 'devops-engineering', name: 'DevOps Engineering', category: 'Technology', subcategory: 'Infrastructure', description: 'Automate build pipelines, manage deployment infrastructure, and master CI/CD and containers.', icon: 'GitBranch' },
  { id: 'cloud-computing', name: 'Cloud Computing', category: 'Technology', subcategory: 'Infrastructure', description: 'Architect scalable systems on AWS, Azure, or GCP, and learn cloud security and infrastructure.', icon: 'Cloud' },
  { id: 'software-testing-qa', name: 'Software Testing/QA', category: 'Technology', subcategory: 'Quality Assurance', description: 'Validate software quality with manual testing, automation tools, unit tests, and performance audits.', icon: 'ShieldCheck' },
  { id: 'cybersecurity', name: 'Cybersecurity', category: 'Technology', subcategory: 'Security', description: 'Secure networks, audit applications for vulnerabilities, learn penetration testing, and protect data.', icon: 'Lock' },
  { id: 'data-science', name: 'Data Science', category: 'Technology', subcategory: 'Data & AI', description: 'Clean data, perform exploratory data analysis, apply statistics, and build predictive models.', icon: 'BarChart2' },
  { id: 'machine-learning', name: 'Machine Learning', category: 'Technology', subcategory: 'Data & AI', description: 'Train classification, regression, and clustering models using Scikit-Learn, Pandas, and Python.', icon: 'Cpu' },
  { id: 'artificial-intelligence-deep-learning', name: 'Artificial Intelligence / Deep Learning', category: 'Technology', subcategory: 'Data & AI', description: 'Build neural networks, work with NLP/computer vision, and customize Large Language Models.', icon: 'BrainCircuit' },
  { id: 'data-engineering', name: 'Data Engineering', category: 'Technology', subcategory: 'Data & AI', description: 'Design robust ETL data pipelines, manage big data warehouses, and configure orchestrators.', icon: 'Database' },
  { id: 'game-development', name: 'Game Development', category: 'Technology', subcategory: 'Creative Tech', description: 'Develop immersive 2D/3D games using Unity, Unreal Engine, and C#/C++ programming.', icon: 'Gamepad2' },
  { id: '3d-modeling-animation', name: '3D Modeling & Animation', category: 'Technology', subcategory: 'Creative Tech', description: 'Sculpt 3D models, create textures, rig skeletons, and render custom animations in Blender.', icon: 'Box' },
  { id: 'blockchain-development', name: 'Blockchain Development', category: 'Technology', subcategory: 'Web3', description: 'Write secure smart contracts in Solidity and build decentralized apps (dApps) on Web3.', icon: 'Link2' },
  { id: 'embedded-systems-iot', name: 'Embedded Systems/IoT', category: 'Technology', subcategory: 'Hardware', description: 'Program microcontrollers, design circuit boards, and write firmware to connect Internet of Things devices.', icon: 'Workflow' },

  // Design
  { id: 'ui-ux-design', name: 'UI/UX Design', category: 'Design', subcategory: 'Product Design', description: 'Conduct user research, design wireframes, build high-fidelity interactive mockups in Figma.', icon: 'Figma' },
  { id: 'graphic-design', name: 'Graphic Design', category: 'Design', subcategory: 'Visual Design', description: 'Learn color theory, layout composition, brand typography, and master Illustrator/Photoshop.', icon: 'Palette' },
  { id: 'motion-graphics-video-editing', name: 'Motion Graphics & Video Editing', category: 'Design', subcategory: 'Visual Design', description: 'Edit professional videos, animate motion assets, and compile digital video campaigns.', icon: 'Video' },
  { id: 'product-design-track', name: 'Product Design', category: 'Design', subcategory: 'Product Design', description: 'Structure custom design systems, model user journeys, and validate digital product heuristics.', icon: 'Compass' },

  // Management/Business
  { id: 'business-analyst', name: 'Business Analyst', category: 'Management', subcategory: 'Business & PM', description: 'Map business workflows, gather functional requirements, query databases, and visualize analytics.', icon: 'TrendingUp' },
  { id: 'product-management', name: 'Product Management', category: 'Management', subcategory: 'Business & PM', description: 'Define product strategy, write user stories, run A/B tests, track metrics, and lead launches.', icon: 'Briefcase' },
  { id: 'digital-marketing', name: 'Digital Marketing', category: 'Management', subcategory: 'Business & PM', description: 'Optimize search engines (SEO), coordinate ad campaigns, write copy, and configure search analytics.', icon: 'Megaphone' },
  { id: 'finance-investment-banking', name: 'Finance & Investment Banking', category: 'Management', subcategory: 'Finance', description: 'Analyze financial statements, build Excel DCF valuations, and learn corporate finance basics.', icon: 'DollarSign' },
  { id: 'hr-management', name: 'HR Management', category: 'Management', subcategory: 'Operations', description: 'Handle corporate recruiting pipelines, employee onboarding, labor law, and performance evaluations.', icon: 'Users' },
  { id: 'operations-management', name: 'Operations Management', category: 'Management', subcategory: 'Operations', description: 'Analyze supply chains, schedule logistics, reduce production waste, and optimize workflows.', icon: 'Activity' },
  { id: 'consulting', name: 'Consulting', category: 'Management', subcategory: 'Business & PM', description: 'Master case interview frameworks, build guesstimates, structure slides, and deliver client pitches.', icon: 'Presentation' },

  // Core Engineering
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', category: 'Core Engineering', subcategory: 'Engineering Tracks', description: 'Design structures in SolidWorks, model thermodynamics, fluid dynamics, and manufacturing setups.', icon: 'Settings' },
  { id: 'electrical-electronics-engineering', name: 'Electrical & Electronics Engineering', category: 'Core Engineering', subcategory: 'Engineering Tracks', description: 'Design analog/digital circuits, model power grids, study signals, and simulate in Matlab.', icon: 'Zap' },
  { id: 'civil-engineering', name: 'Civil Engineering', category: 'Core Engineering', subcategory: 'Engineering Tracks', description: 'Design buildings, compute structural loads, coordinate site surveys, and manage public works projects.', icon: 'Home' }
];

export default function Step2Domain() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const domainGoal = watch('domainGoal');
  const selectedDomainId = watch('selectedDomainId');

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Technology');

  useEffect(() => {
    async function getDomains() {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDomains(data);
        } else {
          setDomains(FALLBACK_DOMAINS);
        }
      } catch (err) {
        console.error('Error fetching domains, falling back to static list:', err);
        setDomains(FALLBACK_DOMAINS);
      } finally {
        setLoading(false);
      }
    }
    getDomains();
  }, []);

  // Filter domains by active category
  const filteredDomains = domains.filter(d => d.category?.toLowerCase() === activeCategory.toLowerCase());

  // Group filtered domains by subcategory
  const groupedDomains = filteredDomains.reduce((acc, domain) => {
    const sub = domain.subcategory || 'General';
    if (!acc[sub]) {
      acc[sub] = [];
    }
    acc[sub].push(domain);
    return acc;
  }, {});

  const handleSelectDomain = (dom) => {
    setValue('domainGoal', dom.name, { shouldValidate: true });
    setValue('selectedDomainId', dom.id, { shouldValidate: true });
  };

  return (
    <div className="animate-fade-in text-left">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold font-heading text-text-primary mb-1">
          Select Your Domain Goal <span className="text-error font-semibold">*</span>
        </h3>
        <p className="text-sm text-text-secondary">
          Choose the specific track you want to prepare and build a learning roadmap for.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-border-color mb-6 overflow-x-auto gap-2">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-semibold font-heading transition duration-200 cursor-pointer border-b-2 outline-none select-none whitespace-nowrap
                ${isActive 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary'}`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <div className="w-6 h-6 border-2 border-border-color border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-text-secondary font-heading">Loading tracks...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedDomains).map((subcategory) => (
            <div key={subcategory} className="space-y-3">
              <div className="flex items-center gap-1.5 text-accent font-heading font-bold text-xs uppercase tracking-wider">
                <Sparkles size={12} />
                <span>{subcategory}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedDomains[subcategory].map((dom) => {
                  const IconComponent = ICON_MAP[dom.icon] || Code;
                  const isSelected = selectedDomainId === dom.id || domainGoal === dom.name;

                  return (
                    <div
                      key={dom.id}
                      onClick={() => handleSelectDomain(dom)}
                      className={`transition-all duration-200 cursor-pointer rounded-xl p-5 border text-left flex flex-col items-start select-none relative overflow-hidden group
                        ${isSelected 
                          ? 'bg-accent/5 border-accent shadow-[0_0_15px_rgba(255,230,0,0.05)]' 
                          : 'bg-bg-secondary border-border-color hover:border-accent hover:bg-white/[0.01]'}`}
                    >
                      {/* Highlight border on hover */}
                      <div className={`absolute inset-0 border border-accent/20 rounded-xl transition duration-200 opacity-0 group-hover:opacity-100 pointer-events-none ${isSelected ? 'hidden' : ''}`} />

                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3.5 transition-all duration-200 border
                        ${isSelected 
                          ? 'bg-accent border-transparent text-black font-bold' 
                          : 'bg-bg-card border-border-color text-accent group-hover:scale-105'}`}
                      >
                        <IconComponent size={18} />
                      </div>
                      
                      <h4 className="text-sm font-bold font-heading text-text-primary mb-1.5 transition duration-150 group-hover:text-accent">
                        {dom.name}
                      </h4>
                      
                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
                        {dom.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.domainGoal && (
        <p className="text-xs text-error mt-4 font-medium text-center">{errors.domainGoal.message}</p>
      )}
    </div>
  );
}
