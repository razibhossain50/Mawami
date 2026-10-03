'use client';
import { Button, Card } from "@heroui/react";
import { Upload, Crop as CropIcon, Trash2, User } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useImageCrop, ImageCropResult } from '@/hooks/useImageCrop';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploadWithCropProps {
  onCropComplete: (result: ImageCropResult) => void;
  onRemove?: () => void;
  currentImageUrl?: string;
  aspectRatio?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  title?: string;
  description?: string;
  className?: string;
}

export function ImageUploadWithCrop({
  onCropComplete,
  onRemove,
  currentImageUrl,
  aspectRatio = 1,
  maxFileSize = 5 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'],
  title = "Profile Picture",
  description = "Upload and crop your profile picture",
  className = ""
}: ImageUploadWithCropProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    showCropModal,
    imageSrc,
    crop,
    completedCrop,
    previewUrl,
    imgRef,
    canvasRef,
    handleFileSelect,
    onImageLoad,
    handleCropConfirm,
    handleCropCancel,
    resetCrop,
    setCrop,
    setCompletedCrop,
  } = useImageCrop({
    aspectRatio,
    maxFileSize,
    allowedTypes,
    onCropComplete,
    onError: (error) => {
      console.error('Image crop error:', error);
    }
  });

  const handleRemoveImage = () => {
    resetCrop();
    onRemove?.();
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <Card className="bg-white border border-gray-200">
        <Card.Content className="p-6">
          {displayImage ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                  <Image
                    src={displayImage}
                    alt="Profile preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                
                {/* Crop indicator if it's a cropped image */}
                {previewUrl && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <CropIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleFileInputClick}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Change Image
                </Button>
                
                {displayImage && (
                  <Button
                    variant="danger-soft"
                    size="sm"
                    onPress={handleRemoveImage}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {/* Upload Placeholder */}
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <User className="h-12 w-12 text-gray-400" />
              </div>

              {/* Upload Button */}
              <Button
                variant="secondary"
                onPress={handleFileInputClick}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>

              <p className="text-xs text-gray-500 text-center max-w-xs">
                Supported formats: JPEG, PNG<br />
                Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={handleCropCancel}
        onConfirm={handleCropConfirm}
        imageSrc={imageSrc}
        crop={crop}
        completedCrop={completedCrop}
        onImageLoad={onImageLoad}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        imgRef={imgRef}
        canvasRef={canvasRef}
        aspectRatio={aspectRatio}
        title={`Crop ${title}`}
      />
    </div>
  );
}
