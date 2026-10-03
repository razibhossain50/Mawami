'use client';
import { Input, Select, SelectItem, Textarea, Checkbox, Card, CardBody, CardHeader, DatePicker } from "@heroui/react";
import { LocationSelector } from "@/components/form/LocationSelector";
import { useEffect } from "react";
import { ageFromDob } from "@/services/utils";
import { parseDate, CalendarDate, DateValue } from "@internationalized/date";

interface PersonalInfoStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function PersonalInfoStep({ data, errors, updateData }: PersonalInfoStepProps) {

  // Height options array
  const heightOptions = [
    { key: 'below-4', label: 'Below 4 feet' },
    { key: '4.0', label: '4\'0"' },
    { key: '4.1', label: '4\'1"' },
    { key: '4.2', label: '4\'2"' },
    { key: '4.3', label: '4\'3"' },
    { key: '4.4', label: '4\'4"' },
    { key: '4.5', label: '4\'5"' },
    { key: '4.6', label: '4\'6"' },
    { key: '4.7', label: '4\'7"' },
    { key: '4.8', label: '4\'8"' },
    { key: '4.9', label: '4\'9"' },
    { key: '4.10', label: '4\'10"' },
    { key: '4.11', label: '4\'11"' },
    { key: '5.0', label: '5\'0"' },
    { key: '5.1', label: '5\'1"' },
    { key: '5.2', label: '5\'2"' },
    { key: '5.3', label: '5\'3"' },
    { key: '5.4', label: '5\'4"' },
    { key: '5.5', label: '5\'5"' },
    { key: '5.6', label: '5\'6"' },
    { key: '5.7', label: '5\'7"' },
    { key: '5.8', label: '5\'8"' },
    { key: '5.9', label: '5\'9"' },
    { key: '5.10', label: '5\'10"' },
    { key: '5.11', label: '5\'11"' },
    { key: '6.0', label: '6\'0"' },
    { key: '6.1', label: '6\'1"' },
    { key: '6.2', label: '6\'2"' },
    { key: '6.3', label: '6\'3"' },
    { key: '6.4', label: '6\'4"' },
    { key: '6.5', label: '6\'5"' },
    { key: '6.6', label: '6\'6"' },
    { key: '6.7', label: '6\'7"' },
    { key: '6.8', label: '6\'8"' },
    { key: '6.9', label: '6\'9"' },
    { key: '6.10', label: '6\'10"' },
    { key: '6.11', label: '6\'11"' },
    { key: '7.0', label: '7\'0"' },
    { key: 'upper-7', label: 'Upper 7 feet' }
  ];

  const handleSelectionChange = (selection: unknown, field: string) => {
    let value: string | undefined;

    if (typeof selection === 'string') {
      value = selection;
    } else if (selection instanceof Set) {
      const setValues = Array.from(selection);
      value = setValues.length > 0 ? setValues[0] : undefined;
    } else if (selection && typeof selection === 'object' && 'currentKey' in selection) {
      value = (selection as { currentKey: string }).currentKey;
    } else if (Array.isArray(selection)) {
      value = selection.length > 0 ? selection[0] : undefined;
    }

    console.log(`🔄 Selection changed for ${field}:`, { selection, value });
    updateData({ [field]: value });
  };

  // Age is derived from the date of birth; keep the form's `age` field in sync with it
  const calculatedAge = ageFromDob(data.dateOfBirth);
  useEffect(() => {
    const age = calculatedAge ?? undefined;
    if (data.age !== age) {
      updateData({ age });
    }
  }, [calculatedAge]); // updateData is intentionally omitted: it changes identity on every parent render

  // Check if permanent address fields are complete
  const isPermanentAddressComplete = () => {
    const permanentLocation = data.permanentLocation as string;
    const permanentArea = data.permanentArea as string;
    return !!(permanentLocation && permanentArea &&
      permanentLocation.trim() !== '' && permanentArea.trim() !== '');
  };

