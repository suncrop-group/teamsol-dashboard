import { MultiSelect, Select } from '@mantine/core';

interface Option {
  label: string;
  // Ids are numbers in most lists; Mantine wants strings, so they are
  // converted here and the original value is handed back to the caller.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

interface SelectBoxProps {
  data: Option[];
  // Single: the selected value. Multiple: the selected options.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  isMultiple?: boolean;
  error?: string;
}

const SelectBox = ({
  data,
  selectedValue,
  onValueChange,
  placeholder = 'Select',
  label,
  disabled = false,
  required = false,
  isMultiple = false,
  error,
}: SelectBoxProps) => {
  // Mantine throws on repeated option values, so a list with a duplicated id
  // keeps its first entry only.
  const seen = new Set<string>();
  const options = (data || [])
    .map((item) => ({
      label: String(item.label ?? ''),
      value: String(item.value),
    }))
    .filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  const original = (value: string) =>
    (data || []).find((item) => String(item.value) === value);

  if (isMultiple) {
    return (
      <MultiSelect
        label={label}
        placeholder={selectedValue?.length ? undefined : placeholder}
        data={options}
        value={(selectedValue || []).map((item: Option) => String(item.value))}
        onChange={(values) =>
          onValueChange(values.map(original).filter(Boolean))
        }
        disabled={disabled}
        withAsterisk={required}
        error={error}
        searchable
        clearable
        nothingFoundMessage="No items to display"
      />
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={options}
      value={
        selectedValue === undefined || selectedValue === null || selectedValue === ''
          ? null
          : String(selectedValue)
      }
      onChange={(value) => onValueChange(value === null ? '' : original(value)?.value)}
      disabled={disabled}
      withAsterisk={required}
      error={error}
      searchable
      // Picking the selected option again must not clear the field.
      allowDeselect={false}
      nothingFoundMessage="No items to display"
    />
  );
};

export default SelectBox;
