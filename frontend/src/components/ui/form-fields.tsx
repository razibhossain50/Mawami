"use client";
import type { ComponentProps, ReactNode } from "react";
import { parseDate, type CalendarDate, type DateValue } from "@internationalized/date";
import {
  Calendar,
  CloseButton,
  DateField,
  DatePicker,
  Description,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  type Key,
} from "@heroui/react";

import { cn } from "@/services/utils";

// App-level form fields composed from HeroUI v3 primitives, so every form gets the same
// label / description / error layout. They keep the app's original (HeroUI v2 "flat") look:
// a filled box with the label inside it, above the value. The box colours come from the
// --field-* tokens in globals.css.

type FieldSize = "md" | "lg";

const FIELD_SIZES: Record<FieldSize, { label: string; labelled: string; plain: string; text: string }> = {
  // text sizes repeat the sm: breakpoint because HeroUI's field styles set sm:text-sm
  md: { label: "top-2 text-xs", labelled: "min-h-14 pt-5", plain: "min-h-10", text: "text-sm sm:text-sm" },
  lg: { label: "top-2.5 text-[13px]", labelled: "min-h-16 pt-6", plain: "min-h-12", text: "text-base sm:text-base" },
};

// Root of every field: positions the inside label and exposes data-invalid to children
const rootClass = (className?: string) => cn("group relative", className ?? "w-full");

const insideLabelClass = (size: FieldSize) =>
  cn(
    "pointer-events-none absolute left-3 z-10 font-normal text-zinc-600 group-data-[invalid=true]:text-red-600",
    FIELD_SIZES[size].label,
  );

type FieldVariant = "flat" | "bordered";

// v2 "bordered": white box with a 2px gray border that darkens on hover/focus
const BORDERED =
  "border-2 border-zinc-200 bg-white hover:bg-white data-[hovered=true]:bg-white hover:border-zinc-400 " +
  "focus-within:border-zinc-800 group-data-[invalid=true]:border-red-500 group-data-[invalid=true]:bg-white";

// The box (input group / select trigger / textarea / date group)
const boxClass = (size: FieldSize, hasLabel: boolean, variant: FieldVariant, extra?: string) =>
  cn(
    "w-full group-data-[invalid=true]:bg-red-50",
    hasLabel ? FIELD_SIZES[size].labelled : FIELD_SIZES[size].plain,
    variant === "bordered" && BORDERED,
    extra,
  );

type NativeInputProps = Omit<ComponentProps<typeof InputGroup.Input>, "className" | "type" | "placeholder">;

interface FieldBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  /** md (default) or lg, as in HeroUI v2 */
  size?: FieldSize;
  /** flat (default, filled gray) or bordered (white with border), as in HeroUI v2 */
  variant?: FieldVariant;
}

export interface FormInputProps extends FieldBaseProps {
  /** Controlled value; omit to leave the input uncontrolled (e.g. with react-hook-form `register`) */
  value?: string;
  onValueChange?: (value: string) => void;
  type?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  inputClassName?: string;
  groupClassName?: string;
  /** Extra native props for the <input>, e.g. `{...register("email")}` */
  inputProps?: NativeInputProps;
  /** Shows a clear button while there is a value */
  onClear?: () => void;
}