  const handleSameAddressChange = (checked: boolean) => {
    // Only allow checking if permanent address is complete
    if (checked && !isPermanentAddressComplete()) {
      return;
    }

    console.log('🏠 Same address checkbox changed:', { checked, permanentLocation: data.permanentLocation, permanentArea: data.permanentArea });

    updateData({ sameAsPermanent: checked });

    if (checked) {
      // Copy permanent address to present address
      const updates = {
        presentLocation: data.permanentLocation,
        presentArea: data.permanentArea,
      };
      console.log('🏠 Copying permanent to present address:', updates);
      updateData(updates);
    } else {
      // When unchecking, clear present address fields to force user to fill them
      updateData({
        presentLocation: '',
        presentArea: '',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div className="border-b pb-4 border-gray-200">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg" />
            Personal Information
          </h2>
          <p className="text-slate-500 mt-1">Please provide your personal details accurately</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Religion */}
          <Select
            label="Religion"
            placeholder="Select Religion"
            selectedKeys={data.religion ? [data.religion as string] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'religion')}
            isRequired
            errorMessage={errors.religion}
            isInvalid={!!errors.religion}
          >
            {['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other'].map((item) => (
              <SelectItem key={item} textValue={item}>
                {item}
              </SelectItem>
            ))}
          </Select>

          {/* Biodata Type */}
          <Select
            label="Biodata Type"
            placeholder="Select Type"
            selectedKeys={data.biodataType ? [data.biodataType as string] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'biodataType')}
            isRequired
            errorMessage={errors.biodataType}
            isInvalid={!!errors.biodataType}
          >
            {['Male', 'Female'].map((item) => (
              <SelectItem key={item} textValue={item}>
                {item}
              </SelectItem>
            ))}
          </Select>
          {/* Marital Status */}
          <Select
            label="Marital Status"
            placeholder="Select Status"
            selectedKeys={data.maritalStatus ? [data.maritalStatus as string] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'maritalStatus')}
            isRequired
            errorMessage={errors.maritalStatus}
            isInvalid={!!errors.maritalStatus}
          >
            {['Married', 'Unmarried', 'Divorced', 'Widow', 'Widower'].map((item) => (
              <SelectItem key={item} textValue={item}>
                {item}
              </SelectItem>
            ))}
          </Select>

