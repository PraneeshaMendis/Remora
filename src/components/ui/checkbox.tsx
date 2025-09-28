"use client"

import * as React from "react"
import clsx from "clsx"

type CheckboxProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, defaultChecked, onCheckedChange, disabled, className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={clsx(
          "h-4 w-4 cursor-pointer rounded border border-gray-300",
          "accent-black dark:accent-white",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...rest}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export default Checkbox
