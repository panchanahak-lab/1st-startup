
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---

interface EducationItem {
  id: number;
  degree: string;
  school: string;
  year: string;
  grade: string;
}

interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  date: string;
  description: string;
}

interface ResumeData {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  website: string;
  targetRole: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  hardSkills: string;   
  softSkills: string;   
  certifications: string;
  languages: string;
}

type TemplateType = 'classic' | 'modern' | 'ivy';

const INITIAL_DATA: ResumeData = {
  fullName: 'Alex Morgan',
  targetRole: 'Senior Frontend Developer',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexmorgan',
  website: 'alexmorgan.dev',
  summary: 'Experienced professional with a passion for technology and user-centric design. Proven track record of delivering high-quality web applications using modern JavaScript frameworks.',
  education: [
    { id: 1, degree: 'B.S. Computer Science', school: 'University of Technology', year: '2018', grade: '3.8 GPA' }
  ],
  experience: [
    { id: 1, role: 'Frontend Developer', company: 'Tech Solutions Inc', date: 'Jan 2019 - Present', description: 'Responsbile for building the main website using React and ensuring it works on mobile devices.' }
  ],
  hardSkills: 'React, TypeScript, Tailwind CSS, Node.js, GraphQL, AWS, Docker',
  softSkills: 'Leadership, Communication, Problem Solving, Agile Methodology',
  certifications: 'AWS Certified Cloud Practitioner (2020)',
  languages: 'English (Native), Spanish (Conversational)'
};

const EMPTY_DATA: ResumeData = {
  fullName: '', targetRole: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '',
  education: [], experience: [], hardSkills: '', softSkills: '', certifications: '', languages: ''
};

