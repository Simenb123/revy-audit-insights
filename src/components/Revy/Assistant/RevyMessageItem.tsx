
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';

interface RevyMessageItemProps {
  message: RevyMessage;
  isEmbedded?: boolean;
}

export const RevyMessageItem = ({ message, isEmbedded = false }: RevyMessageItemProps) => {
  const { sender, content, timestamp } = message;

  const userMessageClass = isEmbedded
    ? "bg-blue-600 text-white p-2.5 rounded-lg"
    : "bg-blue-600 text-white p-3 rounded-xl";
    
  const revyMessageContainerClass = "flex items-start gap-2.5";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm"
    : "bg-white border border-gray-200 p-3 rounded-2xl shadow-sm";

  const formattedTimestamp = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: nb }) : '';

  if (sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end max-w-[90%]">
          <div className={`${userMessageClass} rounded-br-none`}>
            {content}
          </div>
          {formattedTimestamp && <span className="text-xs text-gray-500 mt-1.5 px-1">{formattedTimestamp}</span>}
        </div>
      </div>
    );
  }

  if (sender === 'revy') {
    return (
       <div className="flex justify-start">
        <div className={`flex flex-col items-start ${isEmbedded ? 'max-w-[90%]' : 'max-w-[85%]'}`}>
          <div className={revyMessageContainerClass}>
            <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0" />
            <div className={`${revyMessageClass} rounded-bl-none prose prose-sm max-w-none leading-relaxed`}>
              {content}
            </div>
          </div>
          {formattedTimestamp && <span className="text-xs text-gray-500 mt-1.5 ml-10 px-1">{formattedTimestamp}</span>}
        </div>
      </div>
    );
  }

  return null;
};
