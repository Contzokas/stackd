import { useState } from 'react';

export function useColumnDragAndDrop(columns, setColumns) {
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleColumnDragStart = (column) => {
    setDraggedColumn(column);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumn?.id !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedColumn || draggedColumn.id === targetColumnId) {
      setDragOverColumn(null);
      return;
    }

    setColumns((prevColumns) => {
      const draggedIndex = prevColumns.findIndex((col) => col.id === draggedColumn.id);
      const targetIndex = prevColumns.findIndex((col) => col.id === targetColumnId);

      const newColumns = [...prevColumns];
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);

      return newColumns;
    });

    setDragOverColumn(null);
  };

  return {
    draggedColumn,
    dragOverColumn,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  };
}