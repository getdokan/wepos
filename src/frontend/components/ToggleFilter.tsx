import React from 'react';
import { cn } from '@wedevs/plugin-ui';

interface ToggleFilterProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

const ToggleFilter: React.FC<ToggleFilterProps> = ({
  label,
  active,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'h-[30px] px-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors border shrink-0',
        active
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-muted text-muted-foreground border-transparent hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
};

export default ToggleFilter;
