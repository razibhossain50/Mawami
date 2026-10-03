'use client';

import { Input, Select, SelectItem, Textarea, Card, CardBody, CardHeader } from "@heroui/react";

interface FamilyInfoStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function FamilyInfoStep({ data, errors, updateData }: FamilyInfoStepProps) {
  // Select values come straight from the form data
  const brothersCount = data.brothersCount !== undefined && data.brothersCount !== null ? String(data.brothersCount) : '';
  const sistersCount = data.sistersCount !== undefined && data.sistersCount !== null ? String(data.sistersCount) : '';

  const handleSelectionChange = (selection: any, field: string) => {
    let value: string | undefined;
    
    if (typeof selection === 'string') {
      value = selection;
    } else if (selection instanceof Set) {
      const setValues = Array.from(selection);
      value = setValues.length > 0 ? setValues[0] : undefined;
    } else if (selection?.currentKey) {
      value = selection.currentKey;
    } else if (Array.isArray(selection)) {
      value = selection.length > 0 ? selection[0] : undefined;
    }


    if (field === 'brothersCount') {
      updateData({ brothersCount: value ? parseInt(value, 10) : undefined });
    } else if (field === 'sistersCount') {
      updateData({ sistersCount: value ? parseInt(value, 10) : undefined });
    } else {
      updateData({ [field]: value });
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
        <Select
          label="Family's Economic Condition"
          placeholder="Select Economic Condition"
          selectedKeys={data.economicCondition ? [data.economicCondition as string] : []}
          onSelectionChange={(keys) => handleSelectionChange(keys, 'economicCondition')}
          isRequired
          errorMessage={errors.economicCondition}
          isInvalid={!!errors.economicCondition}
          className="mb-6"
        >
          {['Lower Class', 'Lower Middle Class', 'Middle Class', 'Upper Middle Class', 'Upper Class'].map((item) => (
            <SelectItem key={item} textValue={item}>
              {item}
            </SelectItem>
          ))}
        </Select>

        {/* Father Information */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800">Father&apos;s Information</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <Input
              label="Father's Name"
              placeholder="Enter father's name"
              value={(data.fatherName as string) || ""}
              onChange={(e) => updateData({ fatherName: e.target.value })}
              isRequired
              description="Only visible for premium users"
              errorMessage={errors.fatherName}
              isInvalid={!!errors.fatherName}
            />
            <Input
              label="Father's Profession"
              placeholder="Enter father's profession"
              value={(data.fatherProfession as string) || ""}
              onChange={(e) => updateData({ fatherProfession: e.target.value })}
              isRequired
              errorMessage={errors.fatherProfession}
              isInvalid={!!errors.fatherProfession}
            />
            <Select
              label="Is your father alive?"
              placeholder="Select Status"
              selectedKeys={data.fatherAlive ? [data.fatherAlive as string] : []}
              onSelectionChange={(keys) => handleSelectionChange(keys, 'fatherAlive')}
              isRequired
              errorMessage={errors.fatherAlive}
              isInvalid={!!errors.fatherAlive}
            >
              {['Yes', 'No'].map((item) => (
                <SelectItem key={item} textValue={item}>
                  {item}
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>

        {/* Mother Information */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800">Mother&apos;s Information</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <Input
              label="Mother's Name"
              placeholder="Enter mother's name"
              value={(data.motherName as string) || ""}
              onChange={(e) => updateData({ motherName: e.target.value })}
              description="Only visible for premium users"
              isRequired
              errorMessage={errors.motherName}
              isInvalid={!!errors.motherName}
            />
            <Input
              label="Mother's Profession"
              placeholder="Enter mother's profession"
              value={(data.motherProfession as string) || ""}
              onChange={(e) => updateData({ motherProfession: e.target.value })}
              isRequired
              errorMessage={errors.motherProfession}
              isInvalid={!!errors.motherProfession}
            />
            <Select
              label="Is your mother alive?"
              placeholder="Select Status"
              selectedKeys={data.motherAlive ? [data.motherAlive as string] : []}
              onSelectionChange={(keys) => handleSelectionChange(keys, 'motherAlive')}
              isRequired
              errorMessage={errors.motherAlive}
              isInvalid={!!errors.motherAlive}
            >
              {['Yes', 'No'].map((item) => (
                <SelectItem key={item} textValue={item}>
                  {item}
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>

        {/* Siblings Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Select
            label="How many brothers do you have?"
            placeholder="Select Number"
            selectedKeys={brothersCount ? [brothersCount] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'brothersCount')}
            isRequired
            errorMessage={errors.brothersCount}
            isInvalid={!!errors.brothersCount}
          >
            {Array.from({ length: 11 }, (_, i) => (
              <SelectItem key={String(i)} textValue={String(i)}>
                {i}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="How many sisters do you have?"
            placeholder="Select Number"
            selectedKeys={sistersCount ? [sistersCount] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'sistersCount')}
            isRequired
            errorMessage={errors.sistersCount}
            isInvalid={!!errors.sistersCount}
          >
            {Array.from({ length: 11 }, (_, i) => (
              <SelectItem key={String(i)} textValue={String(i)}>
                {i}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Family Details */}
        <Textarea
          label="Write details about yourself and your family"
          placeholder="Share any additional information about yourself and your family background"
          value={(data.familyDetails as string) || ""}
          onChange={(e) => updateData({ familyDetails: e.target.value })}
          minRows={4}
          className="mb-8"
        />
      </div>
    </div>
  );
}