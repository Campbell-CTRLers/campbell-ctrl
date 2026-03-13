import React, { useState } from 'react';
import { IconEye, IconEyeOff, IconPlus, IconTrash, IconRotate, IconX, IconChevronDown, IconChevronUp } from '../icons/SvgIcons';
import { cn } from '../../utils/cn';
import { useHaptics } from '../../hooks/useHaptics';

const DEFAULTS = {
  hero: {
    line1: 'Campbell CTRL',
    line2: 'eSpartans',
    description: "Campbell High School\u2019s official esports and gaming club.",
    buttonText: 'Learn More',
  },
  about: {
    heading: 'About the Club',
    description: 'Campbell CTRL is Campbell High School\u2019s official esports and gaming club. We practice weekly, compete in PlayVS leagues, and represent Campbell at the state level.',
    cards: [
      { title: 'Open to all', desc: 'From complete beginners to varsity competitors. Everyone is welcome.' },
      { title: 'Multiple games', desc: 'Rocket League, Smash Bros, Splatoon 3, Marvel Rivals, Mario Kart, and more.' },
      { title: 'PlayVS competitive', desc: 'Official Campbell eSpartans rosters competing in Georgia and PlayVS leagues.' },
    ],
  },
  meetings: {
    heading: 'Club Meetings.',
    headingAccent: 'Meetings.',
    description: 'Where the community comes together. We practice, discuss strategies, and hang out every week after school.',
    featuredTitle: 'Friday Sessions',
    featuredBadge: 'EVERY WEEK',
    timeDesc: '3:30 PM \u2013 5:30 PM directly after school.',
    locationDesc: 'The Learning Commons (Library). Follow the glow of monitors.',
    whoDesc: 'Anyone from complete beginners to varsity level competitors.',
  },
  esports: {
    heading: 'Campbell',
    headingAccent: 'eSpartans.',
    description: 'The official PlayVS competitive core of Campbell CTRL. View upcoming schedules, match results, and live team standings across all active rosters.',
  },
  design: {
    accentColor: '#0038A8',
    headingFont: 'sans',
    bodyFont: 'roboto',
    heroSpacing: 'normal',
    sectionSpacing: 'normal',
    cardRounding: 'large',
  },
};

const SectionLabel = ({ children }) => (
  <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">{children}</span>
);

const FieldLabel = ({ children, hint }) => (
  <div className="flex items-baseline gap-2 mb-1.5">
    <label className="font-sans text-xs font-bold text-primary">{children}</label>
    {hint && <span className="font-mono text-[9px] text-slate/40">{hint}</span>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, multiline = false, className }) => {
  const base = "w-full bg-slate/5 border border-slate/10 rounded-xl px-4 py-3 font-sans text-sm text-primary placeholder:text-slate/30 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all resize-none";
  if (multiline) {
    return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} className={cn(base, className)} />;
  }
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} className={cn(base, className)} />;
};

