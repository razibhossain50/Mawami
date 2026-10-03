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

// App-level form fields composed from HeroUI v3 primitives, so every form gets the same
// label / description / error layout.

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
  startContent, endContent, inputClassName, groupClassName, inputProps, onClear, ...rest
}: FormInputProps) {
  const showClear = !!onClear && !!value;
  return (
    <TextField
      id={id}
      className={className ?? "w-full"}
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
      {label && <Label>{label}</Label>}
      <InputGroup className={groupClassName}>
        {startContent && <InputGroup.Prefix>{startContent}</InputGroup.Prefix>}
        <InputGroup.Input
          {...inputProps}
          className={inputClassName}
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
  value, onValueChange, name, placeholder, rows = 4, textareaClassName, onBlur, ...rest
}: FormTextareaProps) {
  return (
    <TextField
      id={id}
      className={className ?? "w-full"}
      name={name}
      value={value}
      onChange={onValueChange}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      aria-label={rest["aria-label"]}
    >
      {label && <Label>{label}</Label>}
      <TextArea className={textareaClassName} placeholder={placeholder} rows={rows} onBlur={onBlur} />
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
  options, value, onValueChange, placeholder, name, triggerClassName, onClose, ...rest
}: FormSelectProps) {
  return (
    <Select
      id={id}
      className={className ?? "w-full"}
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
      {label && <Label>{label}</Label>}
      <Select.Trigger className={triggerClassName}>
        <Select.Value />
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
  value, onValueChange, maxValue, onBlur, ...rest
}: FormDatePickerProps) {
  return (
    <DatePicker
      id={id}
      className={className ?? "w-full"}
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
      {label && <Label>{label}</Label>}
      <DateField.Group fullWidth>
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
