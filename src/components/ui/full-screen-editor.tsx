import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Textarea } from './textarea';
import { Separator } from './separator';
import { Bold, Italic, Underline, List, Link, Maximize2, Save, X } from 'lucide-react';

interface FullScreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
}

export function FullScreenEditor({
  isOpen,
  onClose,
  value,
  onChange,
  title,
  placeholder = "Enter your text..."
}: FullScreenEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    onChange(localValue);
    onClose();
  };

  const handleCancel = () => {
    setLocalValue(value); // Reset to original value
    onClose();
  };

  const formatText = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    if (selectedText) {
      // If text is selected, wrap it
      const newText = localValue.substring(0, start) + 
                     prefix + selectedText + suffix + 
                     localValue.substring(end);
      setLocalValue(newText);
      
      // Set cursor position after the formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      // If no text selected, insert formatting markers
      const newText = localValue.substring(0, start) + 
                     prefix + suffix + 
                     localValue.substring(start);
      setLocalValue(newText);
      
      // Place cursor between the markers
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  const insertList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = localValue.split('\n');
    let currentLine = 0;
    let currentPos = 0;
    
    // Find which line the cursor is on
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) {
        currentLine = i;
        break;
      }
      currentPos += lines[i].length + 1; // +1 for newline
    }
    
    // Add bullet point to current line if it doesn't have one
    if (!lines[currentLine].trim().startsWith('•')) {
      lines[currentLine] = '• ' + lines[currentLine].trim();
      setLocalValue(lines.join('\n'));
    }
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    const linkText = selectedText || 'link text';
    const linkFormat = `[${linkText}](url)`;
    
    const newText = localValue.substring(0, start) + 
                   linkFormat + 
                   localValue.substring(end);
    setLocalValue(newText);
    
    // Select the URL part for easy editing
    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3; // After [text](
      const urlEnd = urlStart + 3; // Select 'url'
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Maximize2 className="w-5 h-5" />
              {title}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Formatting Toolbar */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('**', '**')}
                className="h-8"
              >
                <Bold className="w-4 h-4 mr-1" />
                Bold
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('*', '*')}
                className="h-8"
              >
                <Italic className="w-4 h-4 mr-1" />
                Italic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('__', '__')}
                className="h-8"
              >
                <Underline className="w-4 h-4 mr-1" />
                Underline
              </Button>
              
              <Separator orientation="vertical" className="h-6 my-1" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={insertList}
                className="h-8"
              >
                <List className="w-4 h-4 mr-1" />
                Bullet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={insertLink}
                className="h-8"
              >
                <Link className="w-4 h-4 mr-1" />
                Link
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              Use **bold**, *italic*, __underline__, • bullets, [link text](url) for formatting
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 p-4">
            <Textarea
              ref={textareaRef}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={placeholder}
              className="w-full h-full resize-none text-base leading-relaxed border-0 shadow-none focus-visible:ring-0"
              style={{ minHeight: 'calc(100vh - 300px)' }}
            />
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {localValue.length} characters
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}