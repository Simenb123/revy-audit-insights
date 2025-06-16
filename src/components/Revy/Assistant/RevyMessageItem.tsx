
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import { MessageContentParser } from './MessageContentParser';

interface RevyMessageItemProps {
  message: RevyMessage;
  isEmbedded?: boolean;
}

export const RevyMessageItem = ({ message, isEmbedded = false }: RevyMessageItemProps) => {
  const { sender, content, timestamp } = message;

  const userMessageClass = isEmbedded
    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-sm"
    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl shadow-md";
    
  const revyMessageContainerClass = "flex items-start gap-3";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
    : "bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200";

  const formattedTimestamp = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: nb }) : '';

  if (sender === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="flex flex-col items-end max-w-[85%]">
          <div className={`${userMessageClass} rounded-br-sm max-w-full`}>
            <div className={`break-words ${isEmbedded ? 'text-sm' : 'text-base'}`}>
              {content}
            </div>
          </div>
          {formattedTimestamp && (
            <span className={`text-gray-500 mt-2 px-1 ${isEmbedded ? 'text-xs' : 'text-sm'}`}>
              {formattedTimestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (sender === 'revy') {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className={`flex flex-col items-start ${isEmbedded ? 'max-w-[90%]' : 'max-w-[88%]'}`}>
          <div className={revyMessageContainerClass}>
            <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0 mt-1" />
            <div className={`${revyMessageClass} rounded-bl-sm prose prose-sm max-w-none flex-1`}>
              <MessageContentParser content={content as string} isEmbedded={isEmbedded} />
            </div>
          </div>
          {formattedTimestamp && (
            <span className={`text-gray-500 mt-2 ml-12 px-1 ${isEmbedded ? 'text-xs' : 'text-sm'}`}>
              {formattedTimestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
};
