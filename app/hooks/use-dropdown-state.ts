import * as React from "react";

export interface UseDropdownStateOptions {
  initialOpen?: boolean;
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  blurDelay?: number;
  mobileBlurDelay?: number;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDropdownState(options: UseDropdownStateOptions = {}) {
  const {
    initialOpen = false,
    closeOnSelect = true,
    closeOnBlur = true,
    blurDelay = 150,
    mobileBlurDelay = 300,
    onOpen,
    onClose,
  } = options;

  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  
  const blurTimeoutRef = React.useRef<NodeJS.Timeout>();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Open dropdown
  const open = React.useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      setFocusedIndex(-1);
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  // Close dropdown
  const close = React.useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setFocusedIndex(-1);
      setIsInteracting(false);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      onClose?.();
    }
  }, [isOpen, onClose]);

  // Toggle dropdown
  const toggle = React.useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle blur with mobile-aware delay
  const handleBlur = React.useCallback(() => {
    if (!closeOnBlur) return;

    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const delay = isMobile ? mobileBlurDelay : blurDelay;

    blurTimeoutRef.current = setTimeout(() => {
      if (!isInteracting) {
        close();
      }
    }, delay);
  }, [closeOnBlur, isInteracting, blurDelay, mobileBlurDelay, close]);

  // Handle selection
  const handleSelect = React.useCallback((callback?: () => void) => {
    callback?.();
    if (closeOnSelect) {
      close();
    }
  }, [closeOnSelect, close]);

  // Interaction handlers
  const startInteracting = React.useCallback(() => {
    setIsInteracting(true);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
  }, []);

  const stopInteracting = React.useCallback(() => {
    setIsInteracting(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = React.useCallback((
    event: React.KeyboardEvent,
    itemCount: number,
    onSelectItem?: (index: number) => void
  ) => {
    if (!isOpen) return false;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        return true;
      
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => (prev < itemCount - 1 ? prev + 1 : 0));
        return true;
      
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : itemCount - 1));
        return true;
      
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          onSelectItem?.(focusedIndex);
        }
        return true;
      
      default:
        return false;
    }
  }, [isOpen, focusedIndex, close]);

  // Click outside handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    isInteracting,
    focusedIndex,
    containerRef,
    open,
    close,
    toggle,
    handleBlur,
    handleSelect,
    startInteracting,
    stopInteracting,
    handleKeyDown,
    setFocusedIndex,
  };
}