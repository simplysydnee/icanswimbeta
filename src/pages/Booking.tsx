import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logoHeader from "@/assets/logo-header.png";

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedType, setSelectedType] = useState<string>("all");

  // Mock session data - this would come from Supabase
  const sessions = [
    {
      id: "1",
      type: "private",
      startTime: "09:00 AM",
      endTime: "09:45 AM",
      instructor: "Sutton Lucas",
      price: 65,
      available: 1,
      location: "Main Pool"
    },
    {
      id: "2",
      type: "private",
      startTime: "10:00 AM",
      endTime: "10:45 AM",
      instructor: "Sutton Lucas",
      price: 65,
      available: 1,
      location: "Main Pool"
    },
    {
      id: "3",
      type: "semi-private",
      startTime: "11:00 AM",
      endTime: "11:45 AM",
      instructor: "Sutton Lucas",
      price: 45,
      available: 2,
      location: "Main Pool"
    },
    {
      id: "4",
      type: "group",
      startTime: "02:00 PM",
      endTime: "02:45 PM",
      instructor: "Sutton Lucas",
      price: 35,
      available: 4,
      location: "Main Pool"
    },
  ];

  const filteredSessions = sessions.filter(session => 
    selectedType === "all" || session.type === selectedType
  );

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "private":
        return "bg-primary";
      case "semi-private":
        return "bg-accent";
      case "group":
        return "bg-secondary";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 border-b">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-12 w-auto object-contain"
          />
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book a Swim Session</h1>
          <p className="text-muted-foreground">Choose your preferred date, time, and session type</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar and Filters */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="private">Private (1:1)</SelectItem>
                    <SelectItem value="semi-private">Semi-Private (1:2)</SelectItem>
                    <SelectItem value="group">Group (Up to 4)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">Private - $65/session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span className="text-sm">Semi-Private - $45/session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-secondary" />
                    <span className="text-sm">Group - $35/session</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Available Sessions
                  {selectedDate && (
                    <span className="text-muted-foreground font-normal ml-2">
                      - {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={getSessionTypeColor(session.type)}>
                                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                              </Badge>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {session.startTime} - {session.endTime}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{session.instructor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">${session.price}</span>
                              </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {session.available} spot{session.available !== 1 ? 's' : ''} available
                            </div>
                          </div>

                          <Button size="lg">
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredSessions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-lg mb-2">No sessions available for the selected filters</p>
                      <p className="text-sm">Try selecting a different date or session type</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