const SelectInput = ({ value, onChange, options, className }) => (
  <select value={value} onChange={onChange} className={cn("w-full bg-slate/5 border border-slate/10 rounded-xl px-4 py-3 font-sans text-sm text-primary focus:outline-none focus:border-accent/40 transition-all", className)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const CollapsibleSection = ({ label, children, defaultOpen = false, onReset }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate/[0.03] rounded-2xl border border-slate/10 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <SectionLabel>{label}</SectionLabel>
        <div className="flex items-center gap-2">
          {onReset && (
            <span onClick={(e) => { e.stopPropagation(); onReset(); }} className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate/40 hover:text-accent transition-colors cursor-pointer">
              <IconRotate size={10} />RESET
            </span>
          )}
          {open ? <IconChevronUp size={14} className="text-slate/40" /> : <IconChevronDown size={14} className="text-slate/40" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5 flex flex-col gap-4">{children}</div>}
    </div>
  );
};

const AdminContentEditor = ({ siteContent, setSiteContent, isMobile = false }) => {
  const haptics = useHaptics();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  const content = {
    hero: { ...DEFAULTS.hero, ...(siteContent?.hero || {}) },
    about: { ...DEFAULTS.about, ...(siteContent?.about || {}), cards: siteContent?.about?.cards || DEFAULTS.about.cards },
    meetings: { ...DEFAULTS.meetings, ...(siteContent?.meetings || {}) },
    esports: { ...DEFAULTS.esports, ...(siteContent?.esports || {}) },
    design: { ...DEFAULTS.design, ...(siteContent?.design || {}) },
  };

  const update = (section, field, value) => {
    setSiteContent((prev) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [field]: value },
    }));
  };

  const updateCard = (index, field, value) => {
    const cards = [...content.about.cards];
    cards[index] = { ...cards[index], [field]: value };
    update('about', 'cards', cards);
  };

  const addCard = () => {
    haptics.selection();
    update('about', 'cards', [...content.about.cards, { title: 'New Feature', desc: 'Describe this feature here.' }]);
  };

  const removeCard = (index) => {
    haptics.light();
    update('about', 'cards', content.about.cards.filter((_, i) => i !== index));
  };

  const resetSection = (section) => {
    haptics.light();
    setSiteContent((prev) => ({ ...prev, [section]: { ...DEFAULTS[section] } }));
  };

  const previewContent = (
    <div className="bg-slate/[0.03] rounded-2xl border border-slate/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconEye size={12} className="text-accent" />
          <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Live Preview</span>
        </div>
        {fullscreenPreview && (
          <button onClick={() => setFullscreenPreview(false)} className="p-1 text-slate/40 hover:text-primary"><IconX size={16} /></button>
        )}
      </div>

      {/* Hero preview */}
      <div className="relative bg-gradient-to-b from-slate/10 to-background p-8 flex flex-col items-center text-center gap-2">
        <h2 className="font-display font-black text-xl tracking-tight uppercase text-primary leading-tight">{content.hero.line1}</h2>
        <span className="font-drama italic text-4xl text-accent leading-[0.9] tracking-tighter">{content.hero.line2}</span>
        <p className="font-roboto text-xs text-slate/80 max-w-[220px] leading-relaxed mt-2">{content.hero.description}</p>
        <div className="mt-3">
          <span className="bg-[#111113] text-white px-4 py-1.5 rounded-full font-sans font-bold text-[10px]">{content.hero.buttonText}</span>
        </div>
      </div>

      {/* About preview */}
      <div className="p-6 border-t border-slate/10">
        <h3 className="font-sans font-bold text-lg text-primary mb-2 tracking-tight">{content.about.heading}</h3>
        <p className="font-roboto text-slate/80 text-xs leading-relaxed mb-4">{content.about.description}</p>
        <div className="flex flex-col gap-2">
          {content.about.cards.map((card, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate/5 border border-slate/10">
              <h4 className="font-sans font-bold text-sm text-primary mb-0.5">{card.title}</h4>
              <p className="font-roboto text-slate/70 text-[11px] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meetings preview */}
      <div className="p-6 border-t border-slate/10">
        <h3 className="font-sans font-bold text-lg text-primary mb-1 tracking-tight">Club {content.meetings.headingAccent}</h3>
        <p className="font-roboto text-slate/80 text-xs leading-relaxed mb-3">{content.meetings.description}</p>
        <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
          <span className="font-mono text-[9px] text-accent font-bold">{content.meetings.featuredBadge}</span>
          <h4 className="font-sans font-bold text-sm text-primary mt-1">{content.meetings.featuredTitle}</h4>
          <p className="font-roboto text-[10px] text-slate/60 mt-1">{content.meetings.timeDesc}</p>
        </div>
      </div>

      {/* Esports preview */}
      <div className="p-6 border-t border-slate/10">
        <h3 className="font-sans font-bold text-lg text-primary tracking-tight">
          {content.esports.heading} <span className="text-accent font-drama italic">{content.esports.headingAccent}</span>
        </h3>
        <p className="font-roboto text-slate/80 text-xs leading-relaxed mt-1">{content.esports.description}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Site Content</h3>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => { haptics.light(); setFullscreenPreview(true); }} className="flex items-center gap-2 text-accent bg-accent/5 px-3 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 hover:bg-accent hover:text-white transition-all">
              <IconEye size={14} />PREVIEW
            </button>
          )}
          {!isMobile && (
            <button onClick={() => { haptics.light(); setShowPreview(!showPreview); }} className="flex items-center gap-2 text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 hover:bg-accent hover:text-white transition-all">
              {showPreview ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
            </button>
          )}
        </div>
      </div>

      <p className="font-sans text-sm text-slate/60 -mt-2">
        Edit the text across all pages. Changes are saved when you hit Publish.
      </p>

      <div className={cn("grid gap-8", !isMobile && showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
        {/* Editor column */}
        <div className="flex flex-col gap-4">
          <CollapsibleSection label="Hero Section" defaultOpen onReset={() => resetSection('hero')}>
            <div>
              <FieldLabel hint="Top line">Title Line 1</FieldLabel>
              <TextInput value={content.hero.line1} onChange={(e) => update('hero', 'line1', e.target.value)} placeholder="Campbell CTRL" />
            </div>
            <div>
              <FieldLabel hint="Large accent text">Title Line 2</FieldLabel>
              <TextInput value={content.hero.line2} onChange={(e) => update('hero', 'line2', e.target.value)} placeholder="eSpartans" />
            </div>
            <div>
              <FieldLabel hint="Subtitle">Description</FieldLabel>
              <TextInput value={content.hero.description} onChange={(e) => update('hero', 'description', e.target.value)} placeholder="Campbell High School's..." multiline />
            </div>
            <div>
              <FieldLabel hint="CTA button">Button Text</FieldLabel>
              <TextInput value={content.hero.buttonText} onChange={(e) => update('hero', 'buttonText', e.target.value)} placeholder="Learn More" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection label="About the Club" onReset={() => resetSection('about')}>
            <div>
              <FieldLabel>Section Heading</FieldLabel>
              <TextInput value={content.about.heading} onChange={(e) => update('about', 'heading', e.target.value)} placeholder="About the Club" />
            </div>
            <div>
              <FieldLabel>Section Description</FieldLabel>
              <TextInput value={content.about.description} onChange={(e) => update('about', 'description', e.target.value)} placeholder="Campbell CTRL is..." multiline />
            </div>
            <div className="flex items-center justify-between mt-1">
              <FieldLabel>Feature Cards</FieldLabel>
              <button onClick={addCard} className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-accent hover:text-accent/80 transition-colors">
                <IconPlus size={12} />ADD CARD
              </button>
            </div>
            {content.about.cards.map((card, i) => (
              <div key={i} className="bg-background rounded-xl p-4 border border-slate/10 flex flex-col gap-3 relative group">
                <button onClick={() => removeCard(i)} className="absolute top-3 right-3 p-1.5 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <IconTrash size={14} />
                </button>
                <div>
                  <FieldLabel hint={`Card ${i + 1}`}>Title</FieldLabel>
                  <TextInput value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)} placeholder="Card title" />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <TextInput value={card.desc} onChange={(e) => updateCard(i, 'desc', e.target.value)} placeholder="Card description" multiline />
                </div>
              </div>
            ))}
          </CollapsibleSection>

          <CollapsibleSection label="Meetings Page" onReset={() => resetSection('meetings')}>
            <div>
              <FieldLabel hint="Page heading accent">Heading Accent</FieldLabel>
              <TextInput value={content.meetings.headingAccent} onChange={(e) => update('meetings', 'headingAccent', e.target.value)} placeholder="Meetings." />
            </div>
            <div>
              <FieldLabel>Page Description</FieldLabel>
              <TextInput value={content.meetings.description} onChange={(e) => update('meetings', 'description', e.target.value)} placeholder="Where the community..." multiline />
            </div>
            <div>
              <FieldLabel hint="Featured card title">Featured Title</FieldLabel>
              <TextInput value={content.meetings.featuredTitle} onChange={(e) => update('meetings', 'featuredTitle', e.target.value)} placeholder="Friday Sessions" />
            </div>
            <div>
              <FieldLabel hint="Badge text">Badge</FieldLabel>
              <TextInput value={content.meetings.featuredBadge} onChange={(e) => update('meetings', 'featuredBadge', e.target.value)} placeholder="EVERY WEEK" />
            </div>
            <div>
              <FieldLabel>Time Description</FieldLabel>
              <TextInput value={content.meetings.timeDesc} onChange={(e) => update('meetings', 'timeDesc', e.target.value)} placeholder="3:30 PM – 5:30 PM..." />
            </div>
            <div>
              <FieldLabel>Location Description</FieldLabel>
              <TextInput value={content.meetings.locationDesc} onChange={(e) => update('meetings', 'locationDesc', e.target.value)} placeholder="The Learning Commons..." />
            </div>
            <div>
              <FieldLabel>Who Can Join</FieldLabel>
              <TextInput value={content.meetings.whoDesc} onChange={(e) => update('meetings', 'whoDesc', e.target.value)} placeholder="Anyone from..." />
            </div>
          </CollapsibleSection>

          <CollapsibleSection label="Esports Page" onReset={() => resetSection('esports')}>
            <div>
              <FieldLabel hint="Before accent text">Heading</FieldLabel>
              <TextInput value={content.esports.heading} onChange={(e) => update('esports', 'heading', e.target.value)} placeholder="Campbell" />
            </div>
            <div>
              <FieldLabel hint="Styled accent text">Heading Accent</FieldLabel>
              <TextInput value={content.esports.headingAccent} onChange={(e) => update('esports', 'headingAccent', e.target.value)} placeholder="eSpartans." />
            </div>
            <div>
              <FieldLabel>Page Description</FieldLabel>
              <TextInput value={content.esports.description} onChange={(e) => update('esports', 'description', e.target.value)} placeholder="The official PlayVS..." multiline />
            </div>
          </CollapsibleSection>

          {/* Design settings - desktop only */}
          {!isMobile && (
            <CollapsibleSection label="Design Settings" onReset={() => resetSection('design')}>
              <div>
                <FieldLabel hint="Primary accent color">Accent Color</FieldLabel>
                <div className="flex items-center gap-3">
                  <input type="color" value={content.design.accentColor} onChange={(e) => update('design', 'accentColor', e.target.value)} className="w-10 h-10 rounded-lg border border-slate/10 cursor-pointer" />
                  <TextInput value={content.design.accentColor} onChange={(e) => update('design', 'accentColor', e.target.value)} placeholder="#0038A8" className="flex-1" />
                </div>
              </div>
              <div>
                <FieldLabel hint="Heading typeface">Heading Font</FieldLabel>
                <SelectInput value={content.design.headingFont} onChange={(e) => update('design', 'headingFont', e.target.value)} options={[
                  { value: 'sans', label: 'System Sans (Default)' },
                  { value: 'mono', label: 'Monospace' },
                  { value: 'display', label: 'Display (Impact)' },
                ]} />
              </div>
              <div>
                <FieldLabel hint="Body text typeface">Body Font</FieldLabel>
                <SelectInput value={content.design.bodyFont} onChange={(e) => update('design', 'bodyFont', e.target.value)} options={[
                  { value: 'roboto', label: 'Roboto (Default)' },
                  { value: 'sans', label: 'System Sans' },
                  { value: 'mono', label: 'Monospace' },
                ]} />
              </div>
              <div>
                <FieldLabel hint="Space between sections">Section Spacing</FieldLabel>
                <SelectInput value={content.design.sectionSpacing} onChange={(e) => update('design', 'sectionSpacing', e.target.value)} options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'normal', label: 'Normal (Default)' },
                  { value: 'spacious', label: 'Spacious' },
                ]} />
              </div>
              <div>
                <FieldLabel hint="Card border radius">Card Rounding</FieldLabel>
                <SelectInput value={content.design.cardRounding} onChange={(e) => update('design', 'cardRounding', e.target.value)} options={[
                  { value: 'small', label: 'Small (8px)' },
                  { value: 'medium', label: 'Medium (16px)' },
                  { value: 'large', label: 'Large (24px) - Default' },
                  { value: 'full', label: 'Full (32px)' },
                ]} />
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Desktop preview column */}
        {!isMobile && showPreview && (
          <div className="hidden lg:block sticky top-0 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            {previewContent}
          </div>
        )}
      </div>

      {/* Mobile fullscreen preview */}
      {isMobile && fullscreenPreview && (
        <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
          <div className="p-4 pb-24">
            {previewContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentEditor;
