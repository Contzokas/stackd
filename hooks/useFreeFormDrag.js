import { useState, useCallback, useRef } from 'react';

export function useFreeFormDrag(columns, setColumns) {
  const [draggedColumn, setDraggedColumn] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleColumnMouseDown = useCallback((e, column) => {
    // Prevent dragging if clicking on interactive elements
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    dragOffsetRef.current = { x: offsetX, y: offsetY };
    setDraggedColumn(column);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!draggedColumn) return;

    // Direct update without RAF for instant response
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === draggedColumn.id
          ? { ...col, position: { x: newX, y: newY } }
          : col
      )
    );
  }, [draggedColumn, setColumns]);

  const handleMouseUp = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  return {
    draggedColumn,
    handleColumnMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}