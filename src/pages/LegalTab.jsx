import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import { EditableSiteText } from '../components/content/EditableSiteText';

const LegalTab = ({ siteContent, setSiteContent, contentEditor }) => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-16 max-w-4xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">
          <EditableSiteText as="span" contentKey="legal.heading" fallback="Legal" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /> <EditableSiteText as="span" contentKey="legal.headingAccent" fallback="Info." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="text-accent font-drama italic" />
        </h1>
        <EditableSiteText as="p" contentKey="legal.description" fallback="Privacy policy and terms of service for the Campbell CTRL website." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans text-slate text-lg max-w-2xl" />
      </div>

      {/* Privacy Policy */}
      <div className="legal-card bg-background rounded-[2rem] p-8 md:p-10 border border-slate/10 shadow-xl mb-8">
        <h2 className="font-sans font-bold text-2xl text-primary mb-6 flex items-center gap-3">
          <ShieldAlert className="text-accent" size={24} />
          <EditableSiteText as="span" contentKey="legal.privacyTitle" fallback="Privacy Policy" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
        </h2>
        <div className="space-y-4 font-sans text-slate leading-relaxed text-sm">
          <p><EditableSiteText as="span" contentKey="legal.lastUpdatedPrefixPrivacy" fallback="Last updated:" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <EditableSiteText as="h3" contentKey="legal.privacyInfoCollectTitle" fallback="Information We Collect" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.privacyInfoCollectText" fallback="This website does not collect personal information from visitors. Any data displayed on this site (schedules, standings) is managed by club administrators through a private dashboard." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.privacyThirdPartyTitle" fallback="Third-Party Services" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.privacyThirdPartyText1" fallback="This site uses Firebase (by Google) for data storage and hosting. Firebase may collect standard web analytics data such as IP addresses and browser information. Please refer to Google's Privacy Policy for more details." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="p" contentKey="legal.privacyThirdPartyText2" fallback="External links to Discord and Google Calendar are provided for convenience. These services have their own privacy policies." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.privacyCookiesTitle" fallback="Cookies" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.privacyCookiesText" fallback="This site does not use cookies for tracking. Any cookies present are from third-party services (Firebase, hosting provider)." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.privacyContactTitle" fallback="Contact" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.privacyContactText" fallback="For questions about this policy, reach out to the club through our Discord server." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
        </div>
      </div>

      {/* Terms of Service */}
      <div className="legal-card bg-background rounded-[2rem] p-8 md:p-10 border border-slate/10 shadow-xl">
        <h2 className="font-sans font-bold text-2xl text-primary mb-6 flex items-center gap-3">
          <FileText className="text-accent" size={24} />
          <EditableSiteText as="span" contentKey="legal.termsTitle" fallback="Terms of Service" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
        </h2>
        <div className="space-y-4 font-sans text-slate leading-relaxed text-sm">
          <p><EditableSiteText as="span" contentKey="legal.lastUpdatedPrefixTerms" fallback="Last updated:" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <EditableSiteText as="h3" contentKey="legal.termsUseTitle" fallback="Use of This Site" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.termsUseText" fallback="This website is operated by the Campbell CTRL Gaming Club for informational purposes. You may freely browse the site to view schedules, standings, and club information." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.termsContentTitle" fallback="Content" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.termsContentText" fallback="All content on this site — including schedules, standings, and club information — is managed by authorized club administrators. Game icons are sourced from SteamGridDB and are property of their respective owners." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.termsDiscordTitle" fallback="Discord" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.termsDiscordText" fallback="Joining the Campbell CTRL Discord server is subject to Discord's own Terms of Service. Members are expected to follow both Discord's guidelines and the server's rules." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          <EditableSiteText as="h3" contentKey="legal.termsDisclaimerTitle" fallback="Disclaimer" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-bold text-primary text-base pt-2" />
          <EditableSiteText as="p" contentKey="legal.termsDisclaimerText" fallback="This is a student-run club website. Information is provided as-is and may be updated at any time. We are not responsible for any third-party content linked from this site." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
        </div>
      </div>
    </div>
  );
};

export default LegalTab;
