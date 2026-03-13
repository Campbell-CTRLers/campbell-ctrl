import React from 'react';
import { Hero } from '../components/Home/Hero';
import { AboutSection } from '../components/Home/AboutSection';
import { HomeMeetingsSection } from '../components/Home/HomeMeetingsSection';
import { HomeEsportsCompact } from '../components/Home/HomeEsportsCompact';

const HomeTab = ({ gamesList, standings, rankings, meetings, dataLoaded = true, onNavigateToEsports }) => {
  return (
    <div className="w-full">
      <Hero />
      <AboutSection />
      <HomeMeetingsSection meetings={meetings} />
      <HomeEsportsCompact gamesList={gamesList} standings={standings} rankings={rankings} dataLoaded={dataLoaded} onNavigateToEsports={onNavigateToEsports} />
    </div>
  );
};

export default HomeTab;
