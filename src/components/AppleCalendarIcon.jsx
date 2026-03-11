import React from 'react';
import { cn } from '../utils/cn';

const AppleCalendarIcon = ({ className }) => {
  const today = new Date();
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'short' });
  const day = today.getDate();

  return (
    <div className={cn("apple-cal-icon", className)}>
      <div className="cal-month">{dayOfWeek}</div>
      <div className="cal-day">{day}</div>
      <div className="glass-highlight" />
    </div>
  );
};

export default AppleCalendarIcon;
