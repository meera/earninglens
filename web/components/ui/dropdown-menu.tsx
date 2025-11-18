'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
}

export function DropdownMenu({ children, trigger }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="focus:outline-none"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-background-elevated border border-border shadow-lg z-50">
          <div className="py-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                const childElement = child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
                const originalOnClick = childElement.props.onClick;
                return React.cloneElement(childElement, {
                  onClick: (e: React.MouseEvent) => {
                    originalOnClick?.(e);
                    setOpen(false);
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuItem({ children, className, ...props }: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background-hover transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" />;
}
