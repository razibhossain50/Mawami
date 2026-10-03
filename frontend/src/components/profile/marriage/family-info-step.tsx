'use client';
import { FormInput, FormTextarea, FormSelect } from "@/components/ui/form-fields";

import {Card} from "@heroui/react";

interface FamilyInfoStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function FamilyInfoStep({ data, errors, updateData }: FamilyInfoStepProps) {
  // Select values come straight from the form data
  const brothersCount = data.brothersCount !== undefined && data.brothersCount !== null ? String(data.brothersCount) : '';
  const sistersCount = data.sistersCount !== undefined && data.sistersCount !== null ? String(data.sistersCount) : '';

  const handleSelectionChange = (value: string | null, field: string) => {
    if (field === 'brothersCount' || field === 'sistersCount') {
      updateData({ [field]: value ? parseInt(value, 10) : undefined });
    } else {
      updateData({ [field]: value ?? undefined });
    }
  };


  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="border-b pb-4 border-gray-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-lg" />
          Family Information
        </h2>
        <p className="text-slate-500 mt-1">Tell us about your family background</p>
      </div>

      <div className="space-y-8">
        {/* Economic Condition */}
        <FormSelect
          label="Family's Economic Condition"
          placeholder="Select Economic Condition"
          value={data.economicCondition ? (data.economicCondition as string) : null}
          onValueChange={(value) => handleSelectionChange(value, 'economicCondition')}
          isRequired
          errorMessage={errors.economicCondition}
          isInvalid={!!errors.economicCondition}
          className="mb-6"
          options={['Lower Class', 'Lower Middle Class', 'Middle Class', 'Upper Middle Class', 'Upper Class'].map((item) => ({ value: String(item), label: item }))}
        />

        {/* Father Information */}
        <Card className="shadow-sm">
          <Card.Header className="border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800">Father&apos;s Information</h3>
          </Card.Header>
          <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <FormInput
              label="Father's Name"
              placeholder="Enter father's name"
              value={(data.fatherName as string) || ""}
              onValueChange={(value) => updateData({ fatherName: value })}
              isRequired
              description="Only visible for premium users"
              errorMessage={errors.fatherName}
              isInvalid={!!errors.fatherName}
            />
            <FormInput
              label="Father's Profession"
              placeholder="Enter father's profession"
              value={(data.fatherProfession as string) || ""}
              onValueChange={(value) => updateData({ fatherProfession: value })}
              isRequired
              errorMessage={errors.fatherProfession}
              isInvalid={!!errors.fatherProfession}
            />
            <FormSelect
              label="Is your father alive?"
              placeholder="Select Status"
              value={data.fatherAlive ? (data.fatherAlive as string) : null}
              onValueChange={(value) => handleSelectionChange(value, 'fatherAlive')}
              isRequired
              errorMessage={errors.fatherAlive}
              isInvalid={!!errors.fatherAlive}
              options={['Yes', 'No'].map((item) => ({ value: String(item), label: item }))}
            />
          </Card.Content>
        </Card>

        {/* Mother Information */}
        <Card className="shadow-sm">
          <Card.Header className="border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800">Mother&apos;s Information</h3>
          </Card.Header>
          <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <FormInput
              label="Mother's Name"
              placeholder="Enter mother's name"
              value={(data.motherName as string) || ""}
              onValueChange={(value) => updateData({ motherName: value })}
              description="Only visible for premium users"
              isRequired
              errorMessage={errors.motherName}
              isInvalid={!!errors.motherName}
            />
            <FormInput
              label="Mother's Profession"
              placeholder="Enter mother's profession"
              value={(data.motherProfession as string) || ""}
              onValueChange={(value) => updateData({ motherProfession: value })}
              isRequired
              errorMessage={errors.motherProfession}
              isInvalid={!!errors.motherProfession}
            />
            <FormSelect
              label="Is your mother alive?"
              placeholder="Select Status"
              value={data.motherAlive ? (data.motherAlive as string) : null}
              onValueChange={(value) => handleSelectionChange(value, 'motherAlive')}
              isRequired
              errorMessage={errors.motherAlive}
              isInvalid={!!errors.motherAlive}
              options={['Yes', 'No'].map((item) => ({ value: String(item), label: item }))}
            />
          </Card.Content>
        </Card>

        {/* Siblings Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormSelect
            label="How many brothers do you have?"
            placeholder="Select Number"
            value={brothersCount}
            onValueChange={(value) => handleSelectionChange(value, 'brothersCount')}
            isRequired
            errorMessage={errors.brothersCount}
            isInvalid={!!errors.brothersCount}
            options={Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))}
          />

          <FormSelect
            label="How many sisters do you have?"
            placeholder="Select Number"
            value={sistersCount}
            onValueChange={(value) => handleSelectionChange(value, 'sistersCount')}
            isRequired
            errorMessage={errors.sistersCount}
            isInvalid={!!errors.sistersCount}
            options={Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))}
          />
        </div>

        {/* Family Details */}
        <FormTextarea
          label="Write details about yourself and your family"
          placeholder="Share any additional information about yourself and your family background"
          value={(data.familyDetails as string) || ""}
          onValueChange={(value) => updateData({ familyDetails: value })}
          rows={4}
          className="mb-8"
        />
      </div>
    </div>
  );
}