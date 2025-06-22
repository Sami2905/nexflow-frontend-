import React from 'react';
import Badge from './Badge';
import Avatar from './Avatar';
import { HiPencil, HiTrash, HiFlag, HiChatAlt2 } from 'react-icons/hi';

const TicketCard = ({ ticket, onEdit, onDelete, onComment }) => {
  const { title, status, priority, assignedTo, commentsCount } = ticket;

  const priorityConfig = {
    'High': { icon: <HiFlag className="text-red-500" />, color: 'red' },
    'Medium': { icon: <HiFlag className="text-yellow-500" />, color: 'yellow' },
    'Low': { icon: <HiFlag className="text-green-500" />, color: 'green' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <div className="flex items-center space-x-4 mb-3">
          <Badge status={status} />
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            {priorityConfig[priority]?.icon}
            <span className="ml-1">{priority}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          {assignedTo ? (
            <Avatar name={assignedTo.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-500">
              N/A
            </div>
          )}
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <HiChatAlt2 className="mr-1" />
            <span>{commentsCount || 0}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onEdit(ticket)} className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <HiPencil className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(ticket._id)} className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <HiTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketCard; 