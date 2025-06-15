
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MinusCircle, X, Sparkles, BookOpen } from 'lucide-react';
import RevyAvatar from '../RevyAvatar';
import { RevyMessageList } from './RevyMessageList';
import { RevyInput } from './RevyInput';
import { RevyMessage } from '@/types/revio';

interface FloatingRevyAssistantProps {
  currentTip: string;
  messages: RevyMessage[];
  isTyping: boolean;
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
}

const FloatingRevyHeader = ({ toggleMinimize, toggleOpen }: { toggleMinimize: () => void; toggleOpen: () => void }) => (
  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex items-center justify-between cursor-pointer" onClick={toggleMinimize}>
    <div className="flex items-center gap-2">
      <RevyAvatar size="sm" />
      <div>
        <span className="font-medium">Revy AI-Assistent</span>
        <div className="flex items-center gap-1 text-xs opacity-90">
          <Sparkles className="h-3 w-3" />
          <span>Oppgradert med kontekst</span>
        </div>
      </div>
    </div>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}>
        <MinusCircle size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
        <X size={16} />
      </Button>
    </div>
  </div>
);

export const FloatingRevyAssistant = (props: FloatingRevyAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const inputProps = { ...props, isEmbedded: false };

  return (
    <>
      {!isOpen && (
        <motion.div 
          className="fixed bottom-4 right-4 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={toggleOpen}
        >
          <div className="relative">
            <RevyAvatar size="lg" className="cursor-pointer hover:shadow-lg transition-shadow duration-300 animate-bounce-limited" />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
        </motion.div>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-0 right-0 z-50 w-96 bg-gray-50 shadow-xl rounded-tl-2xl overflow-hidden flex flex-col border-t-2 border-l-2 border-purple-200"
            style={{ height: isMinimized ? '48px' : '550px', maxHeight: '80vh' }}
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <FloatingRevyHeader toggleMinimize={toggleMinimize} toggleOpen={toggleOpen} />
            
            {!isMinimized && (
              <>
                {props.currentTip && (
                  <div className="p-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
                    <div className="flex items-start gap-2.5">
                      <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      <span className="leading-relaxed">{props.currentTip}</span>
                    </div>
                  </div>
                )}

                <RevyMessageList messages={props.messages} isTyping={props.isTyping} />
                
                <RevyInput {...inputProps} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
