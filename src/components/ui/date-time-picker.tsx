"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  label?: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  id?: string
}

const months = [
  { value: 0, label: "Січень" },
  { value: 1, label: "Лютий" },
  { value: 2, label: "Березень" },
  { value: 3, label: "Квітень" },
  { value: 4, label: "Травень" },
  { value: 5, label: "Червень" },
  { value: 6, label: "Липень" },
  { value: 7, label: "Серпень" },
  { value: 8, label: "Вересень" },
  { value: 9, label: "Жовтень" },
  { value: 10, label: "Листопад" },
  { value: 11, label: "Грудень" },
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function generateYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear + 10; i >= 1900; i--) {
    years.push(i)
  }
  return years
}

export function DateTimePicker({ label, value, onChange, id }: DateTimePickerProps) {
  const date = value || new Date()
  const [day, setDay] = React.useState(date.getDate())
  const [month, setMonth] = React.useState(date.getMonth())
  const [year, setYear] = React.useState(date.getFullYear())
  const [timeValue, setTimeValue] = React.useState(() => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  })

  const daysInMonth = React.useMemo(() => getDaysInMonth(year, month), [year, month])
  const years = React.useMemo(() => generateYears(), [])

  // Синхронизация с внешним value
  React.useEffect(() => {
    if (value) {
      const newDay = value.getDate()
      const newMonth = value.getMonth()
      const newYear = value.getFullYear()
      const hours = String(value.getHours()).padStart(2, '0')
      const minutes = String(value.getMinutes()).padStart(2, '0')
      
      setDay(newDay)
      setMonth(newMonth)
      setYear(newYear)
      setTimeValue(`${hours}:${minutes}`)
    }
  }, [value])

  const updateDate = React.useCallback((newDay: number, newMonth: number, newYear: number, time: string) => {
    const [hours, minutes] = time.split(':')
    const newDate = new Date(newYear, newMonth, newDay, parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
    onChange(newDate)
  }, [onChange])

  const handleDayChange = (newDay: number) => {
    const clampedDay = Math.min(newDay, daysInMonth)
    setDay(clampedDay)
    updateDate(clampedDay, month, year, timeValue)
  }

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth)
    const clampedDay = Math.min(day, getDaysInMonth(year, newMonth))
    setDay(clampedDay)
    updateDate(clampedDay, newMonth, year, timeValue)
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    const clampedDay = Math.min(day, getDaysInMonth(newYear, month))
    setDay(clampedDay)
    updateDate(clampedDay, month, newYear, timeValue)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    updateDate(day, month, year, newTime)
  }

  const displayDate = value 
    ? value.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : "Оберіть дату"

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 flex-1">
        {label && <Label htmlFor={id || "date-picker"} className="px-1">{label}</Label>}
        <div className="flex gap-2">
          <Select
            value={day.toString()}
            onValueChange={(val) => handleDayChange(parseInt(val))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="День" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {String(d).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month.toString()}
            onValueChange={(val) => handleMonthChange(parseInt(val))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Місяць" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year.toString()}
            onValueChange={(val) => handleYearChange(parseInt(val))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Рік" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-32">
        <Label htmlFor={`${id || "time"}-picker`} className="px-1">Час</Label>
        <Input
          type="time"
          id={`${id || "time"}-picker`}
          value={timeValue}
          onChange={handleTimeChange}
          className="bg-background"
        />
      </div>
    </div>
  )
}
