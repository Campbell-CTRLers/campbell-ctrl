import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';

const LegalTab = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-16 max-w-4xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">Legal <span className="text-accent font-drama italic">Info.</span></h1>
        <p className="font-sans text-slate text-lg max-w-2xl">Privacy policy and terms of service for the Campbell CTRL website.</p>
      </div>

      {/* Privacy Policy */}
      <div className="legal-card bg-background rounded-[2rem] p-8 md:p-10 border border-slate/10 shadow-xl mb-8">
        <h2 className="font-sans font-bold text-2xl text-primary mb-6 flex items-center gap-3">
          <ShieldAlert className="text-accent" size={24} />
          Privacy Policy
        </h2>
        <div className="space-y-4 font-sans text-slate leading-relaxed text-sm">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h3 className="font-bold text-primary text-base pt-2">Information We Collect</h3>
          <p>This website does not collect personal information from visitors. Any data displayed on this site (schedules, standings) is managed by club administrators through a private dashboard.</p>
          <h3 className="font-bold text-primary text-base pt-2">Third-Party Services</h3>
          <p>This site uses Firebase (by Google) for data storage and hosting. Firebase may collect standard web analytics data such as IP addresses and browser information. Please refer to Google's Privacy Policy for more details.</p>
          <p>External links to Discord and Google Calendar are provided for convenience. These services have their own privacy policies.</p>
          <h3 className="font-bold text-primary text-base pt-2">Cookies</h3>
          <p>This site does not use cookies for tracking. Any cookies present are from third-party services (Firebase, hosting provider).</p>
          <h3 className="font-bold text-primary text-base pt-2">Contact</h3>
          <p>For questions about this policy, reach out to the club through our Discord server.</p>
        </div>
      </div>

      {/* Terms of Service */}
      <div className="legal-card bg-background rounded-[2rem] p-8 md:p-10 border border-slate/10 shadow-xl">
        <h2 className="font-sans font-bold text-2xl text-primary mb-6 flex items-center gap-3">
          <FileText className="text-accent" size={24} />
          Terms of Service
        </h2>
        <div className="space-y-4 font-sans text-slate leading-relaxed text-sm">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h3 className="font-bold text-primary text-base pt-2">Use of This Site</h3>
          <p>This website is operated by the Campbell CTRL Gaming Club for informational purposes. You may freely browse the site to view schedules, standings, and club information.</p>
          <h3 className="font-bold text-primary text-base pt-2">Content</h3>
          <p>All content on this site — including schedules, standings, and club information — is managed by authorized club administrators. Game icons are sourced from SteamGridDB and are property of their respective owners.</p>
          <h3 className="font-bold text-primary text-base pt-2">Discord</h3>
          <p>Joining the Campbell CTRL Discord server is subject to Discord's own Terms of Service. Members are expected to follow both Discord's guidelines and the server's rules.</p>
          <h3 className="font-bold text-primary text-base pt-2">Disclaimer</h3>
          <p>This is a student-run club website. Information is provided as-is and may be updated at any time. We are not responsible for any third-party content linked from this site.</p>
        </div>
      </div>
    </div>
  );
};

export default LegalTab;
