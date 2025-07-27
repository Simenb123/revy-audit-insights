import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
  acceptedTypes?: string[];
}

export const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ onImageSelect, disabled, className, acceptedTypes = ['image/*'] }, ref) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
    };

    const handleClick = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.click();
      }
    };

    return (
      <>
        <input
          ref={ref}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className={cn('h-[40px] px-3', className)}
          title="Last opp bilde"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';