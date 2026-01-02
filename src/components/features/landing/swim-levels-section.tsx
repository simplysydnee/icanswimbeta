import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves } from 'lucide-react';

export function SwimLevelsSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
          <Waves className="inline-block h-8 w-8 mr-2 text-primary" />
          Our Swim Levels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "White", description: "Water Readiness - Asking permission to get in the water", bgColor: "bg-slate-100" },
            { name: "Red", description: "Body Position and Air Exchange - Wearing lifejacket and jump in", bgColor: "bg-red-100" },
            { name: "Yellow", description: "Forward Movement and Direction Change - Tread water for 10 seconds", bgColor: "bg-yellow-100" },
            { name: "Green", description: "Water Competency - Disorientating entries and recover", bgColor: "bg-green-100" },
            { name: "Blue", description: "Streamlines and Side Breathing - Reach and throw with assist flotation", bgColor: "bg-blue-100" },
          ].map((level) => (
            <Card key={level.name} className={level.bgColor}>
              <CardHeader>
                <CardTitle>{level.name}</CardTitle>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}