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
        'h-[30px] px-3 rounded-md text-sm font-medium cursor-pointer transition-colors border shrink-0',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-primary/10 text-muted-foreground border-transparent hover:text-primary',
      )}
    >
      {label}
    </button>
  );
};

export default ToggleFilter;
