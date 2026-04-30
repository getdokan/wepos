import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { SmartSelect, cn } from '@wedevs/plugin-ui';

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

interface StockStatusFilterProps {
  selectedStatus: StockStatus | null;
  onStatusChange: (status: StockStatus | null) => void;
}

const StockStatusFilter: React.FC<StockStatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  const options = useMemo(
    () => [
      { value: 'all', label: __('Stock Status', 'wepos') },
      { value: 'instock', label: __('In Stock', 'wepos') },
      { value: 'outofstock', label: __('Out of Stock', 'wepos') },
      { value: 'onbackorder', label: __('On Backorder', 'wepos') },
    ],
    [],
  );

  return (
    <div className="w-fit shrink-0">
      <SmartSelect
        options={options}
        value={selectedStatus || 'all'}
        onValueChange={(val) => {
          onStatusChange(val === 'all' ? null : (val as StockStatus));
        }}
        placeholder={__('Stock Status', 'wepos')}
        emptyMessage={__('No option found.', 'wepos')}
        disableSearch
        className={cn(
          'h-[30px]! max-w-[130px] border-none! cursor-pointer text-sm!',
          selectedStatus ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      />
    </div>
  );
};

export default StockStatusFilter;
