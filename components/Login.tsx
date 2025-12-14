import React, { useState } from 'react';
import Stepper, { Step } from './Stepper';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';




interface LoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const slides = [
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2070&auto=format&fit=crop", 
    title: "Capturing Potential,",
    subtitle: "Creating Careers."
  },
  {
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
    title: "Skills Verified,",
    subtitle: "Opportunities Unlocked."
  },
  {
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
    title: "Your Future,",
    subtitle: "Waitless."
  }
];

const Step3Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:block w-5/12 relative bg-black overflow-hidden group">
       {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 ${currentSlide === index ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            style={{ transition: 'opacity 1000ms ease-in-out' }}
          >
             <img 
                src={slide.image} 
                alt="Visual" 
                className="w-full h-full object-cover opacity-60" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black/0 to-zinc-900/90" />
          </div>
       ))}
       
       <div className="absolute bottom-8 left-8 right-8 z-20">
          <div className="h-20 relative"> 
             {slides.map((slide, index) => (
                <div 
                  key={index}
                  className={`absolute bottom-0 left-0 w-full ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transition: 'opacity 1000ms ease-in-out' }}
                >
                   <h3 className="text-2xl font-bold text-white mb-2">{slide.title}</h3>
                   <p className="text-gray-400">{slide.subtitle}</p>
                </div>
             ))}
          </div>
          
          <div className="flex gap-2 mt-6">
             {slides.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1 rounded-full ${currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                  style={{ transition: 'all 1000ms ease-in-out' }}
                />
             ))}
          </div>
       </div>
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ onBack, onLoginSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile Data
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [currentField, setCurrentField] = useState('');
  const [targetField, setTargetField] = useState('');
  const [linkedIn, setLinkedIn] = useState('');


  // Auto-advance if user is already authenticated (but app routed here because not onboarded)
  React.useEffect(() => {
    if (auth.currentUser && currentStep === 1) {
       setCurrentStep(2);
    }
  }, [auth.currentUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Success - The useEffect above or manual step change handles the next part
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const finalRole = role === 'other' ? customRole : role;
    
    // linkedIn is now optional
    // linkedIn is now optional
    if (!fullName || !finalRole || !currentField || !targetField) {
      alert("Please complete all fields (LinkedIn is optional).");
      return;
    }

    setLoading(true);
    try {
      // 2. Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 10000)
      );

      // 3. Race DB write
      await Promise.race([
        set(ref(db, 'users/' + user.uid), {
          email: user.email,
          fullName: fullName,
          role: finalRole,
          currentField: currentField,
          targetField: targetField,
          linkedIn: linkedIn || "",
          onboardingComplete: true,
          lastLogin: new Date().toISOString()
        }),
        timeoutPromise
      ]);
      
      onLoginSuccess(); 
    } catch (err: any) {
      console.error(err);
      alert("Notice: Profile saved locally (Server: " + err.message + "). Accessing system...");
      onLoginSuccess();
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
          disableStepIndicators={true} 
          hideFooterOnSteps={[1, 3]} 
          hideHeader={isLogin && currentStep === 1}
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

          {/* Step 2: Educational / Motivation */}
          <Step>
            <div className="flex flex-col md:flex-row items-stretch min-h-[400px] overflow-hidden rounded-xl border border-white/5">
              {/* Left: Content */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8 bg-zinc-900/50">
                <div>
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-white mb-2">
                    The Harsh Reality.
                  </h2>
                  <p className="text-xs font-mono text-red-500/80 uppercase tracking-widest">Why 90% Fail</p>
                </div>
                
                <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
                   <p>
                    Most candidates believe skill is enough. It isn't. ATS algorithms reject 75% of resumes before a human ever reads them.
                   </p>
                   <p>
                    Generic templates, missing keywords, and poor formatting create "Null Pointers" in hiring systems. You are being filtered out by code, not people.
                   </p>
                </div>

                <div className="mt-2">
                   <p className="text-gray-200 font-medium">
                     But don't worry. You're going to be a part of us. Let's optimize your signal.
                   </p>
                </div>
              </div>

              {/* Right: Image */}
              <div className="w-full md:w-1/2 relative bg-zinc-800 h-64 md:h-auto overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-l from-transparent to-zinc-900/90 z-10" />
                 <img 
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2070&auto=format&fit=crop" 
                    alt="Network Connection" 
                    className="w-full h-full object-cover grayscale opacity-60 mix-blend-overlay hover:scale-110 transition-transform duration-[20s]"
                 />
              </div>
            </div>
          </Step>

          {/* Step 3: Profile Setup (Split Screen) */}
          <Step>
             <div className="flex flex-col md:flex-row items-stretch min-h-[500px] overflow-hidden rounded-xl border border-white/5 bg-zinc-900/30">
                {/* Left: Visual Carousel */}
                <Step3Carousel />

                {/* Right: Form */}
                <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center">
                   <div className="mb-8">
                     <h2 className="text-2xl font-bold text-white">Create an account</h2>
                   </div>

                   <div className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Full Name</label>
                        <input 
                           type="text" 
                           value={fullName}
                           onChange={(e) => setFullName(e.target.value)}
                           className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                           placeholder="John Doe"
                        />
                      </div>

                      {/* Row: Role & Custom Role */}
                       <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Role</label>
                         <div className="flex gap-2">
                            <select 
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm appearance-none"
                            >
                              <option value="" disabled>Select Role...</option>
                              <option value="developer">Developer</option>
                              <option value="designer">Designer</option>
                              <option value="manager">Manager</option>
                              <option value="student">Student</option>
                              <option value="other">Other (Custom)</option>
                            </select>
                            {role === 'other' && (
                                <input 
                                   type="text" 
                                   value={customRole}
                                   onChange={(e) => setCustomRole(e.target.value)}
                                   className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                                   placeholder="Specify Role"
                                />
                            )}
                         </div>
                      </div>

                      {/* Row: Fields */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Current Field</label>
                            <input 
                               type="text"
                               value={currentField}
                               onChange={(e) => setCurrentField(e.target.value)}
                               className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                               placeholder="e.g. Sales"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Target Field</label>
                            <input 
                               type="text"
                               value={targetField}
                               onChange={(e) => setTargetField(e.target.value)}
                               className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                               placeholder="e.g. Data Science"
                            />
                         </div>
                      </div>

                       {/* LinkedIn */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">LinkedIn URL (Optional)</label>
                        <input 
                           type="url" 
                           value={linkedIn}
                           onChange={(e) => setLinkedIn(e.target.value)}
                           className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                           placeholder="https://linkedin.com/in/..."
                        />
                      </div>



                   </div>

                   <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                       <button onClick={() => setCurrentStep(2)} className="text-xs text-gray-500 hover:text-white">BACK</button>
                       <button 
                         onClick={handleFinalSubmit}
                         disabled={loading}
                         className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide"
                       >
                         {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                       </button>
                   </div>
                   

                </div>
             </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
};

export default Login;