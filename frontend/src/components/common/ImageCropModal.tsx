'use client';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Crop as CropIcon, X, Check } from "lucide-react";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop, PixelCrop } from 'react-image-crop';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageSrc: string;
  crop: Crop | undefined;
  completedCrop: PixelCrop | undefined;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isUploading?: boolean;
  aspectRatio?: number;
  title?: string;
}

export function ImageCropModal({
  isOpen,
  onClose,
  onConfirm,
  imageSrc,
  crop,
  completedCrop,
  onImageLoad,
  onCropChange,
  onCropComplete,
  imgRef,
  canvasRef,
  isUploading = false,
  aspectRatio = 1,
  title = "Crop Image"
}: ImageCropModalProps) {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        placement="center"
        backdrop="blur"
        classNames={{
          base: "bg-white",
          header: "border-b border-gray-200",
          body: "py-6",
          footer: "border-t border-gray-200"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <CropIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Adjust the crop area and click confirm</p>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className="flex justify-center">
              <div className="relative max-w-full max-h-[400px] overflow-hidden rounded-lg border border-gray-200">
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={onCropComplete}
                  aspect={aspectRatio}
                  circularCrop={false}
                  className="max-w-full max-h-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </ReactCrop>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Drag the corners or edges to adjust the crop area.
                The cropped image will be used as your profile picture.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="flat"
              onPress={onClose}
              className="flex items-center gap-2 text-gray-600 hover:bg-gray-100"
              isDisabled={isUploading}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={onConfirm}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={isUploading}
              isDisabled={!completedCrop}
            >
              <Check className="h-4 w-4" />
              Confirm Crop
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </>
  );
}
