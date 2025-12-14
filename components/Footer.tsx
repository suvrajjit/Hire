import React from 'react';
import { Github, Twitter, Linkedin, Mail, Phone, Globe, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer 
      className="w-full z-40 bg-black/90 backdrop-blur-xl border-t border-zinc-900 relative mt-auto"
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
          
          {/* Brand & Quote Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              {/* Assuming uploaded_image_1 is the logo based on context */}
               <img 
                  src="file:///C:/Users/suvra/.gemini/antigravity/brain/428c0ca8-465b-472f-916a-6d3a1f096b1d/uploaded_image_1_1765668848915.png" 
                  alt="Hire.OS Logo" 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback if image fails or path is wrong
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Hire.OS</h3>
                <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">Career Survival System</p>
              </div>
            </div>
            
            <blockquote className="border-l-2 border-cyan-500/30 pl-4 py-1">
              <p className="text-gray-400 font-serif italic text-sm leading-relaxed max-w-md">
                "The future belongs to those who prepare for it today."
              </p>
            </blockquote>

            <div className="flex gap-4 pt-2">
              <SocialIcon Icon={Github} link="#" />
              <SocialIcon Icon={Twitter} link="#" />
              <SocialIcon Icon={Linkedin} link="#" />
            </div>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">Contact Me</h4>
            <div className="space-y-3">
              <ContactItem Icon={Phone} text="+91 91238719xx" />
              <ContactItem Icon={Mail} text="suvrajitdey650@gmail.com" />
              <ContactItem Icon={MapPin} text="KIIT University, Odisha, India" />
            </div>
          </div>

           {/* Quick Links Column (Placeholder/Context) */}
           <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">Visit Us At</h4>
             <ul className="space-y-2 text-xs font-mono text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">WEBSITE</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">PORTFOLIO</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">GITHUB</a></li>
             </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
           {/* Glowing Brand */}
           <div className="group">
              <p className="font-mono text-[10px] text-cyan-400 font-bold tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,1)] transition-all">
                HIRE.OS@2025
              </p>
           </div>
           
           {/* Credits */}
           <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              Website made by <span className="text-gray-400">Suv</span>
           </p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ Icon, link }: { Icon: any; link: string }) => (
  <a href={link} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800">
    <Icon size={14} />
  </a>
);

const ContactItem = ({ Icon, text }: { Icon: any; text: string }) => (
  <div className="flex items-center gap-3 text-gray-400 hover:text-gray-300 transition-colors group">
    <Icon size={14} className="text-cyan-900 group-hover:text-cyan-500 transition-colors" />
    <span className="text-xs font-mono">{text}</span>
  </div>
);

export default Footer;
