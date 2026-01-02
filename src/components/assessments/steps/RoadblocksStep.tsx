'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Roadblock {
  needsAddressing: boolean;
  intervention: string;
}

interface RoadblocksStepProps {
  data: Record<string, Roadblock>;
  onChange: (roadblocks: Record<string, Roadblock>) => void;
}

const ROADBLOCKS = [
  { id: 'safety', label: 'Safety' },
  { id: 'water_properties', label: 'Water properties' },
  { id: 'interpreting_touch', label: 'Interpreting touch' },
  { id: 'managing_submerging', label: 'Managing submerging' },
  { id: 'ways_of_processing', label: 'Ways of processing' },
  { id: 'excessive_drinking', label: 'Excessive drinking' },
  { id: 'body_breath_control', label: 'Body and breath control' },
  { id: 'inability_go_on_back', label: 'Inability to go on back' },
  { id: 'seeking_sensory_input', label: 'Seeking sensory input' },
  { id: 'struggles_follow_plan', label: 'Struggles to follow plan' },
  { id: 'engagement_interaction', label: 'Engagement and interaction difficulties' },
  { id: 'reactive', label: 'Reactive (over/under)' },
  { id: 'rigidity', label: 'Rigidity' },
  { id: 'stroke_performance', label: 'Stroke performance' },
];

export function RoadblocksStep({ data, onChange }: RoadblocksStepProps) {
  const handleRoadblockChange = (roadblockId: string, field: keyof Roadblock, value: any) => {
    const currentRoadblock = data[roadblockId] || { needsAddressing: false, intervention: '' };

    if (field === 'needsAddressing') {
      // If changing from true to false, clear intervention text
      const newValue = value === 'true';
      onChange({
        ...data,
        [roadblockId]: {
          needsAddressing: newValue,
          intervention: newValue ? currentRoadblock.intervention : '',
        },
      });
    } else {
      onChange({
        ...data,
        [roadblockId]: {
          ...currentRoadblock,
          [field]: value,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <Label className="text-lg font-semibold">Roadblocks Assessment</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Identify roadblocks and provide intervention strategies for each area
        </p>
      </div>

      {/* Roadblocks Grid */}
      <div className="space-y-6">
        {ROADBLOCKS.map((roadblock) => {
          const currentData = data[roadblock.id] || { needsAddressing: false, intervention: '' };
          const needsAddressing = currentData.needsAddressing;

          return (
            <div key={roadblock.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="md:w-1/3">
                  <Label className="font-medium text-sm md:text-base">
                    {roadblock.label}
                  </Label>
                </div>
                <div className="md:w-2/3">
                  <RadioGroup
                    value={needsAddressing ? 'true' : 'false'}
                    onValueChange={(value) =>
                      handleRoadblockChange(roadblock.id, 'needsAddressing', value)
                    }
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`${roadblock.id}-needs`} />
                      <Label
                        htmlFor={`${roadblock.id}-needs`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Needs to be addressed</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`${roadblock.id}-not`} />
                      <Label
                        htmlFor={`${roadblock.id}-not`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Not a current area of focus</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Intervention Textarea (only shown if "Needs to be addressed") */}
              {needsAddressing && (
                <div className="space-y-2">
                  <Label htmlFor={`${roadblock.id}-intervention`} className="text-sm font-medium">
                    Intervention/Teaching Strategy
                  </Label>
                  <Textarea
                    id={`${roadblock.id}-intervention`}
                    placeholder={`Describe intervention strategies for ${roadblock.label.toLowerCase()}...`}
                    value={currentData.intervention}
                    onChange={(e) =>
                      handleRoadblockChange(roadblock.id, 'intervention', e.target.value)
                    }
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    What teaching strategies or interventions would help with this roadblock?
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">
                {Object.values(data).filter(r => r.needsAddressing).length}
              </div>
              <div className="text-sm text-muted-foreground">Roadblocks to address</div>
            </div>
          </div>
          <div className="mt-2 text-sm">
            These areas need intervention strategies
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">
                {ROADBLOCKS.length - Object.values(data).filter(r => r.needsAddressing).length}
              </div>
              <div className="text-sm text-muted-foreground">Not current focus</div>
            </div>
          </div>
          <div className="mt-2 text-sm">
            These areas are not currently problematic
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Tips for Identifying Roadblocks</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• <strong>Safety:</strong> Does the swimmer understand pool rules and boundaries?</li>
          <li>• <strong>Water properties:</strong> How does the swimmer react to water temperature, buoyancy, resistance?</li>
          <li>• <strong>Interpreting touch:</strong> How does the swimmer respond to physical guidance?</li>
          <li>• <strong>Managing submerging:</strong> Can the swimmer handle water on face/head?</li>
          <li>• <strong>Ways of processing:</strong> How does the swimmer process verbal/visual instructions?</li>
          <li>• <strong>Excessive drinking:</strong> Does the swimmer drink pool water excessively?</li>
          <li>• <strong>Body and breath control:</strong> Can the swimmer control breathing and body position?</li>
        </ul>
      </div>
    </div>
  );
}