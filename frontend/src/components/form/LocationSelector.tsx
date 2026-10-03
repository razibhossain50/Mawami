import { useState, useRef, useEffect } from "react";
import { ChevronLeft, X, ChevronRight, ChevronDown } from "lucide-react";
import { geoLocation } from "../../api/geo-location";

type SelectionPath = {
  country?: string;
  division?: string;
  district?: string;
  upazila?: string;
};

type Level = "country" | "division" | "district" | "upazila";

type LocationOption = {
  name: string;
  value: string;
  hasChildren: boolean;
};

interface LocationSelectorProps {
  onLocationSelect: (location: string) => void;
  value?: string;
  // Form integration props
  name?: string; // Form field name
  data?: Record<string, unknown>; // Form data
  errors?: Record<string, string>; // Form errors
  updateData?: (data: Partial<Record<string, unknown>>) => void; // Form update function
  // Accessibility props
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  // Display props
  placeholder?: string;
  label?: string;
  isRequired?: boolean; // Whether the field is required
}

export function LocationSelector({
  onLocationSelect,
  value,
  name,
  data: formData,
  errors,
  updateData,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
  placeholder = "Select location",
  label = "Select Your Location",
  isRequired = false
}: LocationSelectorProps) {
  const [currentLevel, setCurrentLevel] = useState<Level>("country");
  const [selectionPath, setSelectionPath] = useState<SelectionPath>({});
  const [locationSelection, setLocationSelection] = useState<string>(value ?? "");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  const locationContainerRef = useRef<HTMLDivElement>(null);

  // Get data from geoLocation
  const sourceData = geoLocation[0];

  // Follow the external value prop when it changes (during render, not in an effect)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== undefined) {
      setLocationSelection(value);
    }
  }

  // Check if an option has children (should show arrow)
  const hasChildren = (value: string, level: Level): boolean => {
    switch (level) {
      case "country":
        return true; // Country always has divisions
      case "division":
        if (value === "All Divisions") return false; // "All Divisions" doesn't have children
        const division = sourceData?.divisions.find((div) => div.name === value);
        return !!(division && division.districts && division.districts.length > 0);
      case "district":
        if (value === "All Districts") return false; // "All Districts" doesn't have children
        const selectedDivision = sourceData?.divisions.find((div) => div.name === selectionPath.division);
        const district = selectedDivision?.districts?.find((dist) => dist.name === value);
        return !!(district && district.upazilas && district.upazilas.length > 0);
      case "upazila":
        if (value === "All Upazilas") return false;
        return false; // Upazilas are the final level, no children
      default:
        return false;
    }
  };

  // Get current location options based on level and selection path
  const getCurrentLocationOptions = (): LocationOption[] => {
    switch (currentLevel) {
      case "country":
        return [{ name: sourceData?.country || "", value: sourceData?.country || "", hasChildren: hasChildren(sourceData?.country || "", "country") }];
      case "division":
        return sourceData?.divisions.map((div) => ({
          name: div.name,
          value: div.name,
          hasChildren: hasChildren(div.name, "division")
        })) || [];
      case "district":
        const selectedDivision = sourceData?.divisions.find((div) => div.name === selectionPath.division);
        if (!selectedDivision || !selectedDivision.districts) return [];

        return selectedDivision.districts.map((dist) => ({
          name: dist.name,
          value: dist.name,
          hasChildren: hasChildren(dist.name, "district")
        }));
      case "upazila":
        const division = sourceData?.divisions.find((div) => div.name === selectionPath.division);
        const selectedDistrict = division?.districts?.find((dist) => dist.name === selectionPath.district);
        return selectedDistrict?.upazilas?.map((upazila) => ({
          name: upazila,
          value: upazila,
          hasChildren: false
        })) || [];
      default:
        return [];
    }
  };

  // Handle location selection
  const handleLocationSelection = (value: string) => {
    const newPath = { ...selectionPath };

    switch (currentLevel) {
      case "country":
        newPath.country = value;
        setSelectionPath(newPath);
        setCurrentLevel("division");
        break;
      case "division":
        if (value === "All Divisions") {
          // Close dropdown and set selection
          const fullPath = `${newPath.country} > All Divisions`;
          setLocationSelection(fullPath);
          onLocationSelect(fullPath);
          
          // Update form data if available
          if (updateData && name) {
            updateData({ [name]: fullPath });
          }
          
          setIsLocationDropdownOpen(false);
          return;
        }
        newPath.division = value;
        setSelectionPath(newPath);
        setCurrentLevel("district");
        break;
      case "district":
        if (value === "All Districts") {
          // Close dropdown and set selection
          const fullPath = `${newPath.country} > ${newPath.division} > All Districts`;
          setLocationSelection(fullPath);
          onLocationSelect(fullPath);
          
          // Update form data if available
          if (updateData && name) {
            updateData({ [name]: fullPath });
          }
          
          setIsLocationDropdownOpen(false);
          return;
        }
        newPath.district = value;
        setSelectionPath(newPath);
        setCurrentLevel("upazila");
        break;
      case "upazila":
        if (value === "All Upazilas") {
          // Close dropdown and set selection
          const fullPath = `${newPath.country} > ${newPath.division} > ${newPath.district} > All Upazilas`;
          setLocationSelection(fullPath);
          onLocationSelect(fullPath);
          
          // Update form data if available
          if (updateData && name) {
            updateData({ [name]: fullPath });
          }
          
          setIsLocationDropdownOpen(false);
          return;
        }
        newPath.upazila = value;
        setSelectionPath(newPath);
        const fullPath = `${newPath.country} > ${newPath.division} > ${newPath.district} > ${value}`;
        setLocationSelection(fullPath);
        onLocationSelect(fullPath);
        
        // Update form data if available
        if (updateData && name) {
          updateData({ [name]: fullPath });
        }
        
        setIsLocationDropdownOpen(false);
        break;
    }
  };

  // Reset location selection
  const resetLocation = () => {
    setSelectionPath({});
    setLocationSelection("");
    setCurrentLevel("country");
    setIsLocationDropdownOpen(true);

    onLocationSelect("");
    
    // Update form data if available
    if (updateData && name) {
      updateData({ [name]: "" });
    }
  };

  const handleToggleDropdown = () => {
    setIsLocationDropdownOpen(!isLocationDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(event.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const levelTitles = {
    country: "Select Country",
    division: "Select Division",
    district: "Select District",
    upazila: "Select Upazila",
  };

  // Get display value
  const getDisplayValue = () => {
    if (locationSelection) {
      return locationSelection;
    }

    // Build partial path based on current selections
    const parts = [];
    if (selectionPath.country) parts.push(selectionPath.country);
    if (selectionPath.division) parts.push(selectionPath.division);
    if (selectionPath.district) parts.push(selectionPath.district);
    if (selectionPath.upazila) parts.push(selectionPath.upazila);

    return parts.length > 0 ? parts.join(' > ') : '';
  };

  const displayValue = getDisplayValue();
  
  // Get error message for form integration
  const errorMessage = name && errors ? errors[name] : undefined;
  const hasError = !!errorMessage;

  return (
    <div className="relative" ref={locationContainerRef}>
      <div
        className={`w-full px-3 py-[10px] rounded-[14px] h-16 bg-[#f4f4f5] cursor-pointer hover:bg-muted/50 transition-colors ${
          hasError ? 'border-2 border-red-500' : ''
        }`}
        onClick={handleToggleDropdown}
        id={id}
        role="button"
        tabIndex={0}
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : ariaLabel ? { "aria-label": ariaLabel } : { "aria-label": "Select location" })}
        aria-expanded={isLocationDropdownOpen}
        aria-haspopup="listbox"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleDropdown();
          }
        }}
      >
        <div className="text-[13px] text-muted">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </div>
        <div className="flex items-center justify-between text-muted">
          <span className={`text-md truncate pr-2`}>
            {displayValue || placeholder}
          </span>
          {displayValue ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetLocation();
              }}
              className="p-1 hover:bg-default rounded-full transition-colors flex-shrink-0"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDown className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {isLocationDropdownOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Header */}
          {currentLevel !== "country" && (
            <div className="flex items-center justify-between p-2 border-b border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const levels: Level[] = ["country", "division", "district", "upazila"];
                  const currentIndex = levels.indexOf(currentLevel);
                  if (currentIndex > 0) {
                    setCurrentLevel(levels[currentIndex - 1]);
                  }
                }}
                className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
                aria-label="Go back to previous level"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <span className="text-sm font-medium text-gray-700">{levelTitles[currentLevel]}</span>
            </div>
          )}

          <div className="p-2 max-h-48 overflow-y-auto">
            {getCurrentLocationOptions().map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocationSelection(option.value);
                }}
                className="w-full p-2 text-left rounded-md hover:bg-muted transition-colors flex items-center justify-between"
              >
                <span className="text-sm">{option.name}</span>
                {option.hasChildren && (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>
            ))}
            {getCurrentLocationOptions().length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No options available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <p className="text-sm text-red-500 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}