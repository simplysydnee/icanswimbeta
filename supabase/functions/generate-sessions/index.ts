import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateSessionsRequest {
  mode: "next_month" | "custom_range";
  startDate?: string;
  endDate?: string;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  sessionDuration: number; // minutes
  instructorIds: string[];
  breaks: Array<{ startTime: string; endTime: string; label?: string }>;
  sessionType: string;
  location: string;
  priceCents?: number;
  notesTags?: string;
  blackoutDates: string[]; // YYYY-MM-DD
  additionalDates?: string[]; // For single sessions
  allowedSwimLevels?: string[]; // UUIDs of allowed swim levels
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const config: GenerateSessionsRequest = await req.json();
    console.log("Generating sessions with config:", config);

    // Determine date range
    let startDate: Date, endDate: Date;
    if (config.mode === "next_month") {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      startDate = nextMonth;
      endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
    } else {
      startDate = new Date(config.startDate!);
      endDate = new Date(config.endDate!);
    }

    // Generate time slots
    const slots = generateTimeSlots(config.startTime, config.endTime, config.sessionDuration, config.breaks);
    console.log(`Generated ${slots.length} time slots`);

    // Get blackout dates set
    const blackoutSet = new Set(config.blackoutDates);

    // Get existing sessions for conflict detection
    const { data: existingSessions } = await supabaseClient
      .from("sessions")
      .select("instructor_id, start_time, end_time")
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .neq("status", "cancelled");

    const batchId = crypto.randomUUID();
    const sessionsToCreate: any[] = [];
    const conflicts: any[] = [];

    // Generate dates based on session type
    let targetDates: Date[] = [];
    
    if (config.sessionType === "weekly_recurring_month" || !config.additionalDates) {
      // Generate all dates in range that match days of week
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (config.daysOfWeek.includes(dayOfWeek) && !blackoutSet.has(d.toISOString().split("T")[0])) {
          targetDates.push(new Date(d));
        }
      }
    } else if (config.additionalDates && config.additionalDates.length > 0) {
      // Use only specific dates
      targetDates = config.additionalDates
        .map(d => new Date(d))
        .filter(d => !blackoutSet.has(d.toISOString().split("T")[0]));
    }

    console.log(`Target dates: ${targetDates.length}`);

    // For each date, instructor, and slot, create a session
    for (const date of targetDates) {
      for (const instructorId of config.instructorIds) {
        for (const slot of slots) {
          const [startHour, startMin] = slot.start.split(":").map(Number);
          const [endHour, endMin] = slot.end.split(":").map(Number);

          const startTime = new Date(date);
          startTime.setHours(startHour, startMin, 0, 0);

          const endTime = new Date(date);
          endTime.setHours(endHour, endMin, 0, 0);

          // Check for conflicts
          const hasConflict = existingSessions?.some((existing: any) => {
            if (existing.instructor_id !== instructorId) return false;
            const existingStart = new Date(existing.start_time);
            const existingEnd = new Date(existing.end_time);
            return startTime < existingEnd && endTime > existingStart;
          });

          if (hasConflict) {
            conflicts.push({
              date: date.toISOString().split("T")[0],
              time: `${slot.start}-${slot.end}`,
              instructor: instructorId,
              reason: "Instructor conflict",
            });
            continue;
          }

          sessionsToCreate.push({
            session_type: config.sessionType === "weekly_recurring_month" ? "lesson" : config.sessionType,
            session_type_detail: config.sessionType,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            instructor_id: instructorId,
            location: config.location,
            max_capacity: 1,
            price_cents: config.priceCents || 0,
            status: "draft",
            batch_id: batchId,
            notes_tags: config.notesTags,
            weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
            is_recurring: config.sessionType === "weekly_recurring_month",
            month_year: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            allowed_swim_levels: config.allowedSwimLevels && config.allowedSwimLevels.length > 0 
              ? config.allowedSwimLevels 
              : null,
          });
        }
      }
    }

    console.log(`Creating ${sessionsToCreate.length} sessions, ${conflicts.length} conflicts`);

    // Bulk insert sessions
    if (sessionsToCreate.length > 0) {
      const { error } = await supabaseClient.from("sessions").insert(sessionsToCreate);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: sessionsToCreate.length,
        skipped: conflicts.length,
        batchId,
        conflicts,
        preview: sessionsToCreate.slice(0, 50), // First 50 for preview
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating sessions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  breaks: Array<{ startTime: string; endTime: string }>
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + duration <= endMinutes) {
    const slotStartTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`;
    const slotEndMinutes = currentMinutes + duration;
    const slotEndTime = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`;

    // Check if slot overlaps with any break
    const overlapsBreak = breaks.some((brk) => {
      const [brkStartH, brkStartM] = brk.startTime.split(":").map(Number);
      const [brkEndH, brkEndM] = brk.endTime.split(":").map(Number);
      const brkStart = brkStartH * 60 + brkStartM;
      const brkEnd = brkEndH * 60 + brkEndM;
      
      return currentMinutes < brkEnd && slotEndMinutes > brkStart;
    });

    if (!overlapsBreak) {
      slots.push({ start: slotStartTime, end: slotEndTime });
    }

    currentMinutes += duration;
  }

  return slots;
}

serve(handler);
