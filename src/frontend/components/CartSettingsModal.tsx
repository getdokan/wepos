import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Switch,
  Separator,
} from '@wedevs/plugin-ui';
import type { CartSettings, CartColumnConfig } from '../hooks/useCartSettings';

interface CartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CartSettings;
  onToggleColumn: (key: string) => void;
  onToggleSubOption: (columnKey: string, subKey: string) => void;
  onUpdateSettings: (updates: Partial<CartSettings>) => void;
  onRestoreDefaults: () => void;
}

const CartSettingsModal: React.FC<CartSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onToggleColumn,
  onToggleSubOption,
  onUpdateSettings,
  onRestoreDefaults,
}) => {
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) => {
    setExpandedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="gap-0 p-0">
      <DialogHeader className="border-b border-border py-4 px-8">
        <DialogTitle>{__('Cart Settings', 'wepos')}</DialogTitle>
      </DialogHeader>

      <div className="max-h-[70vh] overflow-y-auto">
        <div className="space-y-5 p-6">
          {/* Receipt toggles */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Switch
                checked={settings.autoShowReceipt}
                onCheckedChange={(checked: boolean) =>
                  onUpdateSettings({ autoShowReceipt: checked })
                }
              />
              <span className="ml-3 flex-1 text-sm">
                {__('Automatically show receipt after checkout', 'wepos')}
              </span>
            </div>
            <div className="flex items-center">
              <Switch
                checked={settings.autoPrintReceipt}
                onCheckedChange={(checked: boolean) =>
                  onUpdateSettings({ autoPrintReceipt: checked })
                }
              />
              <span className="ml-3 flex-1 text-sm">
                {__('Automatically print receipt after checkout', 'wepos')}
              </span>
            </div>
          </div>

          <Separator />

          {/* Columns */}
          <div className="space-y-1">
            <h4 className="mb-2 text-sm font-semibold">
              {__('Columns', 'wepos')}
            </h4>
            {settings.columns.map((col: CartColumnConfig) => {
              const hasSubOptions = col.subOptions && col.subOptions.length > 0;
              const isExpanded = expandedColumns[col.key];

              return (
                <div key={col.key}>
                  <div className="flex items-center gap-3 py-1.5">
                    <Switch
                      checked={col.enabled}
                      onCheckedChange={() => onToggleColumn(col.key)}
                    />
                    <span className="text-sm font-medium">
                      {__(col.label, 'wepos')}
                    </span>
                    {hasSubOptions && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(col.key)}
                        className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 border-none bg-transparent px-1 py-0.5 text-xs"
                      >
                        {__('Display Options', 'wepos')}
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Sub-options */}
                  {hasSubOptions && isExpanded && (
                    <div className="ml-10 space-y-1.5 pb-1.5">
                      {col.subOptions!.map((sub) => (
                        <div key={sub.key} className="flex items-center gap-3">
                          <Switch
                            size="sm"
                            checked={sub.enabled}
                            onCheckedChange={() =>
                              onToggleSubOption(col.key, sub.key)
                            }
                          />
                          <span className="text-muted-foreground text-sm">
                            {__(sub.label, 'wepos')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-border py-5 px-8">
        <Button variant="outline" onClick={onClose}>
          {__('Close', 'wepos')}
        </Button>
        <Button variant="destructive" onClick={onRestoreDefaults}>
          {__('Restore Default Settings', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default CartSettingsModal;
