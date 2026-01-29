
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLocation } from 'react-router-dom';
import { verifyCredits, ToolAccessError } from '../lib/toolAccess';
import { CREDIT_COSTS } from '../lib/pricing';
import { useAuth } from '../lib/AuthContext';

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
  location: string;
  date: string;
  bullets: string[];
}

interface LanguageItem {
  id: number;
  name: string;
  level: string;
}

interface CertificationItem {
  id: number;
  name: string;
  issuer: string;
  date: string;
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
  certifications: CertificationItem[];
  languages: LanguageItem[];
}

type TemplateType = 'classic' | 'modern' | 'creative' | 'academic';

const INITIAL_DATA: ResumeData = {
  fullName: 'YOUR NAME',
  targetRole: 'Target Role',
  email: 'email@example.com',
  phone: '+1 (555) 000-0000',
  location: 'City, Country',
  linkedin: 'linkedin.com/in/username',
  website: 'yourwebsite.com',
  summary: 'Professional summary goes here. Describe your background, key achievements, and what you bring to the role.',
  education: [
    { id: 1, degree: 'Degree / Major', school: 'University Name', year: 'Year', grade: 'GPA (Optional)' }
  ],
  experience: [
    {
      id: 1,
      role: 'Job Title',
      company: 'Company Name',
      location: 'City, Country',
      date: 'Date Period',
      bullets: [
        'Describe your key responsibilities and achievements here.',
        'Use action verbs and quantify your results where possible.',
        'Focus on what you accomplished, not just what you did.'
      ]
    }
  ],
  hardSkills: 'Skill 1, Skill 2, Skill 3, Skill 4, Skill 5',
  softSkills: 'Soft Skill 1, Soft Skill 2, Soft Skill 3',
  certifications: [
    { id: 1, name: 'Certification Name', issuer: 'Issuer', date: 'Year' }
  ],
  languages: [
    { id: 1, name: 'Language', level: 'Fluency Level' }
  ]
};

const EMPTY_DATA: ResumeData = {
  fullName: '', targetRole: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '',
  education: [], experience: [], hardSkills: '', softSkills: '', certifications: [], languages: []
};

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Professional', 'Conversational', 'Elementary'];

