'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, User, Users, ClipboardList, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ScheduledSwimmer {
  id: string;
  name: string;
  parentName: string;
  scheduledTime: string;
  location: string;
  startTime: string;
  endTime: string;
}

interface SearchSwimmer {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  enrollment_status: string;
  payment_type: string;
  parent?: {
    email?: string;
    full_name?: string;
  };
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
  const supabase = createClient();
  const [scheduledSwimmers, setScheduledSwimmers] = useState<ScheduledSwimmer[]>([]);
  const [searchSwimmers, setSearchSwimmers] = useState<SearchSwimmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSwimmer, setSelectedSwimmer] = useState<SearchSwimmer | null>(null);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchScheduledSwimmers();
  }, []);

  const fetchScheduledSwimmers = async () => {
    try {
      setLoadingScheduled(true);
      const response = await fetch('/api/assessments/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledSwimmers(data);
      }
    } catch (error) {
      console.error('Error fetching scheduled swimmers:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const performSwimmerSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchSwimmers([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          parent_id,
          enrollment_status,
          payment_type,
          parent:profiles!parent_id(email, full_name)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .in('enrollment_status', ['enrolled', 'approved', 'pending', 'waitlist'])
        .limit(10);

      if (error) {
        console.error('Search error:', error);
      } else {
        setSearchSwimmers(data || []);
      }
    } catch (error) {
      console.error('Error searching swimmers:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSelectedSwimmer(null);
    performSwimmerSearch(value);
  };

  const handleSelectSwimmer = (swimmer: SearchSwimmer) => {
    setSelectedSwimmer(swimmer);
    setSearchSwimmers([]);
    setSearchQuery(`${swimmer.first_name} ${swimmer.last_name}`);
    onChange({ swimmerId: swimmer.id });
  };

  const handleSwimmerChange = (swimmerId: string) => {
    onChange({ swimmerId });
    // If selecting from scheduled swimmers, clear search selection
    setSelectedSwimmer(null);
    setSearchQuery('');
    setSearchSwimmers([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'waitlist': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'private_pay': return 'Private Pay';
      case 'vmrc': return 'Funded';
      case 'scholarship': return 'Scholarship';
      case 'funded': return 'Funded';
      default: return type;
    }
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="swimmer" className="text-sm font-medium">
            Swimmer <span className="text-red-500">*</span>
          </Label>

          {/* Toggle between scheduled and search */}
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={!showSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSearch(false)}
              className="flex-1"
            >
              Scheduled Assessments
            </Button>
            <Button
              type="button"
              variant={showSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSearch(true)}
              className="flex-1"
            >
              Search All Swimmers
            </Button>
          </div>

          {!showSearch ? (
            /* Scheduled Swimmers Dropdown */
            <Select
              value={data.swimmerId}
              onValueChange={handleSwimmerChange}
              disabled={loadingScheduled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select swimmer with scheduled assessment" />
              </SelectTrigger>
              <SelectContent>
                {loadingScheduled ? (
                  <SelectItem value="loading" disabled>
                    Loading scheduled swimmers...
                  </SelectItem>
                ) : scheduledSwimmers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No scheduled assessments found
                  </SelectItem>
                ) : (
                  scheduledSwimmers.map((swimmer) => (
                    <SelectItem key={swimmer.id} value={swimmer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{swimmer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Parent: {swimmer.parentName} • {swimmer.scheduledTime} • {swimmer.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            /* Swimmer Search */
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search swimmer by name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Search Results */}
              {searchSwimmers.length > 0 && !selectedSwimmer && (
                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                  {searchSwimmers.map((swimmer) => (
                    <button
                      key={swimmer.id}
                      onClick={() => handleSelectSwimmer(swimmer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{swimmer.first_name} {swimmer.last_name}</p>
                          <p className="text-sm text-gray-500">{swimmer.parent?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getStatusColor(swimmer.enrollment_status)}>
                          {swimmer.enrollment_status}
                        </Badge>
                        <Badge variant="secondary">
                          {getPaymentTypeLabel(swimmer.payment_type)}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Swimmer Preview */}
              {selectedSwimmer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedSwimmer.first_name} {selectedSwimmer.last_name}</p>
                        <p className="text-sm text-gray-600">{selectedSwimmer.parent?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSwimmer(null);
                        setSearchQuery('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className={getStatusColor(selectedSwimmer.enrollment_status)}>
                      {selectedSwimmer.enrollment_status}
                    </Badge>
                    <Badge variant="secondary">
                      {getPaymentTypeLabel(selectedSwimmer.payment_type)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery.length >= 2 && searchSwimmers.length === 0 && !searching && !selectedSwimmer && (
                <p className="text-center text-gray-500 py-4">
                  No swimmers found matching "{searchQuery}"
                </p>
              )}
            </div>
          )}
        </div>

        {!showSearch && scheduledSwimmers.length === 0 && !loadingScheduled && (
          <p className="text-sm text-amber-600">
            No swimmers have scheduled assessments today. Use "Search All Swimmers" to find and assess any swimmer.
          </p>
        )}
      </div>

      {/* Instructor Selection */}
      <div className="space-y-2">
        <Label htmlFor="instructor" className="text-sm font-medium">
          Instructor <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.instructor}
          onValueChange={handleInstructorChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select instructor" />
          </SelectTrigger>
          <SelectContent>
            {INSTRUCTORS.map((instructor) => (
              <SelectItem key={instructor.id} value={instructor.id}>
                {instructor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the instructor who conducted the assessment
        </p>
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