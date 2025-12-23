-- Migration: 20241222_assessment_functions.sql
-- Description: Creates PostgreSQL functions for assessment transactions

-- Function to submit assessment transaction
CREATE OR REPLACE FUNCTION submit_assessment_transaction(
  p_swimmer_id UUID,
  p_instructor_id UUID,
  p_assessment_date DATE,
  p_strengths TEXT,
  p_challenges TEXT,
  p_swim_skills JSONB,
  p_roadblocks JSONB,
  p_swim_skills_goals TEXT,
  p_safety_goals TEXT,
  p_approval_status TEXT,
  p_created_by UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert assessment report
  INSERT INTO assessment_reports (
    swimmer_id,
    instructor_id,
    assessment_date,
    strengths,
    challenges,
    swim_skills,
    roadblocks,
    swim_skills_goals,
    safety_goals,
    approval_status,
    created_by
  ) VALUES (
    p_swimmer_id,
    p_instructor_id,
    p_assessment_date,
    p_strengths,
    p_challenges,
    p_swim_skills,
    p_roadblocks,
    p_swim_skills_goals,
    p_safety_goals,
    p_approval_status,
    p_created_by
  );

  -- Update or create assessment record
  INSERT INTO assessments (
    swimmer_id,
    instructor_id,
    assessment_date,
    status,
    completed_at,
    completed_by
  ) VALUES (
    p_swimmer_id,
    p_instructor_id,
    p_assessment_date,
    'completed',
    NOW(),
    p_created_by
  )
  ON CONFLICT (swimmer_id, assessment_date)
  DO UPDATE SET
    status = 'completed',
    completed_at = NOW(),
    completed_by = p_created_by,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Function to complete assessment (legacy - kept for compatibility)
CREATE OR REPLACE FUNCTION complete_assessment_transaction(
  p_booking_id UUID,
  p_session_id UUID,
  p_swimmer_id UUID,
  p_recommended_level_id UUID,
  p_water_comfort TEXT,
  p_skills_observed TEXT[],
  p_instructor_notes TEXT,
  p_ready_for_lessons BOOLEAN,
  p_completed_by UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update booking status
  UPDATE bookings
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Update session status
  UPDATE sessions
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update swimmer level if provided
  IF p_recommended_level_id IS NOT NULL THEN
    UPDATE swimmers
    SET
      current_level_id = p_recommended_level_id,
      updated_at = NOW()
    WHERE id = p_swimmer_id;
  END IF;

  -- Update swimmer assessment status
  UPDATE swimmers
  SET
    assessment_status = 'completed',
    comfortable_in_water = COALESCE(p_water_comfort, comfortable_in_water),
    updated_at = NOW()
  WHERE id = p_swimmer_id;

  -- Create progress note for assessment
  INSERT INTO progress_notes (
    session_id,
    booking_id,
    swimmer_id,
    instructor_id,
    lesson_summary,
    skills_working_on,
    skills_mastered,
    shared_with_parent
  ) VALUES (
    p_session_id,
    p_booking_id,
    p_swimmer_id,
    p_completed_by,
    p_instructor_notes,
    ARRAY[]::TEXT[], -- Empty array for skills_working_on
    p_skills_observed,
    TRUE -- Always share assessment notes with parent
  );

END;
$$ LANGUAGE plpgsql;

-- Function to get swimmers with scheduled assessments for today
CREATE OR REPLACE FUNCTION get_todays_scheduled_assessments(p_instructor_id UUID DEFAULT NULL)
RETURNS TABLE (
  swimmer_id UUID,
  swimmer_name TEXT,
  parent_name TEXT,
  scheduled_time TEXT,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as swimmer_id,
    CONCAT(s.first_name, ' ', s.last_name) as swimmer_name,
    p.full_name as parent_name,
    TO_CHAR(sess.start_time, 'HH12:MI AM') as scheduled_time,
    sess.location,
    sess.start_time,
    sess.end_time
  FROM bookings b
  JOIN sessions sess ON b.session_id = sess.id
  JOIN swimmers s ON b.swimmer_id = s.id
  JOIN profiles p ON s.parent_id = p.id
  WHERE sess.session_type = 'assessment'
    AND b.status = 'confirmed'
    AND DATE(sess.start_time) = CURRENT_DATE
    AND (p_instructor_id IS NULL OR sess.instructor_id = p_instructor_id)
    AND s.assessment_status IN ('scheduled', 'not_scheduled')
  ORDER BY sess.start_time;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_assessment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_assessment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_todays_scheduled_assessments TO authenticated;