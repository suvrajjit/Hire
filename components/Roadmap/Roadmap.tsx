import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronRight, Save, Share2 } from 'lucide-react';
import { RoadmapItem } from '../../services/gemini';
import { auth, db } from '../../firebase';
import { ref, push } from 'firebase/database';

interface RoadmapProps {
  items: RoadmapItem[];
  onBack: () => void;
}

const Roadmap: React.FC<RoadmapProps> = ({ items, onBack }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
      if (!auth.currentUser) return;
      try {
          const roadmapRef = ref(db, `users/${auth.currentUser.uid}/roadmaps`);
          await push(roadmapRef, {
              timestamp: Date.now(),
              items
          });
          setSaved(true);
      } catch (err) {
          console.error("Failed to save roadmap", err);
      }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 relative min-h-screen">
       {/* Header */}
       <div className="flex justify-between items-center mb-16 sticky top-0 bg-black/80 backdrop-blur-xl z-50 p-4 border-b border-white/5 rounded-b-2xl">
           <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
           >
               <ArrowLeft size={18} /> <span className="uppercase tracking-widest text-xs font-mono">Back to Audit</span>
           </button>
           <div className="flex gap-4">
               <button 
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${saved ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-zinc-900 border-zinc-700 text-gray-300 hover:border-white'} transition-all uppercase text-xs font-bold tracking-widest`}
               >
                   {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                   {saved ? "Plan Secured" : "Save Plan"}
               </button>
           </div>
       </div>

       <div className="text-center mb-20 space-y-4">
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
               EXECUTION PROTOCOL
           </h2>
           <p className="text-gray-500 font-mono text-sm max-w-lg mx-auto uppercase tracking-widest">
               90-Day Reconstruction Plan
           </p>
       </div>

       {/* Timeline Container */}
       <div className="relative">
           {/* Center Vertical Line */}
           <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-purple-500 to-transparent transform -translate-x-1/2 hidden md:block opacity-30"></div>
           <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-purple-500 to-transparent md:hidden opacity-30"></div>

           <div className="space-y-24">
               {items.map((item, index) => (
                   <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                   >
                       {/* Timeline Node (Center) */}
                       <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-black border-2 border-blue-400 rounded-full transform -translate-x-1/2 mt-6 z-10 shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                       </div>

                       {/* Content Card */}
                       <div className="flex-1 ml-12 md:ml-0">
                           <div className={`
                                group relative bg-zinc-900/40 border border-white/10 p-6 rounded-2xl backdrop-blur-md hover:border-blue-500/30 transition-all hover:bg-zinc-800/60
                                ${index % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}
                           `}>
                               {/* Glow Effect */}
                               <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                               
                               <div className="relative z-10">
                                   <div className="flex justify-between items-start mb-4">
                                       <span className="px-3 py-1 bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest rounded border border-blue-500/20">
                                           {item.week}
                                       </span>
                                   </div>
                                   
                                   <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors">
                                       {item.title}
                                   </h3>
                                   
                                   <div className="space-y-4 mb-6">
                                       {item.topics.map((topic, i) => (
                                           <div key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                                               <ChevronRight size={14} className="text-blue-500" />
                                               {topic}
                                           </div>
                                       ))}
                                   </div>

                                   <div className="pt-4 border-t border-white/5">
                                       <div className="flex items-start gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
                                           <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                                           <div>
                                               <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Required Output</p>
                                               <p className="text-sm text-emerald-100 font-mono leading-relaxed">{item.action}</p>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       {/* Spacer for alternating layout */}
                       <div className="flex-1 hidden md:block"></div>
                   </motion.div>
               ))}
           </div>
       </div>

       {/* Footer */}
       <div className="mt-32 text-center pb-20">
           <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">End of Protocol Loop</p>
       </div>
    </div>
  );
};

export default Roadmap;