const ResumeBuilder: React.FC = () => {
  // Robust initialization to prevent crashes from bad localStorage data
  const [data, setData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('nextstep_resume_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with INITIAL_DATA structure to ensure all fields (especially arrays) exist
        return {
          ...INITIAL_DATA,
          ...parsed,
          // Explicitly fallback to empty arrays if they are undefined in saved data
          education: Array.isArray(parsed.education) ? parsed.education : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          // Ensure strings exist
          fullName: parsed.fullName || '',
          summary: parsed.summary || ''
        };
      }
    } catch (e) {
      console.error("Failed to parse resume data", e);
    }
    return INITIAL_DATA;
  });

  const [auditIssues, setAuditIssues] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('contact');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('classic');
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('nextstep_resume_data', JSON.stringify(data));
  }, [data]);

  // Handle Mobile Scaling for A4 Preview
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current && window.innerWidth < 1280) {
        const containerWidth = previewRef.current.parentElement?.clientWidth || window.innerWidth;
        const scale = (containerWidth - 32) / 794; 
        setPreviewScale(Math.min(scale, 1));
      } else {
        setPreviewScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance Audit
  useEffect(() => {
    const issues: string[] = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) issues.push("Valid email required.");
    if (data.phone.length < 8) issues.push("Phone number seems short.");
    if (data.summary.split(' ').length < 10) issues.push("Summary is too short.");
    if (data.experience.length === 0) issues.push("Add at least one work experience.");
    setAuditIssues(issues);
  }, [data]);

  const enhanceBullet = async (id: number, text: string) => {
    if (!text) return;
    setLoadingId(id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Rewrite this resume bullet point professionally. Use the 'Action + Context + Result' framework. Keep it under 25 words. Text: "${text}"`,
      });
      const enhancedText = response.text?.trim();
      if (enhancedText) {
        setData(prev => ({
          ...prev,
          experience: prev.experience.map(e => e.id === id ? { ...e, description: enhancedText } : e)
        }));
      }
    } catch (e) {
      alert("AI enhancement failed. Check your API key.");
    } finally {
      setLoadingId(null);
    }
  };

  const clearData = () => { if(confirm("Are you sure you want to clear all data?")) setData(EMPTY_DATA); };
  const loadExample = () => setData(INITIAL_DATA);

  // Template Renderers
  const ClassicTemplate = () => (
    <div className="p-[15mm] text-navy-900 flex flex-col font-sans text-[11pt] bg-white h-full min-h-[297mm]">
      <header className="border-b-2 border-navy-900 pb-4 mb-5">
        <h1 className="text-3xl font-bold uppercase mb-1">{data.fullName || 'YOUR NAME'}</h1>
        <h2 className="text-lg font-medium text-brand-600 uppercase tracking-widest">{data.targetRole || 'TARGET ROLE'}</h2>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>LinkedIn</span>}
        </div>
      </header>

      <section className="mb-5 no-break">
        <h3 className="text-xs font-bold uppercase border-b pb-0.5 mb-2">Profile</h3>
        <p className="text-xs text-justify leading-relaxed">{data.summary}</p>
      </section>

      <section className="mb-5">
        <h3 className="text-xs font-bold uppercase border-b pb-0.5 mb-2">Experience</h3>
        {/* ADDED SAFETY CHECK data.experience?.map */}
        {data.experience?.map(exp => (
          <div key={exp.id} className="mb-4 no-break">
            <div className="flex justify-between font-bold text-xs">
              <span className="uppercase">{exp.role}</span>
              <span>{exp.date}</span>
            </div>
            <div className="text-xs text-brand-600 italic mb-1">{exp.company}</div>
            <p className="text-xs whitespace-pre-line leading-snug">{exp.description}</p>
          </div>
        ))}
      </section>

      <section className="mb-5 no-break">
        <h3 className="text-xs font-bold uppercase border-b pb-0.5 mb-2">Education</h3>
        {/* ADDED SAFETY CHECK data.education?.map */}
        {data.education?.map(edu => (
          <div key={edu.id} className="mb-2 flex justify-between text-xs">
            <div><span className="font-bold">{edu.degree}</span> - {edu.school}</div>
            <div>{edu.year}</div>
          </div>
        ))}
      </section>

      {(data.hardSkills || data.languages || data.certifications) && (
        <section className="no-break">
          <h3 className="text-xs font-bold uppercase border-b pb-0.5 mb-2">Skills & Additional Info</h3>
          <div className="text-xs space-y-1">
            {data.hardSkills && <p><span className="font-bold">Skills:</span> {data.hardSkills}</p>}
            {data.languages && <p><span className="font-bold">Languages:</span> {data.languages}</p>}
            {data.certifications && <p><span className="font-bold">Certs:</span> {data.certifications}</p>}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <section id="builder" className="py-20 bg-slate-50 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="text-center mb-10 print:hidden">
          <h2 className="text-4xl font-bold text-navy-900 font-heading">Smart Resume Builder</h2>
          <p className="text-slate-500 mt-2">Fill the form and watch your resume come to life.</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* EDITOR */}
          <div className="w-full xl:w-[480px] space-y-4 print:hidden shrink-0 h-fit xl:sticky xl:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
             <div className="flex gap-3">
               <button onClick={loadExample} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">Load Example</button>
               <button onClick={clearData} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-colors">Reset Form</button>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <button onClick={() => setActiveSection(activeSection === 'contact' ? '' : 'contact')} className="w-full px-6 py-4 text-left font-bold text-navy-900 border-b flex justify-between">1. Contact Info <i className={`fas fa-chevron-${activeSection === 'contact' ? 'up' : 'down'} opacity-40`}></i></button>
                {activeSection === 'contact' && (
                  <div className="p-6 space-y-4 animate-fade-in">
                    <div className="space-y-3">
                      <input placeholder="Full Name" value={data.fullName} onChange={e => setData(d => ({...d, fullName: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                      <input placeholder="Target Role" value={data.targetRole} onChange={e => setData(d => ({...d, targetRole: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Email" value={data.email} onChange={e => setData(d => ({...d, email: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                        <input placeholder="Phone" value={data.phone} onChange={e => setData(d => ({...d, phone: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                      </div>
                      <input placeholder="Location" value={data.location} onChange={e => setData(d => ({...d, location: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                    </div>
                  </div>
                )}

                <button onClick={() => setActiveSection(activeSection === 'summary' ? '' : 'summary')} className="w-full px-6 py-4 text-left font-bold text-navy-900 border-b flex justify-between">2. Summary <i className={`fas fa-chevron-${activeSection === 'summary' ? 'up' : 'down'} opacity-40`}></i></button>
                {activeSection === 'summary' && (
                  <div className="p-6">
                    <textarea value={data.summary} onChange={e => setData(d => ({...d, summary: e.target.value}))} className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Professional overview..." />
                  </div>
                )}

                <button onClick={() => setActiveSection(activeSection === 'experience' ? '' : 'experience')} className="w-full px-6 py-4 text-left font-bold text-navy-900 border-b flex justify-between">3. Experience <i className={`fas fa-chevron-${activeSection === 'experience' ? 'up' : 'down'} opacity-40`}></i></button>
                {activeSection === 'experience' && (
                  <div className="p-6 space-y-6">
                    {data.experience?.map((exp, i) => (
                      <div key={exp.id} className="p-4 border rounded-xl bg-slate-50 relative group">
                        <button onClick={() => setData(d => ({...d, experience: d.experience.filter(e => e.id !== exp.id)}))} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all"><i className="fas fa-times"></i></button>
                        <input placeholder="Role" className="w-full mb-2 p-3 border rounded-lg text-sm font-bold" value={exp.role} onChange={e => {
                          const exps = [...data.experience]; exps[i].role = e.target.value; setData(d => ({...d, experience: exps}));
                        }} />
                        <input placeholder="Company" className="w-full mb-2 p-3 border rounded-lg text-sm" value={exp.company} onChange={e => {
                          const exps = [...data.experience]; exps[i].company = e.target.value; setData(d => ({...d, experience: exps}));
                        }} />
                        <textarea placeholder="Bullet Points..." className="w-full p-3 border rounded-lg text-sm h-24" value={exp.description} onChange={e => {
                          const exps = [...data.experience]; exps[i].description = e.target.value; setData(d => ({...d, experience: exps}));
                        }} />
                        <button onClick={() => enhanceBullet(exp.id, exp.description)} className="mt-2 text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest"><i className="fas fa-magic mr-1"></i> Enhance with AI</button>
                      </div>
                    ))}
                    <button onClick={() => setData(d => ({...d, experience: [...(d.experience || []), { id: Date.now(), role: '', company: '', date: '', description: '' }]}))} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-400 font-bold text-xs rounded-xl hover:border-brand-500 hover:text-brand-500 transition-all">+ Add Position</button>
                  </div>
                )}

                <button onClick={() => setActiveSection(activeSection === 'education' ? '' : 'education')} className="w-full px-6 py-4 text-left font-bold text-navy-900 border-b flex justify-between">4. Education <i className={`fas fa-chevron-${activeSection === 'education' ? 'up' : 'down'} opacity-40`}></i></button>
                {activeSection === 'education' && (
                  <div className="p-6 space-y-4">
                    {data.education?.map((edu, i) => (
                      <div key={edu.id} className="p-4 border rounded-xl bg-slate-50 relative">
                        <input placeholder="Degree" className="w-full mb-2 p-3 border rounded-lg text-sm font-bold" value={edu.degree} onChange={e => {
                          const edus = [...data.education]; edus[i].degree = e.target.value; setData(d => ({...d, education: edus}));
                        }} />
                        <input placeholder="University" className="w-full p-3 border rounded-lg text-sm" value={edu.school} onChange={e => {
                          const edus = [...data.education]; edus[i].school = e.target.value; setData(d => ({...d, education: edus}));
                        }} />
                      </div>
                    ))}
                    <button onClick={() => setData(d => ({...d, education: [...(d.education || []), { id: Date.now(), degree: '', school: '', year: '', grade: '' }]}))} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-400 font-bold text-xs rounded-xl hover:border-brand-500 hover:text-brand-500 transition-all">+ Add Degree</button>
                  </div>
                )}

                <button onClick={() => setActiveSection(activeSection === 'extras' ? '' : 'extras')} className="w-full px-6 py-4 text-left font-bold text-navy-900 flex justify-between">5. Skills & Languages <i className={`fas fa-chevron-${activeSection === 'extras' ? 'up' : 'down'} opacity-40`}></i></button>
                {activeSection === 'extras' && (
                  <div className="p-6 space-y-4 animate-fade-in">
                    <textarea placeholder="Skills (Comma separated)" value={data.hardSkills} onChange={e => setData(d => ({...d, hardSkills: e.target.value}))} className="w-full p-3 border rounded-lg text-sm h-20" />
                    <input placeholder="Languages (e.g. English, French)" value={data.languages} onChange={e => setData(d => ({...d, languages: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                    <input placeholder="Certifications" value={data.certifications} onChange={e => setData(d => ({...d, certifications: e.target.value}))} className="w-full p-3 border rounded-lg text-sm" />
                  </div>
                )}
             </div>
          </div>

          {/* PREVIEW */}
          <div className="flex-1 flex flex-col items-center">
             <div className="mb-6 flex gap-4 print:hidden">
                <button onClick={() => setActiveTemplate('classic')} className={`px-5 py-2 text-xs font-bold border rounded-full transition-all ${activeTemplate === 'classic' ? 'bg-navy-900 text-white shadow-lg' : 'bg-white text-slate-600'}`}>Classic ATS</button>
                <button onClick={() => window.print()} className="px-5 py-2 text-xs font-bold bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-all"><i className="fas fa-download mr-2"></i>Export PDF</button>
             </div>
             
             <div className="w-full flex justify-center overflow-x-hidden bg-slate-200/50 p-4 md:p-10 rounded-3xl border border-slate-300/50 shadow-inner print:bg-white print:p-0 print:border-none print:shadow-none">
                <div 
                  id="resume-preview" 
                  ref={previewRef}
                  className="bg-white shadow-2xl origin-top transition-transform duration-300 printable-content" 
                  style={{ 
                    width: '210mm', 
                    minHeight: '297mm',
                    transform: `scale(${previewScale})`,
                    marginBottom: `-${(1 - previewScale) * 100}%`
                  }}
                >
                  {activeTemplate === 'classic' && <ClassicTemplate />}
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilder;
