'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, Plus, Trash2 } from 'lucide-react';

export default function SessionGeneratorPage() {
  const [sessions, setSessions] = useState<Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    instructorId: string;
    maxCapacity: number;
  }>>([]);

  const addSession = () => {
    setSessions([
      ...sessions,
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '09:30',
        location: 'Turlock',
        instructorId: '',
        maxCapacity: 1,
      },
    ]);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: string, value: string | number) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  const generateSessions = () => {
    // TODO: Implement session generation logic
    alert(`Generating ${sessions.length} session templates...`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Session Generator</h1>
          <p className="text-muted-foreground">
            Create session templates for the upcoming month
          </p>
        </div>
        <Button onClick={generateSessions} disabled={sessions.length === 0}>
          Generate Sessions
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Templates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No session templates added yet</p>
                  <p className="text-sm mt-2">Add your first template to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="font-medium">Template #{index + 1}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSession(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`day-${index}`}>Day</Label>
                            <select
                              id={`day-${index}`}
                              value={session.dayOfWeek}
                              onChange={(e) => updateSession(index, 'dayOfWeek', e.target.value)}
                              className="border rounded-md px-3 py-2 w-full mt-1"
                            >
                              <option value="Monday">Monday</option>
                              <option value="Tuesday">Tuesday</option>
                              <option value="Wednesday">Wednesday</option>
                              <option value="Thursday">Thursday</option>
                              <option value="Friday">Friday</option>
                              <option value="Saturday">Saturday</option>
                              <option value="Sunday">Sunday</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`start-${index}`}>Start Time</Label>
                            <Input
                              id={`start-${index}`}
                              type="time"
                              value={session.startTime}
                              onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`end-${index}`}>End Time</Label>
                            <Input
                              id={`end-${index}`}
                              type="time"
                              value={session.endTime}
                              onChange={(e) => updateSession(index, 'endTime', e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`location-${index}`}>Location</Label>
                            <select
                              id={`location-${index}`}
                              value={session.location}
                              onChange={(e) => updateSession(index, 'location', e.target.value)}
                              className="border rounded-md px-3 py-2 w-full mt-1"
                            >
                              <option value="Turlock">Turlock</option>
                              <option value="Modesto">Modesto</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`capacity-${index}`}>Max Capacity</Label>
                            <Input
                              id={`capacity-${index}`}
                              type="number"
                              min="1"
                              max="4"
                              value={session.maxCapacity}
                              onChange={(e) => updateSession(index, 'maxCapacity', parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`instructor-${index}`}>Instructor</Label>
                            <select
                              id={`instructor-${index}`}
                              value={session.instructorId}
                              onChange={(e) => updateSession(index, 'instructorId', e.target.value)}
                              className="border rounded-md px-3 py-2 w-full mt-1"
                            >
                              <option value="">Select instructor</option>
                              <option value="instructor-1">Instructor 1</option>
                              <option value="instructor-2">Instructor 2</option>
                              <option value="instructor-3">Instructor 3</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={addSession}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Session Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions & Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>1. Add session templates for each time slot you want to create</p>
              <p>2. Set day, time, location, and capacity for each template</p>
              <p>3. Click "Generate Sessions" to create sessions for the next month</p>
              <p>4. Sessions will be created as drafts and can be reviewed before opening</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Add templates to see preview</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Templates:</span>
                    <span className="font-medium">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sessions to generate:</span>
                    <span className="font-medium">{sessions.length * 4}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    * 4 weeks per month × {sessions.length} templates
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}