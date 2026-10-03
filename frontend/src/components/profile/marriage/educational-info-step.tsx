import { FormInput, FormSelect } from "@/components/ui/form-fields";

interface EducationalInfoStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function EducationalInfoStep({ data, errors, updateData }: EducationalInfoStepProps) {
  return (
    <div className="space-y-8">
      <div className="border-b pb-4 border-gray-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-tr from-green-600 to-green-400 rounded-lg" />
          Educational Information
        </h2>
        <p className="text-slate-500 mt-1">Share your educational background</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Education Medium */}
        <FormSelect
          label="Your Education Medium"
          placeholder="Select Medium"
          value={data.educationMedium ? (data.educationMedium as string) : null}
          onValueChange={(selected) => {
            const value = selected ?? undefined;
            updateData({ educationMedium: value });
          }}
          isRequired
          errorMessage={errors.educationMedium}
          isInvalid={!!errors.educationMedium}
          options={[{ value: "Bangla", label: "Bangla" }, { value: "English", label: "English" }, { value: "Arabic", label: "Arabic" }, { value: "Others", label: "Others" }]}
        />

        {/* Highest Education Level */}
        <FormSelect
          label="Highest Education Level"
          placeholder="Select Level"
          value={data.highestEducation ? (data.highestEducation as string) : null}
          onValueChange={(selected) => {
            const value = selected ?? undefined;
            updateData({ highestEducation: value });
          }}
          isRequired
          errorMessage={errors.highestEducation}
          isInvalid={!!errors.highestEducation}
          options={[{ value: "Below SSC", label: "Below SSC" }, { value: "SSC", label: "SSC" }, { value: "HSC", label: "HSC" }, { value: "Diploma", label: "Diploma" }, { value: "Diploma Running", label: "Diploma Running" }, { value: "Honours", label: "Honours" }, { value: "Honours Running", label: "Honours Running" }, { value: "Masters", label: "Masters" }, { value: "Masters Running", label: "Masters Running" }, { value: "PHD", label: "PHD" }]}
        />

        {/* Institute Name */}
        <FormInput
          label="Institute or University Name"
          placeholder="Enter institute or university name"
          value={(data.instituteName as string) || ""}
          onValueChange={(value) => updateData({ instituteName: value })}
          isRequired
          errorMessage={errors.instituteName}
          isInvalid={!!errors.instituteName}
        />

        {/* Subject */}
        <FormInput
          label="Which subject do you study"
          placeholder="Enter your subject/major"
          value={(data.subject as string) || ""}
          onValueChange={(value) => updateData({ subject: value })}
          isRequired
          errorMessage={errors.subject}
          isInvalid={!!errors.subject}
        />

        {/* Passing Year */}
        <FormInput
          label="Passing Year"
          placeholder="Enter passing year"
          value={(data.passingYear as string) || ""}
          onValueChange={(value) => updateData({ passingYear: value })}
          isRequired
          errorMessage={errors.passingYear}
          isInvalid={!!errors.passingYear}
        />

        {/* Result */}
        <FormSelect
          label="Result"
          placeholder="Select Result"
          value={data.result ? (data.result as string) : null}
          onValueChange={(selected) => {
            const value = selected ?? undefined;
            updateData({ result: value });
          }}
          isRequired
          errorMessage={errors.result}
          isInvalid={!!errors.result}
          options={[{ value: "Not Available", label: "Not Available" }, { value: "A+", label: "A+" }, { value: "A", label: "A" }, { value: "A-", label: "A-" }, { value: "B+", label: "B+" }, { value: "B", label: "B" }, { value: "B-", label: "B-" }, { value: "C+", label: "C+" }, { value: "C", label: "C" }, { value: "D", label: "D" }]}
        />
      </div>
    </div>
  );
}
