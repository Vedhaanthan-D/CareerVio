import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Shield, Settings, Zap } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

export const SKILL_GROUPS_BY_DOMAIN = {
  // 1. Technology (16 tracks)
  'Frontend Development': [
    { title: 'Foundations & Core Web', skills: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'DOM Manipulation'] },
    { title: 'Frameworks & Styling', skills: ['React', 'Tailwind CSS', 'TypeScript', 'State Management'] },
    { title: 'Tooling, APIs & Testing', skills: ['Git & Version Control', 'Vite & Build Tools', 'REST/GraphQL APIs', 'Jest / Testing'] }
  ],
  'Backend Development': [
    { title: 'Server & Languages', skills: ['Node.js', 'Express.js', 'Python / Django', 'Java / Spring Boot'] },
    { title: 'Databases & APIs', skills: ['SQL & Relational DBs', 'PostgreSQL', 'RESTful & GraphQL APIs', 'MongoDB / NoSQL'] },
    { title: 'Security & Deployment', skills: ['Authentication (JWT/OAuth)', 'Docker & Containers', 'CI/CD Pipelines', 'System Design'] }
  ],
  'Full Stack Development': [
    { title: 'Frontend Core', skills: ['HTML/CSS & JavaScript', 'React', 'Tailwind CSS', 'State Management'] },
    { title: 'Backend Core', skills: ['Node.js & Express', 'SQL & Postgres', 'RESTful APIs', 'NoSQL DBs'] },
    { title: 'DevOps & Tooling', skills: ['Git & Version Control', 'Docker & Containers', 'Cloud Deployment (AWS/Vercel)', 'Testing & CI/CD'] }
  ],
  'Mobile App Development': [
    { title: 'Core Languages', skills: ['JavaScript / TypeScript', 'Dart / Swift', 'Kotlin / Java', 'Object-Oriented Programming'] },
    { title: 'Frameworks & Native', skills: ['React Native', 'Flutter', 'Android SDK / iOS SDK', 'State Management'] },
    { title: 'API & Publishing', skills: ['API Integration', 'Mobile Storage (SQLite/Realm)', 'App Store Deployment', 'Mobile UX Patterns'] }
  ],
  'DevOps Engineering': [
    { title: 'OS & Administration', skills: ['Linux Administration', 'Shell Scripting (Bash)', 'Networking Fundamentals', 'Git & Version Control'] },
    { title: 'Containers & CI/CD', skills: ['Docker', 'Kubernetes', 'GitHub Actions / Jenkins', 'CI/CD Pipelines'] },
    { title: 'Infrastructure & Monitor', skills: ['Infrastructure as Code (Terraform)', 'Ansible / Configuration', 'Prometheus & Grafana', 'Cloud Platforms (AWS/Azure)'] }
  ],
  'Cloud Computing': [
    { title: 'Cloud Core', skills: ['Cloud Concepts (IaaS/PaaS)', 'AWS Core (EC2/S3/RDS)', 'Azure / GCP', 'Virtual Private Cloud'] },
    { title: 'Infrastructure & IAM', skills: ['Identity & Access (IAM)', 'Infrastructure as Code', 'Serverless (AWS Lambda)', 'Cloud Security'] },
    { title: 'Operations & Billing', skills: ['Kubernetes', 'Cloud Monitoring (CloudWatch)', 'Cost Management', 'High Availability'] }
  ],
  'Software Testing/QA': [
    { title: 'QA Foundations', skills: ['Manual Testing', 'SDLC & Agile Methodologies', 'Test Case Design', 'Bug Life Cycle'] },
    { title: 'Automation Core', skills: ['Selenium WebDriver', 'Playwright / Cypress', 'API Testing (Postman)', 'JavaScript / Python'] },
    { title: 'Performance & Tools', skills: ['JMeter (Performance Testing)', 'CI/CD Integration', 'SQL Queries', 'Jira / Bug Tracking'] }
  ],
  'Cybersecurity': [
    { title: 'Networking & Systems', skills: ['TCP/IP & Networking', 'Linux/Windows Security', 'Cryptography Basics', 'Active Directory'] },
    { title: 'Security Ops & Hacking', skills: ['Penetration Testing', 'OWASP Top 10', 'Wireshark & Packet Analysis', 'Firewalls & VPNs'] },
    { title: 'Compliance & Audit', skills: ['Incident Response', 'Security Standards (ISO/NIST)', 'SIEM Tools (Splunk)', 'Risk Management'] }
  ],
  'Data Science': [
    { title: 'Math & Language', skills: ['Python Programming', 'SQL Queries', 'Descriptive Statistics', 'Linear Algebra & Calculus'] },
    { title: 'Data Prep & Analysis', skills: ['Pandas & NumPy', 'Exploratory Data Analysis', 'Data Cleaning', 'Jupyter Notebooks'] },
    { title: 'Models & Visuals', skills: ['Data Visualization (Matplotlib/Seaborn)', 'Scikit-Learn (Basic Models)', 'R Programming', 'Tableau / PowerBI'] }
  ],
  'Machine Learning': [
    { title: 'Language & Libraries', skills: ['Python Programming', 'NumPy & Pandas', 'SQL & Relational DBs', 'Linear Algebra'] },
    { title: 'ML Core Algorithms', skills: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation (ROC/MSE)', 'Feature Engineering'] },
    { title: 'Tooling & Deployment', skills: ['Scikit-Learn', 'XGBoost / LightGBM', 'FastAPI / Flask', 'Git & Model Versioning'] }
  ],
  'Artificial Intelligence / Deep Learning': [
    { title: 'Deep Learning Core', skills: ['Neural Networks', 'PyTorch / TensorFlow', 'Linear Algebra & Calculus', 'Python Programming'] },
    { title: 'AI Specialized fields', skills: ['Natural Language Processing (NLP)', 'Computer Vision (CNNs)', 'Reinforcement Learning', 'Transformer Architectures'] },
    { title: 'Advanced LLMs & Ops', skills: ['Large Language Models (LLMs)', 'Model Fine-tuning (LoRA)', 'Vector Databases', 'GPU Optimization'] }
  ],
  'Data Engineering': [
    { title: 'Data Pipelines', skills: ['SQL & Database Design', 'Python Programming', 'ETL/ELT Development', 'API Data Extraction'] },
    { title: 'Big Data & Lakes', skills: ['Apache Spark / Hadoop', 'Data Warehouses (Snowflake)', 'Data Lakes (S3/Delta Lake)', 'NoSQL Databases'] },
    { title: 'Workflow & Cloud', skills: ['Apache Airflow / Prefect', 'Git & CI/CD', 'Docker', 'AWS / Azure Data Tools'] }
  ],
  'Game Development': [
    { title: 'Languages & Engines', skills: ['C# Programming', 'C++ Programming', 'Unity Engine', 'Unreal Engine'] },
    { title: 'Core Game Systems', skills: ['Game Physics & Mechanics', 'Game Loop & Logic', 'UI & Audio Integration', '2D/3D Math'] },
    { title: 'Graphics & Asset Pipeline', skills: ['Shaders & Rendering', 'Asset Importing/Optimization', 'Animation Pipelines', 'Multiplayer Networking'] }
  ],
  '3D Modeling & Animation': [
    { title: 'Modeling & Geometry', skills: ['Blender Basics', 'Hard Surface Modeling', 'Organic Sculpting', 'Mesh Topology'] },
    { title: 'Texturing & Rigging', skills: ['UV Unwrapping', 'Substance Painter / Materials', 'Skeletal Rigging', 'Weight Painting'] },
    { title: 'Animation & Rendering', skills: ['Keyframe Animation', 'Lighting & Shading', 'Rendering Engines (Eevee/Cycles)', 'Compositing / Post-process'] }
  ],
  'Blockchain Development': [
    { title: 'Core Cryptography', skills: ['Hashing & Cryptography', 'Consensus Mechanisms', 'Distributed Ledger Concepts', 'Smart Contract Security'] },
    { title: 'Ethereum & Solidity', skills: ['Solidity', 'Smart Contracts', 'Web3.js / Ethers.js', 'Hardhat / Truffle'] },
    { title: 'DApps & Tokens', skills: ['Decentralized Apps (dApps)', 'Token Standards (ERC-20/721)', 'Metamask / Wallet Integration', 'IPFS'] }
  ],
  'Embedded Systems/IoT': [
    { title: 'Hardware Programming', skills: ['C Programming', 'C++ Programming', 'Assembly Basics', 'Object-Oriented Programming'] },
    { title: 'Microcontrollers & RTOS', skills: ['Microcontroller Architectures (ARM)', 'Arduino / ESP32', 'Real-Time OS (FreeRTOS)', 'GPIO & Register Control'] },
    { title: 'Peripherals & Protocols', skills: ['I2C / SPI / UART Protocols', 'Sensor Interfacing', 'IoT Protocols (MQTT/HTTP)', 'Oscilloscope / Debugging'] }
  ],

  // 2. Design (4 tracks)
  'UI/UX Design': [
    { title: 'User Research', skills: ['User Interviews', 'Persona Development', 'Information Architecture', 'User Journey Mapping'] },
    { title: 'Interface & Prototype', skills: ['Wireframing', 'Figma Prototyping', 'Visual Design (UI)', 'Design Systems'] },
    { title: 'Evaluation & Hand-off', skills: ['Usability Testing', 'Interaction Design', 'Heuristic Evaluation', 'Design-to-Developer Handoff'] }
  ],
  'Graphic Design': [
    { title: 'Design Foundations', skills: ['Color Theory', 'Typography', 'Composition & Grid Layout', 'Branding & Identity'] },
    { title: 'Creative Tools', skills: ['Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign', 'Vector Assets Creation'] },
    { title: 'Publishing & Delivery', skills: ['Print Production', 'Digital Assets Exporting', 'UI Asset Prep', 'Creative Portfolio'] }
  ],
  'Motion Graphics & Video Editing': [
    { title: 'Video Editing Core', skills: ['Adobe Premiere Pro', 'DaVinci Resolve', 'Video Cut & Pacing', 'Color Grading'] },
    { title: 'Motion & Animation', skills: ['Adobe After Effects', 'Keyframing', 'Typography Animation', 'Visual Effects (VFX)'] },
    { title: 'Audio & Exporting', skills: ['Audio Noise Reduction', 'Sound Design & Mixing', 'Video Codecs & Compressions', 'Storyboarding'] }
  ],
  'Product Design': [
    { title: 'Usability & Research', skills: ['User Journey Mapping', 'Product Heuristics', 'Design Thinking Framework', 'Interaction Design'] },
    { title: 'Design System & Assets', skills: ['Figma Components', 'Design Token Management', 'Responsive Grid Systems', 'Prototyping Variables'] },
    { title: 'Market & Validation', skills: ['Usability Testing', 'A/B Test Design', 'Product Telemetry', 'Agile Product Lifecycle'] }
  ],

  // 3. Management/Business (7 tracks)
  'Business Analyst': [
    { title: 'Requirements & Flows', skills: ['Requirements Gathering', 'Process Mapping (BPMN)', 'Agile / Scrum Basics', 'User Story Writing'] },
    { title: 'Data Queries & Sheets', skills: ['Advanced Excel', 'SQL Queries', 'Data Visualization', 'Tableau / PowerBI'] },
    { title: 'Executive Presentation', skills: ['Stakeholder Management', 'Presentation Design', 'Business Valuation', 'Technical Writing'] }
  ],
  'Product Management': [
    { title: 'Strategy & Lifecycle', skills: ['Product Lifecycle Management', 'Product Strategy', 'Market Competitor Analysis', 'Product Roadmap Planning'] },
    { title: 'Execution & Agility', skills: ['Jira / Agile Methodologies', 'User Story Writing', 'UX Wireframing (Figma)', 'Feature Prioritization'] },
    { title: 'Analytics & Launch', skills: ['Product Analytics (Mixpanel/GA)', 'A/B Testing & Experiments', 'KPIs & Metric Tracking', 'Go-To-Market Strategy'] }
  ],
  'Digital Marketing': [
    { title: 'SEO & Content', skills: ['Search Engine Optimization (SEO)', 'Content Strategy & Copywriting', 'Keyword Research', 'Google Search Console'] },
    { title: 'Paid Ads & Email', skills: ['Google Ads (SEM)', 'Social Media Ads (Meta/LinkedIn)', 'Email Marketing (Mailchimp)', 'Retargeting Campaigns'] },
    { title: 'Analytics & Reporting', skills: ['Google Analytics 4', 'A/B Landing Page Testing', 'ROAS Tracking', 'Marketing Dashboards'] }
  ],
  'Finance & Investment Banking': [
    { title: 'Accounting & Analysis', skills: ['Financial Statement Analysis', 'Corporate Finance', 'Valuation Basics', 'Excel Financial Modeling'] },
    { title: 'Valuation Techniques', skills: ['Discounted Cash Flow (DCF)', 'Comparable Company Analysis (Multiples)', 'Precedent Transaction Analysis', 'LBO Basics'] },
    { title: 'Deals & Presentation', skills: ['M&A Fundamentals', 'Pitch Book Design', 'Macroeconomics', 'Financial Writing'] }
  ],
  'HR Management': [
    { title: 'Recruiting & Pipeline', skills: ['Recruiting Pipelines', 'Applicant Tracking (ATS)', 'Candidate Interviewing', 'Employer Branding'] },
    { title: 'Employee Operations', skills: ['Employee Onboarding', 'Conflict Resolution', 'Labor Laws & Compliance', 'Performance Review Systems'] },
    { title: 'HR Analytics', skills: ['HR Metrics Tracking', 'Compensation & Benefits', 'Employee Retention', 'Training & Development'] }
  ],
  'Operations Management': [
    { title: 'Supply Chain & Flow', skills: ['Supply Chain Logistics', 'Inventory Control', 'Warehouse Management', 'Procurement Strategy'] },
    { title: 'Process Optimization', skills: ['Lean Six Sigma', 'Process Flowcharting', 'Quality Control Standards', 'Root Cause Analysis'] },
    { title: 'Planning & Capacity', skills: ['Capacity Planning', 'Operations Scheduling', 'Vendor Management', 'Cost Optimization'] }
  ],
  'Consulting': [
    { title: 'Problem Solving & Math', skills: ['Case Interview Frameworks', 'Market Sizing / Guesstimates', 'MECE Problem Solving', 'Financial Statement Basics'] },
    { title: 'Slide Prep & Storytelling', skills: ['PowerPoint / Pitch Deck Design', 'Executive Storytelling', 'Structured Communication', 'Pyramid Principle'] },
    { title: 'Advisory Operations', skills: ['Client Relationship Mgmt', 'Market Research', 'Change Management', 'Strategy Advisory'] }
  ],

  // 4. Core Engineering (3 tracks)
  'Mechanical Engineering': [
    { title: 'Engineering Physics', skills: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Kinematics of Machinery'] },
    { title: 'CAD/CAM Tools', skills: ['SolidWorks Modeling', 'AutoCAD Drafting', 'ANSYS Simulation', 'Geometric Dimensioning & Tolerancing'] },
    { title: 'Manufacturing Operations', skills: ['CNC Programming', 'Material Science', 'Quality Inspection', 'Industrial Automation'] }
  ],
  'Electrical & Electronics Engineering': [
    { title: 'Circuitry & Signal', skills: ['Analog Circuit Design', 'Digital Electronics', 'Signal Processing', 'Network Theory'] },
    { title: 'Power & Microcontrol', skills: ['Microcontrollers (Arduino/STM32)', 'Power System Engineering', 'Control Systems Design', 'Matlab Simulation'] },
    { title: 'Simulation & Design', skills: ['Verilog / VHDL Design', 'PCB Layout Design', 'Embedded C', 'Oscilloscope Debugging'] }
  ],
  'Civil Engineering': [
    { title: 'Structural Core', skills: ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering', 'Strength of Materials'] },
    { title: 'Drafting & Estimating', skills: ['AutoCAD Structural', 'Revit 3D Design', 'Quantity Surveying', 'Cost Estimation'] },
    { title: 'Site Operations', skills: ['Land Surveying', 'Construction Management', 'Environmental Engineering', 'Project Scheduling'] }
  ]
};

export const getSkillGroups = (domainName) => {
  return SKILL_GROUPS_BY_DOMAIN[domainName] || [
    { title: 'Core Fundamentals', skills: ['Problem Solving', 'Data & SQL', 'Git / Version Control', 'Basic Programming'] },
    { title: 'Advanced Concepts', skills: ['Frameworks & Tools', 'System Architecture', 'APIs & Integration', 'Agile Methodologies'] },
    { title: 'QA & Best Practices', skills: ['Testing & Debugging', 'Deployment & CI/CD', 'Documentation', 'Security Practices'] }
  ];
};

export default function Step3Skills() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const domainGoal = watch('domainGoal');
  const skills = watch('skills') || [];
  const [customSkill, setCustomSkill] = useState('');

  const activeDomain = domainGoal || 'Frontend Development';
  const skillGroups = getSkillGroups(activeDomain);

  const addSkill = (skillName, level = '3') => {
    if (!skillName.trim()) return;
    
    if (skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
      return;
    }

    const newSkills = [...skills, { name: skillName.trim(), level }];
    setValue('skills', newSkills, { shouldValidate: true });
    setCustomSkill('');
  };

  const removeSkill = (indexToRemove) => {
    const newSkills = skills.filter((_, idx) => idx !== indexToRemove);
    setValue('skills', newSkills, { shouldValidate: true });
  };

  const handleLevelChange = (indexToUpdate, newLevel) => {
    const newSkills = skills.map((skill, idx) => {
      if (idx === indexToUpdate) {
        return { ...skill, level: newLevel };
      }
      return skill;
    });
    setValue('skills', newSkills, { shouldValidate: true });
  };

  return (
    <div className="animate-fade-in text-left">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold font-heading text-text-primary mb-1">
          Assess Your Skills <span className="text-error font-semibold">*</span>
        </h3>
        <p className="text-sm text-text-secondary">
          Select the skills you already have in <span className="text-accent font-semibold">{activeDomain}</span> and rate your proficiency from 1 (Beginner) to 5 (Expert).
        </p>
      </div>

      {/* Skill recommendations by sub-domain cards */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-1.5 text-accent font-heading font-semibold text-sm">
          <Sparkles size={16} />
          <span>Skills Grouped by Area</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skillGroups.map((group) => (
            <div 
              key={group.title} 
              className="bg-bg-secondary border border-border-color/60 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold font-heading text-text-primary uppercase tracking-wider mb-3 pb-1.5 border-b border-border-color/40">
                  {group.title}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => {
                    const isAdded = skills.some(s => s.name.toLowerCase() === skill.toLowerCase());
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`px-2.5 py-1.5 border rounded-lg text-[11px] font-medium transition duration-150 cursor-pointer outline-none select-none
                          ${isAdded 
                            ? 'bg-accent/10 border-accent text-accent' 
                            : 'bg-bg-card border-border-color text-text-secondary hover:border-text-secondary hover:text-text-primary'}`}
                        onClick={() => {
                          if (isAdded) {
                            const idx = skills.findIndex(s => s.name.toLowerCase() === skill.toLowerCase());
                            removeSkill(idx);
                          } else {
                            addSkill(skill);
                          }
                        }}
                      >
                        {skill}
                        {isAdded ? ' ✓' : ' +'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Skill Form */}
      <div className="flex flex-col items-start w-full mb-6">
        <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="custom-skill">
          Add Custom Skill
        </label>
        <div className="flex gap-2.5 w-full">
          <input
            id="custom-skill"
            type="text"
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
            placeholder="e.g. Docker, TypeScript, Public Speaking..."
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
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Added Skills List */}
      <div className="w-full">
        <label className="block text-xs font-semibold font-heading text-text-primary mb-3">
          Your Skill List ({skills.length})
        </label>
        
        {skills.length === 0 ? (
          <div className="text-center p-6 bg-bg-secondary border border-dashed border-border-color rounded-lg text-text-secondary text-sm">
            No skills added yet. Select from recommendations or add a custom skill.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 px-4 bg-bg-secondary border border-border-color rounded-lg"
              >
                <span className="font-semibold text-sm text-text-primary">{skill.name}</span>
                <div className="flex items-center gap-4">
                  
                  {/* Interactive circle 1-5 rating range */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const isActive = Number(skill.level) >= num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleLevelChange(index, String(num))}
                          title={`Proficiency Level: ${num}/5`}
                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition duration-200 cursor-pointer select-none outline-none
                            ${isActive
                              ? 'bg-accent border-accent text-black shadow-[0_0_8px_rgba(255,230,0,0.2)]'
                              : 'bg-bg-card border-border-color text-text-secondary hover:border-text-secondary'}`}
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
                    title="Remove Skill"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {errors.skills && (
        <p className="text-xs text-error mt-3 font-medium text-center">{errors.skills.message}</p>
      )}
    </div>
  );
}
