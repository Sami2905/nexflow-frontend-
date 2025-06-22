import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from './Badge';
import Avatar from './Avatar';
import IconButton from './IconButton';
import { HiPencil, HiChat, HiUser } from 'react-icons/hi';
import SpinnerOverlay from './SpinnerOverlay';

const COLUMN_COLORS = {
  Backlog: 'bg-blue-50 dark:bg-blue-900/20',
  'In Progress': 'bg-yellow-50 dark:bg-yellow-900/20',
  'In Review': 'bg-purple-50 dark:bg-purple-900/20',
  Done: 'bg-green-50 dark:bg-green-900/20',
};

const TaskCard = ({ bug, onEdit, onComment, onAssign }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bug._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-border-light dark:border-border-dark cursor-grab active:cursor-grabbing group transition hover:shadow-lg hover:-translate-y-1"
    >
      <div className="flex items-center gap-2 mb-1">
        <Badge label={bug.status} type="status" />
        <Badge label={bug.priority} type="priority" />
      </div>
      <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark text-base mb-1 truncate" title={bug.title}>{bug.title}</div>
      <div className="flex items-center gap-2 text-xs text-textSecondary-light dark:text-textSecondary-dark mb-2">
        <Avatar name={bug.assignedTo?.name || bug.assignedTo?.email || ''} size={6} />
        <span>{bug.assignedTo?.name || bug.assignedTo?.email || 'Unassigned'}</span>
      </div>
      <div className="flex gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton icon={HiPencil} label="Edit" tooltip="Edit ticket" onClick={() => onEdit && onEdit(bug)} size="sm" />
        <IconButton icon={HiChat} label="Comment" color="info" tooltip="View comments" onClick={() => onComment && onComment(bug)} size="sm" />
        <IconButton icon={HiUser} label="Assign" tooltip="Assign user" onClick={() => onAssign && onAssign(bug)} size="sm" />
      </div>
    </div>
  );
};

const Column = ({ id, title, bugs, onEdit, onComment, onAssign }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-80 rounded-lg p-2 ${COLUMN_COLORS[title] || 'bg-background-light dark:bg-background-dark'}`}>
      <div className="flex items-center justify-between p-2 border-b border-border-light dark:border-border-dark mb-4">
        <h3 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{title}</h3>
        <span className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark bg-white dark:bg-gray-900 rounded-full px-2 py-0.5 border border-border-light dark:border-border-dark">{bugs.length}</span>
      </div>
      <SortableContext items={bugs.map(b => b._id)} strategy={rectSortingStrategy}>
        <div className="space-y-4 min-h-[60px]">
          {bugs.map(bug => (
            <TaskCard key={bug._id} bug={bug} onEdit={onEdit} onComment={onComment} onAssign={onAssign} />
          ))}
          {bugs.length === 0 && (
            <div className="text-center py-8 text-textSecondary-light dark:text-textSecondary-dark">
              <p className="text-sm">No issues</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default function BoardView() {
  const { project } = useOutletContext();
  const [tasks, setTasks] = useState({ Backlog: [], 'In Progress': [], 'In Review': [], Done: [] });
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  const mapStatusToColumn = (status) => {
    switch (status) {
      case 'Open': return 'Backlog';
      case 'In Progress': return 'In Progress';
      case 'In Review': return 'In Review';
      case 'Closed': return 'Done';
      default: return 'Backlog';
    }
  };

  useEffect(() => {
    const fetchBugs = async () => {
      if (!project) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/bugs?project=${project._id}&limit=200`, { // Fetch more for a board
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const newTasks = { Backlog: [], 'In Progress': [], 'In Review': [], Done: [] };
          (data.bugs || []).forEach(bug => {
            const columnName = mapStatusToColumn(bug.status);
            if (newTasks[columnName]) {
              newTasks[columnName].push(bug);
            }
          });
          setTasks(newTasks);
        }
      } catch (error) { console.error("Failed to fetch bugs", error); }
      finally { setLoading(false); }
    };
    fetchBugs();
  }, [project]);
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const sourceColumn = Object.keys(tasks).find(column => 
      tasks[column].some(task => task._id === taskId)
    );
    const destinationColumn = over.id;

    if (sourceColumn === destinationColumn) {
      // Reordering within the same column
      const columnTasks = tasks[sourceColumn];
      const oldIndex = columnTasks.findIndex(task => task._id === taskId);
      const newIndex = columnTasks.findIndex(task => task._id === over.id);
      
      if (oldIndex !== newIndex) {
        const newColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
        setTasks(prev => ({
          ...prev,
          [sourceColumn]: newColumnTasks
        }));
      }
    } else {
      // Moving to a different column
      const sourceTasks = tasks[sourceColumn];
      const task = sourceTasks.find(t => t._id === taskId);
      
      if (task) {
        // Update local state optimistically
        const newTasks = {
          ...tasks,
          [sourceColumn]: sourceTasks.filter(t => t._id !== taskId),
          [destinationColumn]: [...tasks[destinationColumn], task]
        };
        setTasks(newTasks);

        // Map column name back to status for API
        const statusMap = {
          'Backlog': 'Open',
          'In Progress': 'In Progress', 
          'In Review': 'In Review',
          'Done': 'Closed'
        };
        
        const newStatus = statusMap[destinationColumn];
        
        // Update on backend
        updateBugStatus(taskId, newStatus);
      }
    }
  };

  const updateBugStatus = async (bugId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bugs/${bugId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        // Revert optimistic update on error
        console.error('Failed to update bug status');
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      // Revert optimistic update on error
    }
  };

  // Add handlers for edit, comment, assign (can be no-ops or connect to modals)
  const handleEdit = bug => {/* TODO: connect to edit modal */};
  const handleComment = bug => {/* TODO: connect to comment modal */};
  const handleAssign = bug => {/* TODO: connect to assign modal */};

  if (loading) {
    return <SpinnerOverlay message="Loading board..." />;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 h-full overflow-x-auto p-1">
        {loading ? (
          <div className="flex gap-6 w-full">
            {Object.keys(tasks).map(columnName => (
              <div key={columnName} className={`flex-shrink-0 w-80 rounded-lg p-2 ${COLUMN_COLORS[columnName] || 'bg-background-light dark:bg-background-dark'}`}>
                <div className="flex items-center justify-between p-2 border-b border-border-light dark:border-border-dark mb-4">
                  <h3 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{columnName}</h3>
                  <span className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark bg-white dark:bg-gray-900 rounded-full px-2 py-0.5 border border-border-light dark:border-border-dark">...</span>
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-surface-light dark:bg-surface-dark p-4 rounded-md shadow-sm border border-border-light dark:border-border-dark h-16 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          Object.entries(tasks).map(([columnName, bugs]) => (
             <Column key={columnName} id={columnName} title={columnName} bugs={bugs} onEdit={handleEdit} onComment={handleComment} onAssign={handleAssign} />
          ))
        )}
      </div>
    </DndContext>
  );
}