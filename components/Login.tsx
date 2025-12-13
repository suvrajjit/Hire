import React, { useState } from 'react';
import Stepper, { Step } from './Stepper';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

interface LoginProps {
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Profile Data
  const [linkedIn, setLinkedIn] = useState('');
  const [jobDomain, setJobDomain] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      const uid = userCredential.user.uid;
      setUserId(uid);

      // Check if user has already onboarded
      const userRef = ref(db, 'users/' + uid);
      const snapshot = await get(userRef);

      if (snapshot.exists() && snapshot.val().onboardingComplete) {
        alert("Welcome back, Operator. Redirecting to Dashboard...");
        onBack(); // In a real app, this would route to Dashboard
      } else {
        // Proceed to onboarding
        setCurrentStep(2);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!userId) return;
    if (!linkedIn || !jobDomain || !resumeFile) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);
    try {
      // In a real production app, we would upload resumeFile to Firebase Storage here.
      // For this demo, we will store the filename in the Realtime DB.
      
      await set(ref(db, 'users/' + userId), {
        email: email,
        linkedIn: linkedIn,
        jobDomain: jobDomain,
        resumeName: resumeFile.name,
        onboardingComplete: true,
        lastLogin: new Date().toISOString()
      });

      console.log("Onboarding Complete!");
      // alert("Profile Initialized. Welcome to Hired.OS.");
      onBack();
    } catch (err: any) {
      console.error(err);
      alert("Error saving profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black relative flex flex-col items-center justify-center py-12">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none" />

      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
         <button onClick={onBack} className="text-cyan-500 hover:text-white transition-colors font-mono tracking-widest text-sm flex items-center gap-2">
           <span className="text-lg">←</span> SYSTEM_EXIT
         </button>
      </div>

      <div className="w-full max-w-5xl relative z-10 px-4">
        <Stepper
          externalStep={currentStep}
          onStepChange={setCurrentStep}
          initialStep={1}
          stepCircleContainerClassName="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 text-white"
          backButtonText="BACK"
          nextButtonText="NEXT"
          disableStepIndicators={true} // Force linear progression
          hideFooterOnSteps={[1, 3]} // Hide footer on Auth (1) and Input (3) because they have their own buttons
          onFinalStepCompleted={handleFinalSubmit}
        >
          {/* Step 1: Authentication */}
          <Step>
             <div className="w-full max-w-sm mx-auto space-y-6 py-8">
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                   {isLogin ? 'Authenticate Identity' : 'Initialize Profile'}
                 </h2>
                 <p className="text-cyan-500/60 font-mono text-xs uppercase tracking-widest">
                   Secure Access Node 01
                 </p>
               </div>

               <form onSubmit={handleAuth} className="space-y-5 text-left">
                 <div className="space-y-1">
                   <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                   <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-zinc-700 font-mono text-sm"
                      placeholder="user@hired.os"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-mono text-gray-500 uppercase">Password</label>
                   <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-zinc-700 font-mono text-sm"
                      placeholder="••••••••"
                   />
                 </div>

                 {error && <p className="text-red-500 text-xs bg-red-900/10 p-2 rounded border border-red-900/50">{error}</p>}

                 <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 tracking-wide"
                 >
                   {loading ? 'PROCESSING...' : (isLogin ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT')}
                 </button>
               </form>

               <div className="text-center pt-4 border-t border-white/5 mt-4">
                 <button 
                   type="button"
                   onClick={() => setIsLogin(!isLogin)}
                   className="text-gray-500 hover:text-cyan-400 text-xs transition-colors hover:underline"
                 >
                   {isLogin ? "No credentials? Initialize new user" : "Already verified? Access system"}
                 </button>
               </div>
             </div>
          </Step>

          {/* Step 2: Educational (Split Screen) */}
          <Step>
            <div className="flex flex-col md:flex-row items-stretch min-h-[400px] overflow-hidden rounded-xl border border-white/5">
              {/* Left: Content */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center space-y-6 bg-zinc-900/50">
                <div>
                   <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-white mb-2">
                    Mind The Gap.
                  </h2>
                  <p className="text-xs font-mono text-purple-400 uppercase tracking-widest">Why profiles get rejected</p>
                </div>
                
                <p className="text-gray-400 leading-relaxed text-sm">
                  83% of resumes are rejected by ATS algorithms before a human ever sees them. Employment gaps and keyword mismatches create "Null Pointers" in traditional hiring systems.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Unexplained Timeline Gaps</span>
                  </div>
                   <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Generic Skill Clouds</span>
                  </div>
                   <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Missing Quantitative Metrics</span>
                  </div>
                </div>
              </div>

              {/* Right: Image */}
              <div className="w-full md:w-1/2 relative bg-zinc-800 h-64 md:h-auto">
                 <div className="absolute inset-0 bg-gradient-to-l from-transparent to-zinc-900/90 z-10" />
                 <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                    alt="Data Analysis" 
                    className="w-full h-full object-cover grayscale opacity-60 mix-blend-overlay"
                 />
                 <div className="absolute bottom-6 right-6 z-20 text-right">
                   <div className="text-4xl font-black text-white/10">02</div>
                 </div>
              </div>
            </div>
          </Step>

          {/* Step 3: Data Input */}
          <Step>
             <div className="w-full max-w-2xl mx-auto py-4">
                <div className="text-center mb-8">
                 <h2 className="text-2xl font-bold text-white">System Calibration</h2>
                 <p className="text-gray-500 text-sm mt-2">Upload your data to synchronize with the neural network.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Resume Upload */}
                 <div className="col-span-1 md:col-span-2">
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Resume (PDF)</label>
                   <div className="relative border-2 border-dashed border-zinc-700 hover:border-cyan-500 rounded-lg p-8 transition-colors group text-center cursor-pointer">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <svg className={`w-8 h-8 ${resumeFile ? 'text-green-500' : 'text-gray-400 group-hover:text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-300 font-medium">
                          {resumeFile ? resumeFile.name : "Drop PDF or Click to Upload"}
                        </span>
                        <span className="text-xs text-gray-600">Max size: 5MB</span>
                      </div>
                   </div>
                 </div>

                 {/* LinkedIn */}
                 <div className="col-span-1">
                    <label className="block text-xs font-mono text-gray-500 uppercase mb-2">LinkedIn Profile URL</label>
                    <input 
                      type="url" 
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-zinc-700 text-sm"
                    />
                 </div>

                 {/* Job Domain */}
                 <div className="col-span-1">
                    <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Target Domain</label>
                    <select 
                      value={jobDomain}
                      onChange={(e) => setJobDomain(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm appearance-none"
                    >
                      <option value="" disabled>Select Sector...</option>
                      <option value="engineering">Software Engineering</option>
                      <option value="data">Data Science / AI</option>
                      <option value="product">Product Management</option>
                      <option value="design">Product Design</option>
                      <option value="marketing">Growth Marketing</option>
                    </select>
                 </div>
               </div>

               <div className="mt-8 flex justify-end gap-4">
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinalSubmit}
                    disabled={loading || !resumeFile}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-8 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'INITIALIZING...' : 'COMPLETE SETUP'}
                  </button>
               </div>
             </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
};

export default Login;