export function FormInput({
  label, description, errorMessage, isInvalid, isRequired, isDisabled, isReadOnly, className, id,
  value, onValueChange, type = "text", name, placeholder, autoComplete,
  startContent, endContent, inputClassName, groupClassName, inputProps, onClear, size = "md", variant = "flat", ...rest
}: FormInputProps) {
  const showClear = !!onClear && !!value;
  return (
    <TextField
      id={id}
      className={rootClass(className)}
      type={type}
      name={name ?? inputProps?.name}
      value={value}
      onChange={onValueChange}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      aria-label={rest["aria-label"]}
    >
      {label && <Label className={insideLabelClass(size)}>{label}</Label>}
      <InputGroup className={boxClass(size, !!label, variant, groupClassName)}>
        {startContent && <InputGroup.Prefix>{startContent}</InputGroup.Prefix>}
        <InputGroup.Input
          {...inputProps}
          className={cn(label ? "py-1" : undefined, FIELD_SIZES[size].text, inputClassName)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {(endContent || showClear) && (
          <InputGroup.Suffix>
            {showClear && <CloseButton aria-label="Clear" onPress={onClear} />}
            {endContent}
          </InputGroup.Suffix>
        )}
      </InputGroup>
      {description && <Description>{description}</Description>}
      {isInvalid && errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
}

export interface FormTextareaProps extends FieldBaseProps {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  rows?: number;
  textareaClassName?: string;
  onBlur?: () => void;
}

export function FormTextarea({
  label, description, errorMessage, isInvalid, isRequired, isDisabled, isReadOnly, className, id,
  value, onValueChange, name, placeholder, rows = 4, textareaClassName, onBlur, size = "md", variant = "flat", ...rest
}: FormTextareaProps) {
  return (
    <TextField
      id={id}
      className={rootClass(className)}
      name={name}
      value={value}
      onChange={onValueChange}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      aria-label={rest["aria-label"]}
    >
      {label && <Label className={insideLabelClass(size)}>{label}</Label>}
      <TextArea
        className={cn(boxClass(size, !!label, variant), label && "pt-6", FIELD_SIZES[size].text, textareaClassName)}
        placeholder={placeholder}
        rows={rows}
        onBlur={onBlur}
      />
      {description && <Description>{description}</Description>}
      {isInvalid && errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Plain-text label for typeahead/accessibility when `label` isn't a string */
  textValue?: string;
}

export interface FormSelectProps extends FieldBaseProps {
  options: ReadonlyArray<SelectOption>;
  /** Selected option value ("" or null/undefined for none) */
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  name?: string;
  triggerClassName?: string;
  /** Called when the options popover closes (e.g. to mark the field as touched) */
  onClose?: () => void;
}

export function FormSelect({
  label, description, errorMessage, isInvalid, isRequired, isDisabled, className, id,
  options, value, onValueChange, placeholder, name, triggerClassName, onClose, size = "md", variant = "flat", ...rest
}: FormSelectProps) {
  return (
    <Select
      id={id}
      className={rootClass(className)}
      name={name}
      placeholder={placeholder}
      value={value || null}
      onChange={(key: Key | null) => onValueChange?.(key === null ? null : String(key))}
      onOpenChange={onClose ? (isOpen: boolean) => { if (!isOpen) onClose(); } : undefined}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      aria-label={rest["aria-label"]}
    >
      {label && <Label className={insideLabelClass(size)}>{label}</Label>}
      <Select.Trigger className={boxClass(size, !!label, variant, cn("items-center", FIELD_SIZES[size].text, triggerClassName))}>
        <Select.Value className={FIELD_SIZES[size].text} />
        <Select.Indicator />
      </Select.Trigger>
      {description && <Description>{description}</Description>}
      {isInvalid && errorMessage && <FieldError>{errorMessage}</FieldError>}
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.value}
              id={option.value}
              textValue={option.textValue ?? (typeof option.label === "string" ? option.label : option.value)}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export interface FormDatePickerProps extends FieldBaseProps {
  /** ISO date string (YYYY-MM-DD) or "" */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Latest selectable date (YYYY-MM-DD) */
  maxValue?: string;
  onBlur?: () => void;
}

const toCalendarDate = (value?: string): CalendarDate | null => {
  if (!value?.trim()) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
};

export function FormDatePicker({
  label, description, errorMessage, isInvalid, isRequired, isDisabled, isReadOnly, className, id,
  value, onValueChange, maxValue, onBlur, size = "md", variant = "flat", ...rest
}: FormDatePickerProps) {
  return (
    <DatePicker
      id={id}
      className={rootClass(className)}
      value={toCalendarDate(value)}
      // CalendarDate.toString() is the ISO YYYY-MM-DD form
      onChange={(date: DateValue | null) => onValueChange?.(date ? date.toString().slice(0, 10) : "")}
      maxValue={toCalendarDate(maxValue)}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      onBlur={onBlur}
      aria-label={rest["aria-label"]}
    >
      {label && <Label className={insideLabelClass(size)}>{label}</Label>}
      <DateField.Group fullWidth className={boxClass(size, !!label, variant, cn("h-auto", FIELD_SIZES[size].text))}>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {description && <Description>{description}</Description>}
      {isInvalid && errorMessage && <FieldError>{errorMessage}</FieldError>}
      <DatePicker.Popover>
        <Calendar aria-label={typeof label === "string" ? label : "Date"}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
