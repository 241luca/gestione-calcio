import React, { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid';

/**
 * Componente Checkbox avanzato per selezione multipla
 * Con stati: none, some, all
 */
export const SelectionCheckbox = ({ 
  items = [],
  selectedItems = [],
  onSelectionChange,
  className = ''
}) => {
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;
  
  const handleClick = () => {
    if (allSelected) {
      // Deseleziona tutto
      onSelectionChange([]);
    } else {
      // Seleziona tutto
      onSelectionChange(items);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        onClick={handleClick}
        className={`
          relative w-5 h-5 rounded border-2 transition-all
          ${allSelected 
            ? 'bg-blue-600 border-blue-600' 
            : someSelected 
              ? 'bg-blue-100 border-blue-600'
              : 'bg-white border-gray-300 hover:border-gray-400'
          }
        `}
        title={
          allSelected ? 'Deseleziona tutto' : 
          someSelected ? 'Seleziona tutto' : 
          'Seleziona tutto'
        }
      >
        {allSelected && (
          <CheckIcon className="w-3 h-3 text-white absolute inset-0 m-auto" />
        )}
        {someSelected && (
          <MinusIcon className="w-3 h-3 text-blue-600 absolute inset-0 m-auto" />
        )}
      </button>
      
      {selectedItems.length > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {selectedItems.length} di {items.length}
        </span>
      )}
    </div>
  );
};

/**
 * Componente per selezione rapida con bottoni
 */
export const QuickSelection = ({
  items = [],
  selectedItems = [],
  onSelectionChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Selezione:</span>
      
      <button
        onClick={() => onSelectionChange(items)}
        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        Tutti
      </button>
      
      <button
        onClick={() => onSelectionChange([])}
        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        Nessuno
      </button>
      
      <button
        onClick={() => {
          // Inverti selezione
          const newSelection = items.filter(item => !selectedItems.includes(item));
          onSelectionChange(newSelection);
        }}
        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
      >
        Inverti
      </button>

      {selectedItems.length > 0 && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-sm font-medium text-blue-600">
            {selectedItems.length} selezionati
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Badge indicatore selezione
 */
export const SelectionBadge = ({
  count = 0,
  className = ''
}) => {
  if (count === 0) return null;

  return (
    <div className={`
      inline-flex items-center gap-1 px-2 py-1 
      bg-blue-100 text-blue-700 rounded-full text-sm font-medium
      ${className}
    `}>
      <CheckSolidIcon className="w-4 h-4" />
      <span>{count}</span>
    </div>
  );
};

/**
 * Helper per gestire la selezione
 */
export const useSelection = (items = []) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const selectAll = () => setSelectedItems(items);
  const selectNone = () => setSelectedItems([]);
  
  const selectItem = (item) => {
    setSelectedItems(prev => [...prev, item]);
  };
  
  const deselectItem = (item) => {
    setSelectedItems(prev => prev.filter(i => i.id !== item.id));
  };
  
  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      deselectItem(item);
    } else {
      selectItem(item);
    }
  };

  const isSelected = (item) => {
    return selectedItems.find(i => i.id === item.id) !== undefined;
  };

  return {
    selectedItems,
    setSelectedItems,
    selectAll,
    selectNone,
    selectItem,
    deselectItem,
    toggleItem,
    isSelected,
    hasSelection: selectedItems.length > 0,
    selectionCount: selectedItems.length
  };
};
