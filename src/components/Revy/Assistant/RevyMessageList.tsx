
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import RevyAvatar from '../RevyAvatar';
import { RevyMessage } from '@/types/revio';
import { RevyMessageItem } from './RevyMessageItem';
import { useIsMobile } from "@/hooks/use-mobile";

interface RevyMessageListProps {
  messages: RevyMessage[];
  isTyping: boolean;
  isEmbedded?: boolean;
}

export const RevyMessageList = ({ messages, isTyping, isEmbedded = false }: RevyMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const revyMessageContainerClass = "flex items-start gap-3";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-100 p-3 rounded-xl rounded-bl-sm shadow-sm"
    : "bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="h-full overflow-y-auto">
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'} bg-gradient-to-b from-gray-50/30 to-gray-50/60`}>
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="mb-6">
              <RevyAvatar size="lg" className="mx-auto mb-4" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className={`font-semibold text-gray-900 mb-2 ${isEmbedded ? 'text-base' : 'text-lg'}`}>
                Hei! Jeg er AI-Revy
              </h3>
              <p className={`text-gray-600 leading-relaxed ${isEmbedded ? 'text-sm' : 'text-base'}`}>
                Jeg er din smarte revisjonsassistent. Spør meg om revisjon, ISA-standarder, 
                regnskap eller andre faglige spørsmål. Jeg har tilgang til oppdatert fagstoff 
                og kan hjelpe deg med komplekse revisjonsutfordringer.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Revisjon av inntekter', 'ISA 315', 'Materialitet', 'Risikovurdering'].map((suggestion, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={msg.id} className="transform transition-all duration-300">
            <RevyMessageItem message={msg} isEmbedded={isEmbedded} />
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className={`${revyMessageContainerClass} ${isEmbedded ? 'max-w-[90%]' : 'max-w-[88%]'}`}>
              <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0 mt-1" />
              <div className={`${revyMessageClass} flex items-center gap-3`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className={`text-gray-600 ${isEmbedded ? 'text-sm' : 'text-base'}`}>
                  AI-Revy analyserer...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
