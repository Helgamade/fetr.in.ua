"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  label?: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  id?: string
}

export function DateTimePicker({ label, value, onChange, id }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState(() => {
    if (value) {
      const hours = String(value.getHours()).padStart(2, '0')
      const minutes = String(value.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return '00:00'
  })

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = timeValue.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      onChange(newDate)
      setOpen(false)
    } else {
      onChange(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (value) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(value)
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      onChange(newDate)
    } else {
      const [hours, minutes] = newTime.split(':')
      const today = new Date()
      today.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      onChange(today)
    }
  }

  React.useEffect(() => {
    if (value) {
      const hours = String(value.getHours()).padStart(2, '0')
      const minutes = String(value.getMinutes()).padStart(2, '0')
      setTimeValue(`${hours}:${minutes}`)
    }
  }, [value])

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 flex-1">
        {label && <Label htmlFor={id || "date-picker"} className="px-1">{label}</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={id || "date-picker"}
              className="w-full justify-between font-normal"
            >
              {value ? value.toLocaleDateString('uk-UA') : "Оберіть дату"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60] overflow-visible" align="start" sideOffset={4} side="bottom">
            <div className="overflow-visible">
              <Calendar
                mode="single"
                selected={value}
                captionLayout="dropdown-buttons"
                onSelect={handleDateSelect}
                className="rounded-md border"
                fromYear={1900}
                toYear={new Date().getFullYear() + 10}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3 w-32">
        <Label htmlFor={`${id || "time"}-picker`} className="px-1">Час</Label>
        <Input
          type="time"
          id={`${id || "time"}-picker`}
          value={timeValue}
          onChange={handleTimeChange}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}


