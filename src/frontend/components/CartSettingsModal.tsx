import React from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronDown } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Switch,
  Separator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@wedevs/plugin-ui';
import type { CartSettings, CartColumnConfig } from '../hooks/useCartSettings';

interface CartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CartSettings;
  onToggleColumn: (key: string) => void;
  onUpdateSettings: (updates: Partial<CartSettings>) => void;
  onSetColumnDisplayOption: (key: string, option: 'buttons' | 'input') => void;
  onRestoreDefaults: () => void;
}

const CartSettingsModal: React.FC<CartSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onToggleColumn,
  onUpdateSettings,
  onSetColumnDisplayOption,
  onRestoreDefaults,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <ModalHeader>
        <ModalTitle>{__('Cart Settings', 'wepos')}</ModalTitle>
      </ModalHeader>

      <div className="space-y-5 p-6">
        {/* Receipt toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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
          <div className="flex items-center justify-between">
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
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">
            {__('Columns', 'wepos')}
          </h4>
          {settings.columns.map((col: CartColumnConfig) => (
            <div key={col.key} className="flex items-center gap-3">
              <Switch
                checked={col.enabled}
                onCheckedChange={() => onToggleColumn(col.key)}
              />
              <span className="text-sm">{__(col.label, 'wepos')}</span>
              {col.hasDisplayOptions && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="text-muted-foreground hover:text-foreground inline-flex h-auto items-center gap-1 px-1 py-0.5 text-xs"
                  >
                    {__('Display Options', 'wepos')}
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => onSetColumnDisplayOption(col.key, 'buttons')}
                    >
                      <span className={col.displayOption === 'buttons' ? 'font-semibold' : ''}>
                        {__('Buttons', 'wepos')}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSetColumnDisplayOption(col.key, 'input')}
                    >
                      <span className={col.displayOption === 'input' ? 'font-semibold' : ''}>
                        {__('Input Field', 'wepos')}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {__('Close', 'wepos')}
        </Button>
        <Button variant="destructive" onClick={onRestoreDefaults}>
          {__('Restore Default Settings', 'wepos')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CartSettingsModal;
