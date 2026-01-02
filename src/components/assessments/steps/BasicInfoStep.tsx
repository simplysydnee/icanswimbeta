'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, User, Users, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Swimmer {
  id: string;
  name: string;
  parentName: string;
  scheduledTime: string;
}

interface BasicInfoStepProps {
  data: {
    swimmerId: string;
    instructor: string;
    assessmentDate: Date;
    strengths: string;
    challenges: string;
  };
  onChange: (data: Partial<BasicInfoStepProps['data']>) => void;
}

const INSTRUCTORS = [
  { id: 'lauren', name: 'Lauren' },
  { id: 'sutton', name: 'Sutton' },
  { id: 'stephanie', name: 'Stephanie' },
  { id: 'alyah', name: 'Alyah' },
  { id: 'alexis', name: 'Alexis' },
  { id: 'jennifer', name: 'Jennifer' },
  { id: 'megan', name: 'Megan' },
  { id: 'jada', name: 'Jada' },
  { id: 'desiree', name: 'Desiree' },
  { id: 'karolina', name: 'Karolina' },
];

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledSwimmers();
  }, []);

  const fetchScheduledSwimmers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments/scheduled');
      if (response.ok) {
        const data = await response.json();
        setSwimmers(data);
      }
    } catch (error) {
      console.error('Error fetching scheduled swimmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwimmerChange = (swimmerId: string) => {
    onChange({ swimmerId });
  };

  const handleInstructorChange = (instructor: string) => {
    onChange({ instructor });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({ assessmentDate: date });
    }
  };

  const handleStrengthsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ strengths: e.target.value });
  };

  const handleChallengesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ challenges: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Basic Information</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Select the swimmer and provide basic assessment information
        </p>
      </div>

      {/* Swimmer Selection */}
      <div className="space-y-2">
        <Label htmlFor="swimmer" className="text-sm font-medium">
          Swimmer <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.swimmerId}
          onValueChange={handleSwimmerChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select swimmer with scheduled assessment" />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>
                Loading swimmers...
              </SelectItem>
            ) : swimmers.length === 0 ? (
              <SelectItem value="none" disabled>
                No scheduled assessments found
              </SelectItem>
            ) : (
              swimmers.map((swimmer) => (
                <SelectItem key={swimmer.id} value={swimmer.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{swimmer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Parent: {swimmer.parentName} • {swimmer.scheduledTime}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {swimmers.length === 0 && !loading && (
          <p className="text-sm text-amber-600">
            No swimmers have scheduled assessments today. Please schedule an assessment first.
          </p>
        )}
      </div>

      {/* Instructor Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Instructor <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.instructor}
          onValueChange={handleInstructorChange}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2"
        >
          {INSTRUCTORS.map((instructor) => (
            <div key={instructor.id} className="flex items-center space-x-2">
              <RadioGroupItem value={instructor.id} id={`instructor-${instructor.id}`} />
              <Label
                htmlFor={`instructor-${instructor.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {instructor.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Assessment Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Date of Assessment <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data.assessmentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.assessmentDate ? (
                format(data.assessmentDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.assessmentDate}
              onSelect={handleDateChange}
              initialFocus
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Strengths */}
      <div className="space-y-2">
        <Label htmlFor="strengths" className="text-sm font-medium">
          Swimmer's Strengths <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="strengths"
          placeholder="What are the swimmer's strengths? What do they do well?"
          value={data.strengths}
          onChange={handleStrengthsChange}
          className="min-h-[100px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Describe what the swimmer does well in the water
        </p>
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        <Label htmlFor="challenges" className="text-sm font-medium">
          Swimmer's Challenges or Concerns <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="challenges"
          placeholder="What challenges or concerns did you observe? What areas need improvement?"
          value={data.challenges}
          onChange={handleChallengesChange}
          className="min-h-[100px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Describe any challenges, concerns, or areas needing improvement
        </p>
      </div>
    </div>
  );
}