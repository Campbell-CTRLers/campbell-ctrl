import React from 'react';
import { Hero } from '../components/Home/Hero';
import { AboutSection } from '../components/Home/AboutSection';
import { HomeMeetingsSection } from '../components/Home/HomeMeetingsSection';
import { HomeEsportsCompact } from '../components/Home/HomeEsportsCompact';

const HomeTab = ({ gamesList, standings, rankings, meetings, siteContent, setSiteContent, contentEditor, dataLoaded = true, onNavigateToEsports }) => {
  return (
    <div className="w-full">
      <Hero content={siteContent?.hero} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
      <AboutSection content={siteContent?.about} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
      <HomeMeetingsSection meetings={meetings} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
      <HomeEsportsCompact gamesList={gamesList} standings={standings} rankings={rankings} dataLoaded={dataLoaded} onNavigateToEsports={onNavigateToEsports} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
    </div>
  );
};

export default HomeTab;
