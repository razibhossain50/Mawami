"use client";
import React from 'react';
import { Modal, Button } from "@heroui/react";
import { X, Share2 } from 'lucide-react';
import FacebookShareCard from './FacebookShareCard';
import { BiodataProfile } from '@/types/biodata';

interface FacebookShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BiodataProfile;
  biodataId: string;
}

const FacebookShareModal: React.FC<FacebookShareModalProps> = ({
  isOpen,
  onClose,
  profile,
  biodataId
}) => {
  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog className="bg-white">
        <Modal.Header className="flex items-center gap-2 border-b border-gray-200">
          <Share2 className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold">Share Profile</span>
        </Modal.Header>
        
        <Modal.Body className="py-6">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              Share this profile on Facebook or copy the link to share elsewhere
            </p>
          </div>
          
          <FacebookShareCard profile={profile} biodataId={biodataId} />
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When shared on Facebook, this profile will display basic information 
              including profile picture, age, height, profession, complexion, marital status, and religion.
            </p>
          </div>
        </Modal.Body>
        
        <Modal.Footer className="border-t border-gray-200">
          <Button
            variant="secondary"
            onPress={onClose}
            className="text-gray-600 hover:bg-gray-100"
          >
            Close
          </Button>
        </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
  );
};

export default FacebookShareModal;