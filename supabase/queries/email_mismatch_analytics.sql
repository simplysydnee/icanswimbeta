-- Email Mismatch Analytics Queries
-- Run these in Supabase SQL Editor
-- Part of: Email mismatch validation feature - Phase 4
-- Date: 2026-02-17

-- ========================================
-- BASIC STATS
-- ========================================

-- Total mismatches this week
SELECT COUNT(*) as total_mismatches
FROM email_mismatch_logs
WHERE created_at > now() - interval '7 days';

-- Mismatches by day (last 30 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as mismatches
FROM email_mismatch_logs
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ========================================
-- PATTERN ANALYSIS
-- ========================================

-- Most common email domains (invited email)
SELECT
  SUBSTRING(invited_email FROM '@(.*)$') as domain,
  COUNT(*) as count
FROM email_mismatch_logs
GROUP BY domain
ORDER BY count DESC
LIMIT 10;

-- Cross-domain mismatches (invited @gmail, attempted @yahoo)
SELECT
  SUBSTRING(invited_email FROM '@(.*)$') as invited_domain,
  SUBSTRING(attempted_email FROM '@(.*)$') as attempted_domain,
  COUNT(*) as count
FROM email_mismatch_logs
WHERE SUBSTRING(invited_email FROM '@(.*)$') != SUBSTRING(attempted_email FROM '@(.*)$')
GROUP BY invited_domain, attempted_domain
ORDER BY count DESC
LIMIT 20;

-- ========================================
-- RESOLUTION TRACKING
-- ========================================

-- How users resolved mismatches
SELECT
  COALESCE(resolution_action, 'not_resolved') as action,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_mismatch_logs
GROUP BY resolution_action
ORDER BY count DESC;

-- ========================================
-- SUPPORT INSIGHTS
-- ========================================

-- Swimmers with multiple mismatch attempts (potential issues)
SELECT
  s.id,
  s.first_name,
  s.last_name,
  COUNT(*) as mismatch_count,
  MAX(eml.created_at) as last_attempt
FROM email_mismatch_logs eml
JOIN swimmers s ON eml.swimmer_id = s.id
GROUP BY s.id, s.first_name, s.last_name
HAVING COUNT(*) > 1
ORDER BY mismatch_count DESC;

-- Recent unresolved mismatches (last 24 hours)
SELECT
  eml.created_at,
  eml.invited_email,
  eml.attempted_email,
  s.first_name || ' ' || s.last_name as swimmer_name,
  eml.resolution_action
FROM email_mismatch_logs eml
LEFT JOIN swimmers s ON eml.swimmer_id = s.id
WHERE eml.created_at > now() - interval '24 hours'
  AND eml.resolution_action IS NULL
ORDER BY eml.created_at DESC;