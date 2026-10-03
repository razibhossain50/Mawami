'use client';
import { FormInput, FormTextarea } from "@/components/ui/form-fields";
import { Card } from "@heroui/react";
import { AgeRangeSlider } from "@/components/ui/age-range-slider";
import { useState } from "react";

interface PartnerPreferencesStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function PartnerPreferencesStep({
  data,
  errors,
  updateData,
}: PartnerPreferencesStepProps) {
  const [ageRange, setAgeRange] = useState<number[]>([
    (data.partnerAgeMin as number) || 18,
    (data.partnerAgeMax as number) || 40,
  ]);

  const handleAgeRangeChange = (values: number[]) => {
    setAgeRange(values);
    updateData({
      partnerAgeMin: values[0],
      partnerAgeMax: values[1],
    });
  };

  return (
    <div className="space-y-8">
      <div className="border-b pb-4 border-gray-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-lg" />
          Desired Life Partner
        </h2>
        <p className="text-slate-500 mt-1">
          Describe your preferences for an ideal life partner
        </p>
      </div>

      <Card className="shadow-md">
        <Card.Header className="border-b pb-4 border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Partner Preferences
          </h3>
        </Card.Header>
        <Card.Content className="space-y-8 pt-6">
          {/* Partner Age Range */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <AgeRangeSlider value={ageRange as [number, number]} onChange={handleAgeRangeChange} />
            </div>

            {(errors.partnerAgeMin || errors.partnerAgeMax) && (
              <p className="text-xs text-red-500 mt-1">
                {errors.partnerAgeMin || errors.partnerAgeMax}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <FormInput
              label="Preferred Complexion"
              placeholder="Enter preferred complexion"
              value={(data.partnerComplexion as string) || ""}
              onValueChange={(value) => updateData({ partnerComplexion: value })}
              isRequired
              errorMessage={errors.partnerComplexion}
              isInvalid={!!errors.partnerComplexion}
            />

            <FormInput
              label="Preferred Height"
              placeholder="Enter preferred height"
              value={(data.partnerHeight as string) || ""}
              onValueChange={(value) => updateData({ partnerHeight: value })}
              isRequired
              errorMessage={errors.partnerHeight}
              isInvalid={!!errors.partnerHeight}
            />

            <FormInput
              label="Preferred Education"
              placeholder="Enter preferred education"
              value={(data.partnerEducation as string) || ""}
              onValueChange={(value) => updateData({ partnerEducation: value })}
              isRequired
              errorMessage={errors.partnerEducation}
              isInvalid={!!errors.partnerEducation}
            />

            <FormInput
              label="Preferred Profession"
              placeholder="Enter preferred profession"
              value={(data.partnerProfession as string) || ""}
              onValueChange={(value) => updateData({ partnerProfession: value })}
              isRequired
              errorMessage={errors.partnerProfession}
              isInvalid={!!errors.partnerProfession}
            />
          </div>

          <FormTextarea
            label="Preferred Place"
            placeholder="Enter preferred location"
            value={(data.partnerLocation as string) || ""}
            onValueChange={(value) => updateData({ partnerLocation: value })}
            isRequired
            errorMessage={errors.partnerLocation}
            isInvalid={!!errors.partnerLocation}
            rows={2}
          />

          <FormTextarea
            label="Details about the prospective spouse"
            placeholder="Share your expectations and preferences for your life partner"
            value={(data.partnerDetails as string) || ""}
            onValueChange={(value) => updateData({ partnerDetails: value })}
            rows={3}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
