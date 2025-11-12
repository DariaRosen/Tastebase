'use client';

import { useState } from 'react';

type Tab = 'latest' | 'popular';

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabSwitcher = ({ activeTab, onTabChange }: TabSwitcherProps) => {
  return (
    <div className="flex items-center gap-1 border-b border-border-subtle">
      <button
        onClick={() => onTabChange('latest')}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === 'latest'
            ? 'border-b-2 border-brand-primary text-brand-primary'
            : 'text-brand-secondary/60 hover:text-brand-secondary'
        }`}
        aria-label="Latest recipes"
        aria-selected={activeTab === 'latest'}
        role="tab"
      >
        Latest
      </button>
      <button
        onClick={() => onTabChange('popular')}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === 'popular'
            ? 'border-b-2 border-brand-primary text-brand-primary'
            : 'text-brand-secondary/60 hover:text-brand-secondary'
        }`}
        aria-label="Popular recipes"
        aria-selected={activeTab === 'popular'}
        role="tab"
      >
        Popular
      </button>
    </div>
  );
};

