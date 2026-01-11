import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface for overdue invite data
interface OverdueInvite {
  swimmer_id: string
  swimmer_name: string
  parent_first_name?: string
  parent_last_name?: string
  parent_email?: string
  parent_phone?: string
  coordinator_name?: string
  coordinator_email?: string
  invited_at: string
  days_since_invite: number
}

// Interface for task creation
interface TaskData {
  title: string
  description: string
  status: string
  priority: string
  category: string
  due_date: string
  assigned_to: string
  swimmer_id: string
  created_by: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting overdue parent invites check...')

    // Step 1: Get Taylor's user ID (info@icanswim209.com)
    const { data: taylorUser, error: taylorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'info@icanswim209.com')
      .single()

    if (taylorError || !taylorUser) {
      console.error('Could not find Taylor user (info@icanswim209.com):', taylorError)
      throw new Error('Taylor user not found. Please ensure info@icanswim209.com exists in profiles.')
    }

    const taylorUserId = taylorUser.id
    console.log(`Found Taylor user ID: ${taylorUserId}`)

    // Step 2: Query swimmers with overdue invites
    // Criteria:
    // - parent_id IS NULL (not linked to parent)
    // - invited_at IS NOT NULL (was invited)
    // - invited_at < NOW() - INTERVAL '7 days' (7+ days ago)
    // - follow_up_task_created = false (no task created yet)
    const { data: overdueSwimmers, error: queryError } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        parent_first_name,
        parent_last_name,
        parent_email,
        parent_phone,
        vmrc_coordinator_name,
        vmrc_coordinator_email,
        invited_at,
        follow_up_task_created
      `)
      .is('parent_id', null)
      .not('invited_at', 'is', null)
      .lt('invited_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('follow_up_task_created', false)
      .order('invited_at', { ascending: true })

    if (queryError) {
      console.error('Error querying overdue swimmers:', queryError)
      throw new Error(`Failed to query overdue swimmers: ${queryError.message}`)
    }

    console.log(`Found ${overdueSwimmers?.length || 0} swimmers with overdue invites`)

    // Step 3: Process each overdue swimmer
    const results = {
      total_overdue: overdueSwimmers?.length || 0,
      tasks_created: 0,
      swimmers_updated: 0,
      errors: [] as string[],
      details: [] as Array<{
        swimmer_id: string
        swimmer_name: string
        task_created: boolean
        error?: string
      }>
    }

    if (overdueSwimmers && overdueSwimmers.length > 0) {
      for (const swimmer of overdueSwimmers) {
        try {
          const swimmerName = `${swimmer.first_name} ${swimmer.last_name}`
          const parentName = swimmer.parent_first_name || swimmer.parent_last_name
            ? `${swimmer.parent_first_name || ''} ${swimmer.parent_last_name || ''}`.trim()
            : 'Parent'

          const invitedAt = new Date(swimmer.invited_at)
          const daysSinceInvite = Math.floor((Date.now() - invitedAt.getTime()) / (1000 * 60 * 60 * 24))

          console.log(`Processing swimmer: ${swimmerName}, invited ${daysSinceInvite} days ago`)

          // Create task description
          const taskDescription = `
**Swimmer:** ${swimmerName}
**Parent:** ${parentName || 'Not specified'}
**Parent Phone:** ${swimmer.parent_phone || 'Not provided'}
**Parent Email:** ${swimmer.parent_email || 'Not provided'}
**Coordinator:** ${swimmer.vmrc_coordinator_name || 'Not specified'}
**Coordinator Email:** ${swimmer.vmrc_coordinator_email || 'Not specified'}
**Days Since Invite Sent:** ${daysSinceInvite} days
**Invited On:** ${invitedAt.toLocaleDateString()}

**Action Required:** Follow up with parent to complete enrollment.
`

          // Create task data
          const taskData: TaskData = {
            title: `Follow up: ${swimmerName} - Parent enrollment overdue (${daysSinceInvite} days)`,
            description: taskDescription,
            status: 'todo',
            priority: daysSinceInvite > 14 ? 'high' : 'medium',
            category: 'follow_up',
            due_date: new Date().toISOString().split('T')[0], // Today
            assigned_to: taylorUserId,
            swimmer_id: swimmer.id,
            created_by: taylorUserId
          }

          // Insert task
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single()

          if (taskError) {
            throw new Error(`Failed to create task: ${taskError.message}`)
          }

          console.log(`Created task: ${taskData.title}`)

          // Update swimmer to mark follow-up task created
          const { error: updateError } = await supabase
            .from('swimmers')
            .update({ follow_up_task_created: true })
            .eq('id', swimmer.id)

          if (updateError) {
            throw new Error(`Failed to update swimmer: ${updateError.message}`)
          }

          console.log(`Updated swimmer ${swimmerName} to mark follow-up task created`)

          results.tasks_created++
          results.swimmers_updated++
          results.details.push({
            swimmer_id: swimmer.id,
            swimmer_name: swimmerName,
            task_created: true
          })

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error processing swimmer ${swimmer.id}:`, errorMsg)
          results.errors.push(`Swimmer ${swimmer.id}: ${errorMsg}`)
          results.details.push({
            swimmer_id: swimmer.id,
            swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
            task_created: false,
            error: errorMsg
          })
        }
      }
    }

    // Step 4: Return results
    const response = {
      success: true,
      message: `Processed ${results.total_overdue} overdue invites. Created ${results.tasks_created} tasks.`,
      timestamp: new Date().toISOString(),
      ...results
    }

    console.log('Overdue invites check completed:', response.message)

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in overdue invites check:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})