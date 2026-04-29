"use client";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-cf-border dark:border-cf-dark-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors relative
            ${
              activeKey === tab.key
                ? "text-cf-blue font-bold"
                : "text-cf-text-secondary dark:text-cf-dark-text-secondary hover:text-cf-text-primary dark:hover:text-cf-dark-text"
            }
          `}
        >
          {tab.label}
          {activeKey === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cf-blue" />
          )}
        </button>
      ))}
    </div>
  );
}
