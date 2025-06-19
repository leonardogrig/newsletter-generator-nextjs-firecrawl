import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
}

const Select = ({
  value,
  onValueChange,
  children,
  placeholder,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
  };

  // Find the selected item's label
  const selectedLabel = React.Children.toArray(children).find((child) => {
    if (
      React.isValidElement<SelectItemProps>(child) &&
      child.props.value === value
    ) {
      return child.props.children;
    }
    return null;
  });

  const displayValue = React.isValidElement<SelectItemProps>(selectedLabel)
    ? selectedLabel.props.children
    : placeholder;

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement<SelectItemProps>(child)) {
                return React.cloneElement(child, {
                  onSelect: handleItemSelect,
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ value, children, onSelect }: SelectItemProps) => {
  return (
    <div
      className="bg-white relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground hover:bg-gray-100"
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  );
};

export { Select, SelectItem };
