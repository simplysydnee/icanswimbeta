'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

// export function FundamentalInformationSection() {
//   const { control, watch } = useFormContext<EnrollmentFormData>();
//   const otherTherapies = watch('other_therapies');

//   return (
//     <div className="space-y-8">
//       {/* Communication Type */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2">
//           <Label className="text-base font-medium">Communication type *</Label>
//           <HelpTooltip content="How does the child primarily communicate?" />
//         </div>

//         <FormField
//           control={control}
//           name="communication_type"
//           render={({ field }) => (
//             <FormItem>
//               <FormControl>
//                 <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-4">
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="verbal" id="comm-verbal" />
//                     <Label htmlFor="comm-verbal">Verbal</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="non_verbal" id="comm-nonverbal" />
//                     <Label htmlFor="comm-nonverbal">Non-verbal</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="other" id="comm-other" />
//                     <Label htmlFor="comm-other">Other</Label>
//                   </div>
//                 </RadioGroup>
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       {/* Strengths & Interests */}
//       <div className="space-y-4">
//         <FormField
//           control={control}
//           name="strengths_interests"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Strengths & interests</FormLabel>
//               <FormControl>
//                 <Textarea {...field} placeholder="Describe child's strengths and interests" rows={4} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       {/* Motivators */}
//       <div className="space-y-4">
//         <FormField
//           control={control}
//           name="motivators"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Motivators</FormLabel>
//               <FormControl>
//                 <Textarea {...field} placeholder="What motivates the child (toys, snacks, praise)?" rows={3} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       {/* Other Therapies */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2">
//           <Label className="text-base font-medium">Receiving other therapies? *</Label>
//           <HelpTooltip content="Is the child currently receiving therapy outside of swim lessons?" />
//         </div>

//         <FormField
//           control={control}
//           name="other_therapies"
//           render={({ field }) => (
//             <FormItem>
//               <FormControl>
//                 <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-4">
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="yes" id="other-therapies-yes" />
//                     <Label htmlFor="other-therapies-yes">Yes</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="no" id="other-therapies-no" />
//                     <Label htmlFor="other-therapies-no">No</Label>
//                   </div>
//                 </RadioGroup>
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {otherTherapies === 'yes' && (
//           <FormField
//             control={control}
//             name="therapies_description"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Please describe therapies</FormLabel>
//                 <FormControl>
//                   <Textarea {...field} placeholder="Type of therapy, frequency, contact (if applicable)" rows={3} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

export function FundamentalInformationSection() {
  const { control, watch } = useFormContext<EnrollmentFormData>();
  const otherTherapies = watch('other_therapies');

  return (
    <div className="space-y-8">
      {/* Communication Type */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Communication type *</Label>
          <HelpTooltip content="How does the child primarily communicate?" />
        </div>

        <FormField
          control={control}
          name="communication_type"
          rules={{ required: 'Please select a communication type' }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="verbal" id="comm-verbal" />
                    <Label htmlFor="comm-verbal">Verbal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non_verbal" id="comm-nonverbal" />
                    <Label htmlFor="comm-nonverbal">Non-verbal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="comm-other" />
                    <Label htmlFor="comm-other">Other</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Strengths & Interests */}
      <div className="space-y-4">
        <FormField
          control={control}
          name="strengths_interests"
          rules={{ required: 'Please describe strengths & interests' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strengths & interests</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Describe child's strengths and interests" rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Motivators */}
      <div className="space-y-4">
        <FormField
          control={control}
          name="motivators"
          rules={{ required: 'Please provide motivators' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivators</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="What motivates the child (toys, snacks, praise)?" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Other Therapies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Receiving other therapies? *</Label>
          <HelpTooltip content="Is the child currently receiving therapy outside of swim lessons?" />
        </div>

        <FormField
          control={control}
          name="other_therapies"
          rules={{ required: 'Please select yes or no' }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="other-therapies-yes" />
                    <Label htmlFor="other-therapies-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="other-therapies-no" />
                    <Label htmlFor="other-therapies-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {otherTherapies === 'yes' && (
          <FormField
            control={control}
            name="therapies_description"
            rules={{
              validate: (v) =>
                otherTherapies !== 'yes' || (v && v.toString().trim().length > 0) || 'Please describe other therapies',
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe therapies</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Type of therapy, frequency, contact (if applicable)" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}