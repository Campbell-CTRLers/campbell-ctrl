import React, { useState } from 'react';
import { IconEye, IconEyeOff, IconPlus, IconTrash, IconRotate } from '../icons/SvgIcons';
import { cn } from '../../utils/cn';
import { useHaptics } from '../../hooks/useHaptics';

const DEFAULTS = {
  hero: {
    line1: 'Campbell CTRL',
    line2: 'eSpartans',
    description: "Campbell High School's official esports and gaming club.",
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

const AdminContentEditor = ({ siteContent, setSiteContent }) => {
  const haptics = useHaptics();
  const [showPreview, setShowPreview] = useState(true);

  const content = {
    hero: { ...DEFAULTS.hero, ...(siteContent?.hero || {}) },
    about: {
      ...DEFAULTS.about,
      ...(siteContent?.about || {}),
      cards: siteContent?.about?.cards || DEFAULTS.about.cards,
    },
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
    const cards = [...content.about.cards, { title: 'New Feature', desc: 'Describe this feature here.' }];
    update('about', 'cards', cards);
  };

  const removeCard = (index) => {
    haptics.light();
    const cards = content.about.cards.filter((_, i) => i !== index);
    update('about', 'cards', cards);
  };

  const resetSection = (section) => {
    haptics.light();
    setSiteContent((prev) => ({ ...prev, [section]: { ...DEFAULTS[section] } }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">
          Site Content
        </h3>
        <button
          onClick={() => { haptics.light(); setShowPreview(!showPreview); }}
          className="flex items-center gap-2 text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 hover:bg-accent hover:text-white transition-all"
        >
          {showPreview ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
        </button>
      </div>

      <p className="font-sans text-sm text-slate/60 -mt-2">
        Edit the text content that appears on the home page. Changes are saved when you hit Publish.
      </p>

      <div className={cn("grid gap-8", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
        {/* Editor column */}
        <div className="flex flex-col gap-8">
          {/* Hero section */}
          <div className="bg-slate/[0.03] rounded-2xl p-6 border border-slate/10">
            <div className="flex items-center justify-between mb-5">
              <SectionLabel>Hero Section</SectionLabel>
              <button onClick={() => resetSection('hero')} className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate/40 hover:text-accent transition-colors" title="Reset to defaults">
                <IconRotate size={12} />RESET
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel hint="Top line of the hero">Title Line 1</FieldLabel>
                <TextInput value={content.hero.line1} onChange={(e) => update('hero', 'line1', e.target.value)} placeholder="Campbell CTRL" />
              </div>
              <div>
                <FieldLabel hint="Large accent text">Title Line 2</FieldLabel>
                <TextInput value={content.hero.line2} onChange={(e) => update('hero', 'line2', e.target.value)} placeholder="eSpartans" />
              </div>
              <div>
                <FieldLabel hint="Subtitle below the title">Description</FieldLabel>
                <TextInput value={content.hero.description} onChange={(e) => update('hero', 'description', e.target.value)} placeholder="Campbell High School's..." multiline />
              </div>
              <div>
                <FieldLabel hint="CTA button text">Button Text</FieldLabel>
                <TextInput value={content.hero.buttonText} onChange={(e) => update('hero', 'buttonText', e.target.value)} placeholder="Learn More" />
              </div>
            </div>
          </div>

          {/* About section */}
          <div className="bg-slate/[0.03] rounded-2xl p-6 border border-slate/10">
            <div className="flex items-center justify-between mb-5">
              <SectionLabel>About the Club</SectionLabel>
              <button onClick={() => resetSection('about')} className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate/40 hover:text-accent transition-colors" title="Reset to defaults">
                <IconRotate size={12} />RESET
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel>Section Heading</FieldLabel>
                <TextInput value={content.about.heading} onChange={(e) => update('about', 'heading', e.target.value)} placeholder="About the Club" />
              </div>
              <div>
                <FieldLabel>Section Description</FieldLabel>
                <TextInput value={content.about.description} onChange={(e) => update('about', 'description', e.target.value)} placeholder="Campbell CTRL is..." multiline />
              </div>

              <div className="flex items-center justify-between mt-2">
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
            </div>
          </div>
        </div>

        {/* Preview column */}
        {showPreview && (
          <div className="hidden lg:block sticky top-0 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            <div className="bg-slate/[0.03] rounded-2xl border border-slate/10 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate/10 flex items-center gap-2">
                <IconEye size={12} className="text-accent" />
                <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Live Preview</span>
              </div>

              {/* Hero preview */}
              <div className="relative bg-gradient-to-b from-slate/10 to-background p-8 flex flex-col items-center text-center gap-2">
                <h2 className="font-display font-black text-xl tracking-tight uppercase text-primary leading-tight">
                  {content.hero.line1}
                </h2>
                <span className="font-drama italic text-4xl text-accent leading-[0.9] tracking-tighter">
                  {content.hero.line2}
                </span>
                <p className="font-roboto text-xs text-slate/80 max-w-[220px] leading-relaxed mt-2">
                  {content.hero.description}
                </p>
                <div className="mt-3">
                  <span className="bg-[#111113] text-white px-4 py-1.5 rounded-full font-sans font-bold text-[10px]">
                    {content.hero.buttonText}
                  </span>
                </div>
              </div>

              {/* About preview */}
              <div className="p-8 border-t border-slate/10">
                <h3 className="font-sans font-bold text-lg text-primary mb-2 tracking-tight">
                  {content.about.heading}
                </h3>
                <p className="font-roboto text-slate/80 text-xs leading-relaxed mb-6">
                  {content.about.description}
                </p>
                <div className="flex flex-col gap-3">
                  {content.about.cards.map((card, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate/5 border border-slate/10">
                      <h4 className="font-sans font-bold text-sm text-primary mb-1">{card.title}</h4>
                      <p className="font-roboto text-slate/70 text-[11px] leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentEditor;