const ResumeBuilder: React.FC = () => {
  const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

  const [data, setData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('nextstep_resume_data');
      if (saved) {
        const parsed = JSON.parse(saved);

        // MIGRATION FIX: If the saved data is the old dummy "Alex Morgan", 
        // discard it and use the new generic placeholders.
        if (parsed.fullName === 'Alex Morgan' && parsed.email === 'alex.morgan@example.com') {
          return clone(INITIAL_DATA);
        }

        const migratedExperience = (parsed.experience || []).map((exp: any) => ({
          ...exp,
          location: exp.location || '',
          bullets: exp.bullets || (exp.description ? exp.description.split('\n').filter((l: string) => l.trim()) : [''])
        }));
        const migratedLanguages = Array.isArray(parsed.languages) && parsed.languages.length > 0 && typeof parsed.languages[0] === 'object'
          ? parsed.languages
          : typeof parsed.languages === 'string'
            ? parsed.languages.split(',').map((l: string, i: number) => ({ id: Date.now() + i, name: l.trim(), level: 'Conversational' }))
            : [];

        const migratedCertifications = Array.isArray(parsed.certifications)
          ? parsed.certifications
          : typeof parsed.certifications === 'string' && parsed.certifications.length > 0
            ? [{ id: Date.now(), name: parsed.certifications, issuer: '', date: '' }]
            : [];

        return { ...clone(INITIAL_DATA), ...parsed, experience: migratedExperience, languages: migratedLanguages, certifications: migratedCertifications };
      }
    } catch (e) { console.error(e); }
    return clone(INITIAL_DATA);
  });

  const { user } = useAuth();
  const [loadingBullet, setLoadingBullet] = useState<{ expId: number, index: number } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('experience');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('modern');
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor'); // For mobile
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('nextstep_resume_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      if (isAutoFit && previewRef.current) {
        const container = previewRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth - 32; // Responsive padding
          const scale = containerWidth / 794;
          setPreviewScale(Math.min(scale, 0.85));
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAutoFit, viewMode]);

  // AUTO-PRINT Logic for "Apply & Export" feature
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('autoprint') === 'true') {
      // Small delay to ensure rendering is done before print dialog
      setTimeout(() => {
        window.print();
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }, 800);
    }
  }, [location]);

  const enhanceBullet = async (expId: number, index: number) => {
    const text = data.experience.find(e => e.id === expId)?.bullets[index];
    if (!text) return;

    setLoadingBullet({ expId, index });
    try {
      await verifyCredits(user, CREDIT_COSTS.AI_BULLET_ENHANCE);

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        alert("Please set your valid VITE_GEMINI_API_KEY in environment variables (.env file).");
        setLoadingBullet(null);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(`Rewrite this resume bullet point professionally using action verbs for a ${data.targetRole} position: "${text}"`);
      const enhancedText = result.response.text().trim();
      if (enhancedText) {
        setData(prev => ({
          ...prev,
          experience: prev.experience.map(e => e.id === expId
            ? { ...e, bullets: e.bullets.map((b, i) => i === index ? enhancedText : b) }
            : e
          )
        }));
      }
    } catch (e: any) {
      console.error("AI Enhancement Error:", e);
      if (e instanceof ToolAccessError) {
        alert(e.message);
      } else {
        alert(`AI enhancement failed: ${e.message || JSON.stringify(e)}`);
      }
    } finally { setLoadingBullet(null); }
  };

  const updateExperience = (id: number, field: keyof ExperienceItem, value: any) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const addBullet = (expId: number) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e)
    }));
  };

  const updateBullet = (expId: number, index: number, value: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === index ? value : b) } : e)
    }));
  };

  const removeBullet = (expId: number, index: number) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) } : e)
    }));
  };

  const addLanguage = () => {
    setData(prev => ({
      ...prev,
      languages: [...prev.languages, { id: Date.now(), name: '', level: 'Professional' }]
    }));
  };

  const updateLanguage = (id: number, field: keyof LanguageItem, value: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  const updateEducation = (id: number, field: keyof EducationItem, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const updateCertification = (id: number, field: keyof CertificationItem, value: string) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => cert.id === id ? { ...cert, [field]: value } : cert)
    }));
  };

  const clearData = () => { if (confirm("Clear all data?")) setData(clone(EMPTY_DATA)); };
  const loadExample = () => { setData(clone(INITIAL_DATA)); };

  const handleDownload = () => {
    window.print();
  };

  // --- TEMPLATES ---

  const ClassicTemplate = () => (
    <div className="p-[20mm] text-slate-900 flex flex-col font-sans text-[11pt] bg-white h-full min-h-[290mm]">
      <header className="border-b-2 border-slate-900 pb-4 md:pb-6 mb-6 md:mb-8 text-center">
        <h1 className="text-4xl font-bold uppercase mb-2 tracking-tight">{data.fullName || 'YOUR NAME'}</h1>
        <h2 className="text-lg font-bold text-brand-600 uppercase tracking-[0.2em]">{data.targetRole || 'TARGET ROLE'}</h2>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-slate-500 mt-4 font-medium">
          {data.phone && <span className="flex items-center gap-1"><i className="fas fa-phone text-[8px]"></i> {data.phone}</span>}
          {data.email && <span className="flex items-center gap-1"><i className="fas fa-envelope text-[8px]"></i> {data.email}</span>}
          {data.location && <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt text-[8px]"></i> {data.location}</span>}
        </div>
      </header>

      <section className="mb-8">
        <h3 className="text-[10pt] font-black uppercase border-b border-slate-900 pb-1 mb-6 tracking-widest">Experience</h3>
        {data.experience?.map(exp => (
          <div key={exp.id} className="mb-8 break-inside-avoid page-break-inside-avoid">
            <div className="flex flex-row justify-between font-bold text-sm mb-1">
              <span className="uppercase text-slate-900">{exp.role}</span>
              <span className="text-slate-500">{exp.date}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-brand-600 font-bold uppercase tracking-wider">{exp.company}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exp.location}</span>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              {exp.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} className="text-sm text-slate-700 leading-snug">{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-12 mt-auto">
        <section>
          <h3 className="text-[10pt] font-black uppercase border-b border-slate-900 pb-1 mb-4 tracking-widest">Education</h3>
          {data.education?.map(edu => (
            <div key={edu.id} className="mb-3 break-inside-avoid page-break-inside-avoid">
              <p className="font-bold text-sm">{edu.degree}</p>
              <p className="text-sm text-slate-600">{edu.school} • {edu.year}</p>
            </div>
          ))}
        </section>
        {data.certifications && data.certifications.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[10pt] font-black uppercase border-b border-slate-900 pb-1 mb-4 tracking-widest">Certifications</h3>
            {data.certifications.map(cert => (
              <div key={cert.id} className="mb-2 break-inside-avoid page-break-inside-avoid">
                <p className="font-bold text-sm">{cert.name}</p>
                <p className="text-sm text-slate-600">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </section>
        )}
        <section>
          <h3 className="text-[10pt] font-black uppercase border-b border-slate-900 pb-1 mb-4 tracking-widest">Languages</h3>
          <div className="space-y-1">
            {data.languages.map(l => (
              <p key={l.id} className="text-sm font-medium text-slate-700 break-inside-avoid page-break-inside-avoid">{l.name} — <span className="italic text-slate-400">{l.level}</span></p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const ModernTemplate = () => (
    <div className="flex flex-row bg-white h-full min-h-[290mm] font-sans">
      <div className="w-[32%] bg-navy-950 p-10 text-white">
        <div className="mb-12">
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">{data.fullName || 'NAME'}</h1>
          <h2 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.3em]">{data.targetRole || 'ROLE'}</h2>
        </div>
        <div className="space-y-12">
          <section className="break-inside-avoid page-break-inside-avoid">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 border-b border-white/5 pb-2">Technical</h3>
            <div className="flex flex-wrap gap-2">
              {data.hardSkills.split(',').map((s, i) => (
                <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md font-bold">{s.trim()}</span>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 border-b border-white/5 pb-2">Languages</h3>
            <div className="grid grid-cols-1 gap-4">
              {data.languages.map(l => (
                <div key={l.id}>
                  <p className="text-xs font-bold text-white">{l.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{l.level}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="w-[68%] p-16">
        <section className="mb-16">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 flex items-center gap-4">
            <span className="w-8 h-[2px] bg-brand-500"></span> Experience
          </h3>
          <div className="space-y-12">
            {data.experience?.map(exp => (
              <div key={exp.id} className="relative pl-10 break-inside-avoid page-break-inside-avoid">
                <div className="absolute left-0 top-1 w-3 h-3 bg-brand-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                <div className="absolute left-[5px] top-4 w-[2px] h-[calc(100%+3rem)] bg-slate-100 last:hidden"></div>

                <div className="flex flex-row justify-between items-baseline mb-2">
                  <span className="font-black text-lg text-navy-900 tracking-tight">{exp.role}</span>
                  <span className="text-[10px] text-brand-500 font-black uppercase tracking-widest">{exp.date}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{exp.company}</span>
                  <span className="block w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{exp.location}</span>
                </div>
                <ul className="space-y-3">
                  {exp.bullets.filter(b => b.trim()).map((b, i) => (
                    <li key={i} className="text-[13px] text-slate-600 leading-relaxed relative flex gap-3">
                      <span className="text-brand-500 mt-1.5">•</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {data.education && data.education.length > 0 && (
          <section className="mb-16">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 flex items-center gap-4">
              <span className="w-8 h-[2px] bg-brand-500"></span> Education
            </h3>
            <div className="space-y-8">
              {data.education.map(edu => (
                <div key={edu.id} className="relative pl-10 break-inside-avoid page-break-inside-avoid">
                  <div className="absolute left-0 top-1 w-3 h-3 bg-slate-200 rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="absolute left-[5px] top-4 w-[2px] h-[calc(100%+3rem)] bg-slate-100 last:hidden"></div>

                  <div className="flex flex-row justify-between items-baseline mb-1">
                    <span className="font-black text-lg text-navy-900 tracking-tight">{edu.degree}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{edu.year}</span>
                  </div>
                  <p className="text-xs text-brand-500 font-bold uppercase tracking-wider mb-1">{edu.school}</p>
                  {edu.grade && <p className="text-[13px] text-slate-500">{edu.grade}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 flex items-center gap-4">
              <span className="w-8 h-[2px] bg-brand-500"></span> Certifications
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {data.certifications.map(cert => (
                <div key={cert.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 break-inside-avoid page-break-inside-avoid">
                  <p className="font-black text-sm text-navy-900 mb-1">{cert.name}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{cert.issuer} • {cert.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div className="bg-white h-full min-h-[290mm] font-sans text-slate-800">
      <header className="bg-gradient-to-br from-navy-900 to-navy-950 p-16 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32"></div>
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 relative z-10">{data.fullName || 'YOUR NAME'}</h1>
        <h2 className="text-xl font-bold text-brand-400 uppercase tracking-[0.5em] relative z-10">{data.targetRole || 'TARGET ROLE'}</h2>
      </header>
      <div className="grid grid-cols-[320px_1fr]">
        <aside className="bg-slate-50/50 p-12 border-r border-slate-100">
          <section className="mb-12">
            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-6 border-b-2 border-brand-500/20 pb-2">Technical</h3>
            <div className="flex flex-wrap gap-2">
              {data.hardSkills.split(',').map((s, i) => (
                <span key={i} className="bg-white text-navy-900 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm">{s.trim()}</span>
              ))}
            </div>

            {data.education && data.education.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter mb-12 flex items-center gap-4">
                  Education <span className="h-px flex-1 bg-slate-100"></span>
                </h3>
                <div className="space-y-10">
                  {data.education.map(edu => (
                    <div key={edu.id} className="break-inside-avoid page-break-inside-avoid">
                      <div className="flex flex-row justify-between items-baseline mb-2">
                        <h4 className="text-xl font-black text-navy-900 uppercase tracking-tight">{edu.degree}</h4>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{edu.year}</span>
                      </div>
                      <p className="text-xs font-black text-brand-600 uppercase tracking-widest">{edu.school}</p>
                      {edu.grade && <p className="text-sm text-slate-500 mt-1">{edu.grade}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.certifications && data.certifications.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter mb-12 flex items-center gap-4">
                  Certifications <span className="h-px flex-1 bg-slate-100"></span>
                </h3>
                <div className="flex flex-wrap gap-6">
                  {data.certifications.map(cert => (
                    <div key={cert.id} className="relative pl-4 border-l-2 border-brand-500 break-inside-avoid page-break-inside-avoid">
                      <p className="font-black text-base text-navy-900">{cert.name}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          <section>
            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-6 border-b-2 border-brand-500/20 pb-2">Fluent In</h3>
            <div className="space-y-4">
              {data.languages.map(l => (
                <div key={l.id} className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-navy-900">{l.name}</span>
                  <span className="text-brand-500 uppercase tracking-widest">{l.level}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
        <main className="p-16">
          <section>
            <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter mb-12 flex items-center gap-4">
              Professional Story <span className="h-px flex-1 bg-slate-100"></span>
            </h3>
            <div className="space-y-16">
              {data.experience?.map(exp => (
                <div key={exp.id} className="relative group break-inside-avoid page-break-inside-avoid">
                  <div className="mb-6">
                    <div className="flex flex-row justify-between items-center mb-1">
                      <h4 className="text-xl font-black text-navy-900 uppercase tracking-tight group-hover:text-brand-500 transition-colors">{exp.role}</h4>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{exp.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-black text-brand-600 uppercase tracking-widest">{exp.company}</p>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exp.location}</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mt-6 border-l-2 border-slate-50 pl-6">
                    {exp.bullets.filter(b => b.trim()).map((b, i) => (
                      <li key={i} className="text-[13px] text-slate-500 leading-relaxed font-medium">{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );

  const AcademicTemplate = () => (
    <div className="p-[25mm] bg-white h-full min-h-[290mm] font-serif text-slate-900">
      <header className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">{data.fullName || 'YOUR NAME'}</h1>
        <div className="flex flex-wrap justify-center gap-8 text-sm italic text-slate-400">
          {data.email && <span>{data.email}</span>}
          <span className="inline">•</span>
          {data.phone && <span>{data.phone}</span>}
          <span className="inline">•</span>
          {data.location && <span>{data.location}</span>}
        </div>
      </header>

      {data.education && data.education.length > 0 && (
        <section className="mb-12">
          <h3 className="text-base font-bold uppercase tracking-[0.3em] text-slate-300 mb-8 border-b border-slate-100 pb-2">Education</h3>
          {data.education.map(edu => (
            <div key={edu.id} className="mb-6 break-inside-avoid page-break-inside-avoid">
              <div className="flex flex-row justify-between font-bold text-lg mb-1">
                <span>{edu.degree}</span>
                <span className="text-slate-400 font-normal italic text-sm">{edu.year}</span>
              </div>

              <div className="flex justify-between items-center text-sm text-slate-600">
                <span className="italic">{edu.school}</span>
                {edu.grade && <span className="text-slate-500">{edu.grade}</span>}
              </div>
            </div>
          ))}
        </section>
      )
      }

      <section className="mb-12">
        <h3 className="text-base font-bold uppercase tracking-[0.3em] text-slate-300 mb-8 border-b border-slate-100 pb-2">Experience</h3>
        {data.experience?.map(exp => (
          <div key={exp.id} className="mb-10 break-inside-avoid page-break-inside-avoid">
            <div className="flex flex-row justify-between font-bold text-lg mb-1">
              <span>{exp.role}</span>
              <span className="text-slate-400 font-normal italic text-sm">{exp.date}</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm text-slate-600">
              <span className="italic">{exp.company}</span>
              <span className="uppercase tracking-widest text-[10px]">{exp.location}</span>
            </div>
            <ul className="list-disc pl-8 space-y-2">
              {exp.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} className="text-[11pt] leading-relaxed text-slate-700">{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      {
        data.certifications && data.certifications.length > 0 && (
          <section className="mb-12 break-inside-avoid page-break-inside-avoid">
            <h3 className="text-base font-bold uppercase tracking-[0.3em] text-slate-300 mb-8 border-b border-slate-100 pb-2">Certifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {data.certifications.map(cert => (
                <div key={cert.id}>
                  <p className="text-[11pt] font-bold text-slate-900">{cert.name}</p>
                  <p className="text-[10pt] italic text-slate-600">{cert.issuer} ({cert.date})</p>
                </div>
              ))}
            </div>
          </section>
        )
      }
      <section className="break-inside-avoid page-break-inside-avoid">
        <h3 className="text-base font-bold uppercase tracking-[0.3em] text-slate-300 mb-8 border-b border-slate-100 pb-2">Languages</h3>
        <div className="grid grid-cols-3 gap-8">
          {data.languages.map(l => (
            <div key={l.id}>
              <p className="text-[11pt] font-bold text-slate-900">{l.name}</p>
              <p className="text-[10pt] italic text-slate-500">{l.level}</p>
            </div>
          ))}
        </div>
      </section>
    </div >
  );



  // Always render the print portal (hidden by default via CSS)
  const printContent = (
    <div className="bg-white printable-content" style={{ width: '210mm', minHeight: '297mm', height: 'auto', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
      {activeTemplate === 'classic' && <ClassicTemplate />}
      {activeTemplate === 'modern' && <ModernTemplate />}
      {activeTemplate === 'creative' && <CreativeTemplate />}
      {activeTemplate === 'academic' && <AcademicTemplate />}
    </div>
  );

  // Use a portal if the target exists
  const printRoot = document.getElementById('print-root');

  return (
    <section id="builder" className="py-12 md:py-20 bg-slate-50 dark:bg-navy-950/20 overflow-hidden border-t border-slate-200 dark:border-white/5">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="text-center mb-8 md:mb-16 print:hidden">
          <h2 className="text-3xl md:text-6xl font-black text-navy-900 dark:text-white tracking-tighter mb-3 md:mb-4">Interactive CV <span className="text-gradient">Engine</span></h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base px-4">Real-time design sync with neural enhancement logic.</p>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden bg-white dark:bg-navy-900 rounded-xl p-1 mb-6 shadow-md border dark:border-white/5 print:hidden">
          <button
            onClick={() => setViewMode('editor')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'editor' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
          >
            <i className="fas fa-edit mr-2"></i> Editor
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'preview' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
          >
            <i className="fas fa-eye mr-2"></i> Preview
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 md:gap-12">
          {/* EDITOR PANEL */}
          <div className={`w-full xl:w-[500px] space-y-4 print:hidden shrink-0 h-fit xl:sticky xl:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 md:pr-4 custom-scrollbar ${viewMode === 'preview' ? 'hidden md:block' : 'block'}`}>
            <div className="flex gap-3 md:gap-4 mb-4 md:mb-6">
              <button onClick={loadExample} className="flex-1 py-3 md:py-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-[9px] md:text-xs font-black uppercase tracking-widest text-navy-900 dark:text-white rounded-xl md:rounded-2xl hover:shadow-lg transition-all">Example</button>
              <button onClick={clearData} className="flex-1 py-3 md:py-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-[9px] md:text-xs font-black uppercase tracking-widest text-red-500 rounded-xl md:rounded-2xl hover:bg-red-50 transition-all">Clear</button>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              {[
                { id: 'contact', title: '1. Identity & Contact', icon: 'fa-user' },
                { id: 'experience', title: '2. Professional History', icon: 'fa-briefcase' },
                { id: 'education', title: '3. Education', icon: 'fa-graduation-cap' },
                { id: 'certifications', title: '4. Certifications', icon: 'fa-certificate' },
                { id: 'languages', title: '5. Languages', icon: 'fa-language' },
                { id: 'skills', title: '6. Skills & Expertise', icon: 'fa-bolt' }
              ].map((section) => (
                <div key={section.id} className="border-b border-slate-100 dark:border-white/5 last:border-0">
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                    className={`w-full px-6 md:px-8 py-4 md:py-6 text-left font-black text-xs md:text-sm tracking-tight flex justify-between items-center transition-all ${activeSection === section.id ? 'bg-slate-50 dark:bg-white/5 text-brand-500' : 'text-navy-900 dark:text-slate-100'}`}
                  >
                    <span className="flex items-center gap-3 md:gap-4">
                      <i className={`fas ${section.icon} text-[10px] md:text-xs opacity-50`}></i>
                      {section.title}
                    </span>
                    <i className={`fas fa-chevron-${activeSection === section.id ? 'up' : 'down'} text-[8px] md:text-[10px] opacity-30`}></i>
                  </button>

                  {activeSection === section.id && (
                    <div className="p-6 md:p-8 space-y-4 md:space-y-6 animate-reveal">
                      {section.id === 'contact' && (
                        <div className="space-y-3 md:space-y-4">
                          <input placeholder="Full Name" value={data.fullName} onChange={e => setData(d => ({ ...d, fullName: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" />
                          <input placeholder="Target Role" value={data.targetRole} onChange={e => setData(d => ({ ...d, targetRole: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <input placeholder="Email" value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" />
                            <input placeholder="Phone" value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" />
                          </div>
                          <input placeholder="Location" value={data.location} onChange={e => setData(d => ({ ...d, location: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" />
                        </div>
                      )}

                      {section.id === 'experience' && (
                        <div className="space-y-6 md:space-y-8">
                          {data.experience?.map((exp, i) => (
                            <div key={exp.id} className="p-4 md:p-6 border rounded-[1.5rem] md:rounded-[2rem] bg-slate-50/50 dark:bg-navy-950/50 relative group border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
                              <button onClick={() => setData(d => ({ ...d, experience: d.experience.filter(e => e.id !== exp.id) }))} className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-[10px] shadow-xl md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center justify-center z-20"><i className="fas fa-trash"></i></button>

                              <input placeholder="Job Title" className="w-full p-3 mb-3 md:mb-4 border dark:border-white/10 rounded-xl text-xs md:text-sm font-black bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                                <input placeholder="Company" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
                                <input placeholder="Location" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} />
                              </div>
                              <input placeholder="Dates" className="w-full p-3 mb-4 md:mb-6 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={exp.date} onChange={e => updateExperience(exp.id, 'date', e.target.value)} />

                              <div className="space-y-3">
                                {exp.bullets.map((bullet, bIdx) => (
                                  <div key={bIdx} className="flex gap-2 md:gap-3 group/bullet">
                                    <div className="flex-grow relative">
                                      <textarea rows={2} className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 resize-none pr-12 md:pr-14" value={bullet} onChange={e => updateBullet(exp.id, bIdx, e.target.value)} />
                                      <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover/bullet:opacity-100 transition-opacity">
                                        <button onClick={() => enhanceBullet(exp.id, bIdx)} disabled={loadingBullet?.expId === exp.id && loadingBullet?.index === bIdx} className="w-5 h-5 md:w-6 md:h-6 bg-brand-500 text-white rounded-md md:rounded-lg flex items-center justify-center"><i className={`fas ${loadingBullet?.expId === exp.id && loadingBullet?.index === bIdx ? 'fa-spinner fa-spin' : 'fa-magic'} text-[7px] md:text-[8px]`}></i></button>
                                        <button onClick={() => removeBullet(exp.id, bIdx)} className="w-5 h-5 md:w-6 md:h-6 bg-red-500/10 text-red-500 rounded-md md:rounded-lg flex items-center justify-center"><i className="fas fa-times text-[7px] md:text-[8px]"></i></button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => addBullet(exp.id)} className="w-full py-2 bg-slate-200/50 dark:bg-white/5 rounded-xl text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">+ Add Bullet</button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setData(d => ({ ...d, experience: [...(d.experience || []), { id: Date.now(), role: '', company: '', location: '', date: '', bullets: [''] }] }))} className="w-full py-5 md:py-6 border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-400 font-black text-[10px] md:text-xs rounded-[1.5rem] md:rounded-[2rem] hover:border-brand-500 transition-all uppercase tracking-widest">+ Add Experience</button>
                        </div>
                      )}

                      {section.id === 'education' && (
                        <div className="space-y-6 md:space-y-8">
                          {data.education?.map((edu) => (
                            <div key={edu.id} className="p-4 md:p-6 border rounded-[1.5rem] md:rounded-[2rem] bg-slate-50/50 dark:bg-navy-950/50 relative group border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
                              <button onClick={() => setData(d => ({ ...d, education: d.education.filter(e => e.id !== edu.id) }))} className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-[10px] shadow-xl md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center justify-center z-20"><i className="fas fa-trash"></i></button>

                              <input placeholder="Degree" className="w-full p-3 mb-3 md:mb-4 border dark:border-white/10 rounded-xl text-xs md:text-sm font-black bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                                <input placeholder="School / University" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} />
                                <input placeholder="Year" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} />
                              </div>
                              <input placeholder="Grade / GPA (Optional)" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={edu.grade} onChange={e => updateEducation(edu.id, 'grade', e.target.value)} />
                            </div>
                          ))}
                          <button onClick={() => setData(d => ({ ...d, education: [...(d.education || []), { id: Date.now(), degree: '', school: '', year: '', grade: '' }] }))} className="w-full py-5 md:py-6 border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-400 font-black text-[10px] md:text-xs rounded-[1.5rem] md:rounded-[2rem] hover:border-brand-500 transition-all uppercase tracking-widest">+ Add Education</button>
                        </div>
                      )}

                      {section.id === 'certifications' && (
                        <div className="space-y-6 md:space-y-8">
                          {data.certifications?.map((cert) => (
                            <div key={cert.id} className="p-4 md:p-6 border rounded-[1.5rem] md:rounded-[2rem] bg-slate-50/50 dark:bg-navy-950/50 relative group border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
                              <button onClick={() => setData(d => ({ ...d, certifications: d.certifications.filter(c => c.id !== cert.id) }))} className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-[10px] shadow-xl md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center justify-center z-20"><i className="fas fa-trash"></i></button>

                              <input placeholder="Certification Name" className="w-full p-3 mb-3 md:mb-4 border dark:border-white/10 rounded-xl text-xs md:text-sm font-black bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <input placeholder="Issuer" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} />
                                <input placeholder="Date" className="w-full p-3 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none" value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)} />
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setData(d => ({ ...d, certifications: [...(d.certifications || []), { id: Date.now(), name: '', issuer: '', date: '' }] }))} className="w-full py-5 md:py-6 border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-400 font-black text-[10px] md:text-xs rounded-[1.5rem] md:rounded-[2rem] hover:border-brand-500 transition-all uppercase tracking-widest">+ Add Certification</button>
                        </div>
                      )}

                      {section.id === 'languages' && (
                        <div className="space-y-3 md:space-y-4">
                          {data.languages.map((lang) => (
                            <div key={lang.id} className="flex gap-2 md:gap-3 items-center">
                              <input placeholder="Language" className="flex-1 p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none" value={lang.name} onChange={e => updateLanguage(lang.id, 'name', e.target.value)} />
                              <select className="p-3 md:p-4 border dark:border-white/10 rounded-xl text-[10px] md:text-xs bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none font-bold" value={lang.level} onChange={e => updateLanguage(lang.id, 'level', e.target.value)}>
                                {PROFICIENCY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                              </select>
                              <button onClick={() => setData(d => ({ ...d, languages: d.languages.filter(l => l.id !== lang.id) }))} className="text-red-500 p-1 md:p-2"><i className="fas fa-times-circle"></i></button>
                            </div>
                          ))}
                          <button onClick={addLanguage} className="w-full py-3 md:py-4 border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-400 font-black text-[9px] md:text-[10px] rounded-xl md:rounded-2xl hover:border-brand-500 transition-all uppercase tracking-widest">+ Add Language</button>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-3 md:space-y-4">
                          <textarea placeholder="Technical Core Skills (comma separated)" value={data.hardSkills} onChange={e => setData(d => ({ ...d, hardSkills: e.target.value }))} className="w-full p-3 md:p-4 border dark:border-white/10 rounded-xl text-xs md:text-sm h-32 md:h-40 bg-slate-50 dark:bg-navy-950/50 text-navy-900 dark:text-white outline-none resize-none" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW PANEL */}
          <div className={`flex-1 min-w-0 flex flex-col items-center bg-slate-100/30 dark:bg-navy-900/40 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-white/10 p-4 md:p-8 min-h-[500px] md:min-h-[900px] ${viewMode === 'editor' ? 'hidden md:flex' : 'flex'}`}>
            <div className="w-full mb-6 md:mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-8 print:hidden">
              <div className="flex bg-white dark:bg-navy-950 rounded-xl md:rounded-2xl shadow-xl p-1 md:p-1.5 border border-slate-200 dark:border-white/10 overflow-x-auto max-w-full no-scrollbar">
                {['classic', 'modern', 'creative', 'academic'].map(t => (
                  <button key={t} onClick={() => setActiveTemplate(t as TemplateType)} className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-lg md:rounded-xl transition-all ${activeTemplate === t ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-navy-900 dark:hover:text-white'}`}>{t}</button>
                ))}
              </div>
              <button onClick={handleDownload} className="w-full sm:w-auto btn-premium bg-navy-900 dark:bg-brand-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-sm shadow-2xl flex items-center justify-center gap-2 md:gap-3"><i className="fas fa-file-pdf"></i> Export PDF</button>
            </div>

            <div className="w-full flex justify-center flex-grow relative pb-20 md:pb-32 overflow-hidden md:overflow-visible">
              <div
                ref={previewRef}
                className="bg-white shadow-2xl origin-top transition-all duration-500 printable-content relative"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  transform: `scale(${previewScale})`,
                  marginBottom: `-${(1 - previewScale) * 100}%`
                }}
              >
                {activeTemplate === 'classic' && <ClassicTemplate />}
                {activeTemplate === 'modern' && <ModernTemplate />}
                {activeTemplate === 'creative' && <CreativeTemplate />}
                {activeTemplate === 'academic' && <AcademicTemplate />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {printRoot && ReactDOM.createPortal(printContent, printRoot)}
    </section>
  );
};

export default ResumeBuilder;
