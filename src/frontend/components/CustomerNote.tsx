import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Textarea,
  Label,
} from '@wedevs/plugin-ui';

interface CustomerNoteProps {
  onAddNote: (note: string) => void;
  className?: string;
}

export interface CustomerNoteHandle {
  open: () => void;
}

const CustomerNote = forwardRef<CustomerNoteHandle, CustomerNoteProps>(({
  onAddNote,
  className,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  // plugin-ui's `Textarea` is a plain function component, so it cannot take a
  // ref — reach the field through its wrapper instead.
  const fieldRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsVisible(true),
  }));

  // Focus textarea when popover opens
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        fieldRef.current?.querySelector('textarea')?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
      setIsVisible(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddNote();
    } else if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  return (
    <div className={`inline-block ${className || ''}`}>
      <Popover open={isVisible} onOpenChange={setIsVisible}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="border-border bg-muted text-muted-foreground hover:bg-accent"
            />
          }
        >
          {__('Add Note', 'wepos')}
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="start">
          <form onSubmit={handleAddNote} className="flex flex-col gap-3">
            <div ref={fieldRef}>
              <Label htmlFor="customer-note" className="mb-2 block">
                {__('Customer Note', 'wepos')}
              </Label>
              <Textarea
                id="customer-note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="resize-none"
                rows={4}
                placeholder={__('Enter note for this order...', 'wepos')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsVisible(false)}
              >
                {__('Cancel', 'wepos')}
              </Button>
              <Button type="submit" disabled={!noteText.trim()}>
                {__('Add Note', 'wepos')}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {__('Press Ctrl+Enter to add note', 'wepos')}
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default CustomerNote;
