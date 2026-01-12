"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
}

export function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
    // Internal state
    const [hour, setHour] = React.useState<string>("12");
    const [minute, setMinute] = React.useState<string>("00");
    const [ampm, setAmpm] = React.useState<"AM" | "PM">("AM");

    // Sync state from prop only on mount or if undefined
    React.useEffect(() => {
        if (date) {
            let h = date.getHours();
            const m = date.getMinutes();
            const isPm = h >= 12;
            if (h > 12) h -= 12;
            if (h === 0) h = 12;

            setHour(h.toString());
            setMinute(m.toString().padStart(2, '0'));
            setAmpm(isPm ? "PM" : "AM");
        }
    }, [date]);

    // Update the parent date object whenever time internals change
    const updateTime = (newHour: string, newMinute: string, newAmpm: "AM" | "PM") => {
        if (!date) return;

        const newDate = new Date(date);
        let h = parseInt(newHour, 10);
        let m = parseInt(newMinute, 10);

        if (newAmpm === "PM" && h < 12) h += 12;
        if (newAmpm === "AM" && h === 12) h = 0;

        newDate.setHours(h);
        newDate.setMinutes(m);
        setDate(newDate);
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            return;
        }
        // Apply current internal time to the new date
        const newDate = new Date(selectedDate);
        let h = parseInt(hour, 10);
        let m = parseInt(minute, 10);

        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;

        newDate.setHours(h);
        newDate.setMinutes(m);
        setDate(newDate);
    };

    const updateHour = (val: string) => {
        setHour(val);
        updateTime(val, minute, ampm);
    }

    const updateMinute = (val: string) => {
        setMinute(val);
        updateTime(hour, val, ampm);
    }

    const updateAmpm = (val: "AM" | "PM") => {
        setAmpm(val);
        updateTime(hour, minute, val);
    }

    // Generate arrays
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="space-y-2 flex flex-col w-full">
            {label && <Label className="text-gray-300 font-medium">{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-black/20 border-white/10 text-white hover:bg-white/5 hover:text-white",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {date ? format(date, "PPP p") : <span>Pick a date and time</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#0A1116] border-white/10 text-white" align="start">

                    {/* Time Selection with Dropdowns */}
                    <div className="p-4 border-b border-white/10 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-teal-400" />
                            <span className="text-sm font-medium">Time</span>
                        </div>

                        <div className="flex gap-2">
                            {/* Hour Select */}
                            <div className="flex-1">
                                <Label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hour</Label>
                                <Select value={hour} onValueChange={updateHour}>
                                    <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-teal-500/50">
                                        <SelectValue placeholder="HH" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A1116] border-white/10 text-white max-h-48">
                                        {hours.map((h) => (
                                            <SelectItem key={h} value={h} className="focus:bg-teal-500/20 focus:text-white">{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end pb-2 text-gray-400">:</div>

                            {/* Minute Select */}
                            <div className="flex-1">
                                <Label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Min</Label>
                                <Select value={minute} onValueChange={updateMinute}>
                                    <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-teal-500/50">
                                        <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A1116] border-white/10 text-white max-h-48">
                                        {minutes.map((m) => (
                                            <SelectItem key={m} value={m} className="focus:bg-teal-500/20 focus:text-white">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* AM/PM Select */}
                            <div className="w-[80px]">
                                <Label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">AM/PM</Label>
                                <Select value={ampm} onValueChange={(val) => updateAmpm(val as "AM" | "PM")}>
                                    <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-teal-500/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A1116] border-white/10 text-white">
                                        <SelectItem value="AM" className="focus:bg-teal-500/20 focus:text-white">AM</SelectItem>
                                        <SelectItem value="PM" className="focus:bg-teal-500/20 focus:text-white">PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        disabled={(day) => day > new Date()}
                        className="p-3 pointer-events-auto bg-transparent text-white"
                        classNames={{
                            day_selected: "bg-teal-600 text-white hover:bg-teal-500 hover:text-white focus:bg-teal-500 focus:text-white",
                            day_today: "bg-white/10 text-white",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-white",
                            day_disabled: "text-white/30 opacity-40 pointer-events-none",
                            nav_button_previous: "absolute left-1 top-1",
                            nav_button_next: "absolute right-1 top-1",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