          {/* Date of Birth */}
          <div className="space-y-2.5">
            <DatePicker
              label="Date of Birth"
              value={(() => {
                try {
                  return data.dateOfBirth && typeof data.dateOfBirth === 'string' && data.dateOfBirth.trim() 
                    ? parseDate(data.dateOfBirth as string) as any
                    : null;
                } catch (error) {
                  console.log('❌ Error parsing date for DatePicker:', error);
                  return null;
                }
              })()}
              onChange={(date) => {
                if (date) {
                  const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                  updateData({ dateOfBirth: dateString });
                } else {
                  updateData({ dateOfBirth: "" });
                }
              }}
              maxValue={parseDate(new Date().toISOString().split('T')[0]) as any}
              showMonthAndYearPickers
              isRequired
              errorMessage={errors.dateOfBirth || errors.age}
              isInvalid={!!(errors.dateOfBirth || errors.age)}
              variant="flat"
              granularity="day"
            />
            {/* Age Display and Error */}
            {calculatedAge !== null && (
              <div className="text-sm text-green-600 font-medium">
                Age: {calculatedAge} years
              </div>
            )}
            {errors.age && (
              <div className="text-sm text-red-500">
                {errors.age}
              </div>
            )}
          </div>
          {/* Height */}
          <Select
            label="Height"
            placeholder="Select Height"
            selectedKeys={data.height ? [data.height as string] : []}
            onSelectionChange={(keys) => {
              console.log('🔄 Height selection changed:', { keys, currentHeight: data.height });
              handleSelectionChange(keys, 'height');
            }}
            isRequired
            errorMessage={errors.height}
            isInvalid={!!errors.height}
          >
            {heightOptions.map((item) => (
              <SelectItem key={item.key} textValue={item.label}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
          {/* Weight */}
          <Input
            type="number"
            label="Weight"
            placeholder="Enter weight"
            value={data.weight ? String(data.weight) : ""}
            onChange={(e) => {
              const value = e.target.value;
              updateData({ weight: value ? parseInt(value) || undefined : undefined });
            }}
            endContent={<span className="text-slate-500 text-sm">kg</span>}
            isRequired
            errorMessage={errors.weight}
            isInvalid={!!errors.weight}
          />

          {/* Complexion */}
          <Select
            label="Complexion"
            placeholder="Select Complexion"
            selectedKeys={data.complexion ? [data.complexion as string] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'complexion')}
            isRequired
            errorMessage={errors.complexion}
            isInvalid={!!errors.complexion}
          >
            {['Black', 'Dusky', 'Wheatish', 'Fair', 'Very Fair'].map((item) => (
              <SelectItem key={item} textValue={item}>
                {item}
              </SelectItem>
            ))}
          </Select>

          {/* Profession */}
          <Input
            label="Profession"
            placeholder="Enter your profession"
            value={(data.profession as string) || ""}
            onChange={(e) => updateData({ profession: e.target.value })}
            isRequired
            errorMessage={errors.profession}
            isInvalid={!!errors.profession}
          />

          {/* Blood Group */}
          <Select
            label="Blood Group"
            placeholder="Select Blood Group"
            selectedKeys={data.bloodGroup ? [data.bloodGroup as string] : []}
            onSelectionChange={(keys) => handleSelectionChange(keys, 'bloodGroup')}
            isRequired
            errorMessage={errors.bloodGroup}
            isInvalid={!!errors.bloodGroup}
          >
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((item) => (
              <SelectItem key={item} textValue={item}>
                {item}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Address Section */}
      <Card className="mt-8 shadow-md">
        <CardHeader className="border-b pb-4 border-gray-200">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg" />
            Address Information
          </h3>
        </CardHeader>
        <CardBody className="space-y-8">
          {/* Permanent Address */}
          <div>
            <div className="rounded-lg bg-slate-50 p-4 shadow-inner">
              <LocationSelector
                name="permanentLocation"
                data={data}
                errors={errors}
                updateData={updateData}
                onLocationSelect={() => { }}
                label="Permanent Address"
                placeholder="Select permanent address"
                value={data.permanentLocation as string}
                isRequired
              />
              <div className="mt-4">
                <Input
                  label="Area or Village Name"
                  placeholder="Enter area or village name"
                  value={(data.permanentArea as string) || ""}
                  onChange={(e) => updateData({ permanentArea: e.target.value })}
                  isRequired
                  errorMessage={errors.permanentArea}
                  isInvalid={!!errors.permanentArea}
                />
              </div>
            </div>
          </div>

          {/* Same Address Checkbox */}
          <div className="flex items-center space-x-2 px-2">
            <Checkbox
              isSelected={(data.sameAsPermanent as boolean) || false}
              onValueChange={handleSameAddressChange}
              isDisabled={!isPermanentAddressComplete()}
            >
              Present address is same as permanent address
              {!isPermanentAddressComplete() && (
                <span className="text-sm text-gray-500 ml-2">
                  (Complete permanent address first)
                </span>
              )}
            </Checkbox>
          </div>

          {/* Present Address */}
          <div className={`${data.sameAsPermanent ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="rounded-lg bg-slate-50 p-4 shadow-inner">
              <LocationSelector
                name="presentLocation"
                data={data}
                errors={errors}
                updateData={updateData}
                onLocationSelect={() => { }}
                label="Present Address"
                placeholder="Select present address"
                value={data.presentLocation as string}
                isRequired
              />
              <div className="mt-4">
                <Input
                  label="Area or Village Name"
                  placeholder="Enter area or village name"
                  value={(data.presentArea as string) || ""}
                  onChange={(e) => updateData({ presentArea: e.target.value })}
                  isRequired
                  errorMessage={errors.presentArea}
                  isInvalid={!!errors.presentArea}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Health Issues */}
      <Textarea
        label="Do you have any physical or mental health issues?"
        placeholder="Please describe any health issues or write 'None' if you don't have any"
        value={(data.healthIssues as string) || ""}
        onChange={(e) => updateData({ healthIssues: e.target.value })}
        minRows={3}
        isRequired
        errorMessage={errors.healthIssues}
        isInvalid={!!errors.healthIssues}
      />
    </div>
  );
}
