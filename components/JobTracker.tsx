
import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';

const JobTracker: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({ company: '', role: '', status: 'Saved' as JobStatus });

  // Load from LocalStorage
  useEffect(() => {
    const savedJobs = localStorage.getItem('nextstep_jobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
        // Initial Dummy Data
        setJobs([
            { id: '1', company: 'Google', role: 'Frontend Engineer', status: 'Saved', dateAdded: new Date().toISOString() },
            { id: '2', company: 'Amazon', role: 'SDE II', status: 'Applied', dateAdded: new Date().toISOString() },
        ]);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (jobs.length > 0) {
        localStorage.setItem('nextstep_jobs', JSON.stringify(jobs));
    }
  }, [jobs]);

  const addJob = () => {
    if (!newJob.company || !newJob.role) return;
    const job: JobApplication = {
      id: Date.now().toString(),
      company: newJob.company,
      role: newJob.role,
      status: newJob.status,
      dateAdded: new Date().toISOString()
    };
    setJobs([...jobs, job]);
    setShowAddModal(false);
    setNewJob({ company: '', role: '', status: 'Saved' });
  };

  const moveJob = (id: string, direction: 'next' | 'prev') => {
    const statuses: JobStatus[] = ['Saved', 'Applied', 'Interviewing', 'Offer'];
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const idx = statuses.indexOf(job.status);
        const newIdx = direction === 'next' ? Math.min(idx + 1, 3) : Math.max(idx - 1, 0);
        return { ...job, status: statuses[newIdx] };
      }
      return job;
    }));
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const Columns: JobStatus[] = ['Saved', 'Applied', 'Interviewing', 'Offer'];

  return (
    <section id="tracker" className="py-20 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
           <div>
             <h2 className="font-heading text-3xl font-bold text-navy-900">Job Application Tracker</h2>
             <p className="text-slate-600 text-sm">Organize your job search with our Kanban board.</p>
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-all"
           >
             <i className="fas fa-plus mr-2"></i> Add Job
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Columns.map(status => (
            <div key={status} className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                 <h3 className="font-bold text-navy-900 uppercase text-sm tracking-wide">{status}</h3>
                 <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {jobs.filter(j => j.status === status).length}
                 </span>
              </div>
              
              <div className="space-y-3 flex-grow">
                {jobs.filter(j => j.status === status).map(job => (
                  <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-all relative group">
                    <button 
                       onClick={() => deleteJob(job.id)}
                       className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                       <i className="fas fa-times"></i>
                    </button>
                    <h4 className="font-bold text-navy-900">{job.role}</h4>
                    <p className="text-sm text-slate-600 mb-3">{job.company}</p>
                    
                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-50">
                       <button 
                         onClick={() => moveJob(job.id, 'prev')}
                         disabled={status === 'Saved'}
                         className="text-xs text-slate-400 hover:text-navy-900 disabled:opacity-20"
                       >
                         <i className="fas fa-chevron-left"></i>
                       </button>
                       <button 
                         onClick={() => moveJob(job.id, 'next')}
                         disabled={status === 'Offer'}
                         className="text-xs text-slate-400 hover:text-navy-900 disabled:opacity-20"
                       >
                         <i className="fas fa-chevron-right"></i>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Job Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold text-navy-900 mb-4">Add New Job</h3>
                <div className="space-y-4">
                   <input 
                     type="text" 
                     placeholder="Company Name"
                     className="w-full p-3 border rounded-lg"
                     value={newJob.company}
                     onChange={e => setNewJob({...newJob, company: e.target.value})}
                   />
                   <input 
                     type="text" 
                     placeholder="Job Role"
                     className="w-full p-3 border rounded-lg"
                     value={newJob.role}
                     onChange={e => setNewJob({...newJob, role: e.target.value})}
                   />
                   <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddModal(false)} className="text-slate-500 font-medium px-4 py-2">Cancel</button>
                      <button onClick={addJob} className="bg-brand-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-brand-600">Save</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobTracker;
