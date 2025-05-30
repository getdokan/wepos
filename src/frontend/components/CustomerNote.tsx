import React, { useState, useRef, useEffect } from 'react';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface CustomerNoteProps {
  onAddNote: (note: string) => void;
  className?: string;
}

const CustomerNote: React.FC<CustomerNoteProps> = ({
  onAddNote,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus textarea when popover opens
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
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
      <button
        ref={buttonRef}
        type="button"
        className="focus:ring-opacity-20 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-gray-500"
        onClick={() => setIsVisible(!isVisible)}
      >
        {__('Add Note', 'wepos')}
      </button>

      {isVisible && (
        <Popover
          anchor={buttonRef.current}
          placement="top"
          onClose={() => setIsVisible(false)}
          className="wepos-customer-note-popover"
        >
          <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <form onSubmit={handleAddNote}>
              <div className="mb-3">
                <label
                  htmlFor="customer-note"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {__('Customer Note', 'wepos')}
                </label>
                <textarea
                  ref={textareaRef}
                  id="customer-note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={__('Enter note for this order...', 'wepos')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  onClick={() => setIsVisible(false)}
                >
                  {__('Cancel', 'wepos')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!noteText.trim()}
                >
                  {__('Add Note', 'wepos')}
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {__('Press Ctrl+Enter to add note', 'wepos')}
              </div>
            </form>
          </div>
        </Popover>
      )}
    </div>
  );
};

export default CustomerNote;
