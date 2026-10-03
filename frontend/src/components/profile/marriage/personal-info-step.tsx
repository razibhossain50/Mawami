'use client';
import { FormInput, FormTextarea, FormSelect, FormDatePicker } from "@/components/ui/form-fields";
import { Checkbox, Card } from "@heroui/react";
import { LocationSelector } from "@/components/form/LocationSelector";
import { useEffect } from "react";
import { ageFromDob } from "@/services/utils";

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

  const handleSelectionChange = (value: string | null, field: string) => {
    updateData({ [field]: value ?? undefined });
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
          <FormSelect
            label="Religion"
            placeholder="Select Religion"
            value={data.religion ? data.religion as string : null}
            onValueChange={(value) => handleSelectionChange(value, 'religion')}
            isRequired
            errorMessage={errors.religion}
            isInvalid={!!errors.religion}
            options={['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other'].map((item) => ({ value: String(item), label: item }))}
          />

          {/* Biodata Type */}
          <FormSelect
            label="Biodata Type"
            placeholder="Select Type"
            value={data.biodataType ? data.biodataType as string : null}
            onValueChange={(value) => handleSelectionChange(value, 'biodataType')}
            isRequired
            errorMessage={errors.biodataType}
            isInvalid={!!errors.biodataType}
            options={['Male', 'Female'].map((item) => ({ value: String(item), label: item }))}
          />
          {/* Marital Status */}
          <FormSelect
            label="Marital Status"
            placeholder="Select Status"
            value={data.maritalStatus ? data.maritalStatus as string : null}
            onValueChange={(value) => handleSelectionChange(value, 'maritalStatus')}
            isRequired
            errorMessage={errors.maritalStatus}
            isInvalid={!!errors.maritalStatus}
            options={['Married', 'Unmarried', 'Divorced', 'Widow', 'Widower'].map((item) => ({ value: String(item), label: item }))}
          />

          {/* Date of Birth */}
          <div className="space-y-2.5">
            <FormDatePicker
              label="Date of Birth"
              value={typeof data.dateOfBirth === 'string' ? data.dateOfBirth : ''}
              onValueChange={(dateOfBirth) => updateData({ dateOfBirth })}
              maxValue={new Date().toISOString().slice(0, 10)}
              isRequired
              errorMessage={errors.dateOfBirth || errors.age}
              isInvalid={!!(errors.dateOfBirth || errors.age)}
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
          <FormSelect
            label="Height"
            placeholder="Select Height"
            value={data.height ? (data.height as string) : null}
            onValueChange={(value) => handleSelectionChange(value, 'height')}
            isRequired
            errorMessage={errors.height}
            isInvalid={!!errors.height}
            options={heightOptions.map((item) => ({ value: item.key, label: item.label }))}
          />
          {/* Weight */}
          <FormInput
            type="number"
            label="Weight"
            placeholder="Enter weight"
            value={data.weight ? String(data.weight) : ""}
            onValueChange={(value) => {
              updateData({ weight: value ? parseInt(value) || undefined : undefined });
            }}
            endContent={<span className="text-slate-500 text-sm">kg</span>}
            isRequired
            errorMessage={errors.weight}
            isInvalid={!!errors.weight}
          />

          {/* Complexion */}
          <FormSelect
            label="Complexion"
            placeholder="Select Complexion"
            value={data.complexion ? data.complexion as string : null}
            onValueChange={(value) => handleSelectionChange(value, 'complexion')}
            isRequired
            errorMessage={errors.complexion}
            isInvalid={!!errors.complexion}
            options={['Black', 'Dusky', 'Wheatish', 'Fair', 'Very Fair'].map((item) => ({ value: String(item), label: item }))}
          />

          {/* Profession */}
          <FormInput
            label="Profession"
            placeholder="Enter your profession"
            value={(data.profession as string) || ""}
            onValueChange={(value) => updateData({ profession: value })}
            isRequired
            errorMessage={errors.profession}
            isInvalid={!!errors.profession}
          />

          {/* Blood Group */}
          <FormSelect
            label="Blood Group"
            placeholder="Select Blood Group"
            value={data.bloodGroup ? data.bloodGroup as string : null}
            onValueChange={(value) => handleSelectionChange(value, 'bloodGroup')}
            isRequired
            errorMessage={errors.bloodGroup}
            isInvalid={!!errors.bloodGroup}
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((item) => ({ value: String(item), label: item }))}
          />
        </div>
      </div>

      {/* Address Section */}
      <Card className="mt-8 shadow-md">
        <Card.Header className="border-b pb-4 border-gray-200">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg" />
            Address Information
          </h3>
        </Card.Header>
        <Card.Content className="space-y-8">
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
                <FormInput
                  label="Area or Village Name"
                  placeholder="Enter area or village name"
                  value={(data.permanentArea as string) || ""}
                  onValueChange={(value) => updateData({ permanentArea: value })}
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
              onChange={handleSameAddressChange}
              isDisabled={!isPermanentAddressComplete()}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                Present address is same as permanent address
                {!isPermanentAddressComplete() && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Complete permanent address first)
                  </span>
                )}
              </Checkbox.Content>
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
                <FormInput
                  label="Area or Village Name"
                  placeholder="Enter area or village name"
                  value={(data.presentArea as string) || ""}
                  onValueChange={(value) => updateData({ presentArea: value })}
                  isRequired
                  errorMessage={errors.presentArea}
                  isInvalid={!!errors.presentArea}
                />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Health Issues */}
      <FormTextarea
        label="Do you have any physical or mental health issues?"
        placeholder="Please describe any health issues or write 'None' if you don't have any"
        value={(data.healthIssues as string) || ""}
        onValueChange={(value) => updateData({ healthIssues: value })}
        rows={3}
        isRequired
        errorMessage={errors.healthIssues}
        isInvalid={!!errors.healthIssues}
      />
    </div>
  );
}
