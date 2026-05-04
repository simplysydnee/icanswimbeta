import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface AssessmentReport {
  id: string;
  swimmer_id: string;
  instructor_id: string;
  assessment_date: string;
  strengths: string;
  challenges: string;
  swim_skills: Record<string, string>;
  roadblocks: Record<string, { status: string; strategy: string | null }>;
  swim_skills_goals: string;
  safety_goals: string;
  approval_status: string;
  ready_for_lessons: boolean;
  created_at: string;
}

function parseRow(rowStr: string): AssessmentReport | null {
  // Split columns respecting quoted strings
  const cols: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < rowStr.length; i++) {
    const ch = rowStr[i];
    const next = rowStr[i + 1] || '';

    if (ch === "'" && !inString) {
      inString = true;
      current += ch;
    } else if (ch === "'" && inString) {
      if (next === "'") {
        current += "''";
        i++;
      } else {
        inString = false;
        current += ch;
      }
    } else if (ch === ',' && !inString) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) cols.push(current.trim());

  if (cols.length < 13) return null;

  const unquote = (s: string) => {
    s = s.trim();
    if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
    return s.replace(/''/g, "'");
  };

  const cleanJson = (s: string) => {
    s = s.trim();
    s = s.replace(/::jsonb$/, '');
    s = s.replace(/^'(.*)'$/s, '$1');
    return s.replace(/''/g, "'");
  };

  let swimSkills: Record<string, string> = {};
  let roadblocks: Record<string, { status: string; strategy: string | null }> = {};
  try { swimSkills = JSON.parse(cleanJson(cols[6])); } catch { swimSkills = { _parseError: cleanJson(cols[6]).slice(0, 200) }; }
  try { roadblocks = JSON.parse(cleanJson(cols[7])); } catch { roadblocks = { _parseError: cleanJson(cols[7]).slice(0, 200) }; }

  return {
    id: unquote(cols[0]),
    swimmer_id: unquote(cols[1]),
    instructor_id: unquote(cols[2]),
    assessment_date: unquote(cols[3]),
    strengths: unquote(cols[4]),
    challenges: unquote(cols[5]),
    swim_skills: swimSkills,
    roadblocks: roadblocks,
    swim_skills_goals: unquote(cols[8]),
    safety_goals: unquote(cols[9]),
    approval_status: unquote(cols[10]),
    ready_for_lessons: cols[11].trim() === 'true',
    created_at: unquote(cols[12]),
  };
}

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error('Usage: npx ts-node scripts/seed-assessments.ts <path-to-sql-file>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const sql = fs.readFileSync(path.resolve(sqlPath), 'utf-8');

  // Extract all row tuples from the SQL
  // Split by "),(" which separates row tuples in the VALUES clause
  const rows: string[] = [];

  // Find each VALUES block
  const valuesRegex = /VALUES\s*\(([\s\S]*?)ON CONFLICT/g;
  let match: RegExpExecArray | null;

  while ((match = valuesRegex.exec(sql)) !== null) {
    let vals = match[1].trim();
    // Remove trailing )
    if (vals.endsWith(')')) vals = vals.slice(0, -1);

    // Split by "),(" into individual rows
    const parts = vals.split(/\)\s*,\s*\(/);

    for (const part of parts) {
      const record = parseRow(part);
      if (record) {
        rows.push(JSON.stringify(record));
      }
    }
  }

  console.log(`Parsed ${rows.length} records`);

  // Insert in batches of 10
  const BATCH_SIZE = 10;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map(r => JSON.parse(r));

    const { error } = await supabase
      .from('assessment_reports')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors++;
      if (error.message.includes('column')) {
        console.error('Sample record:', JSON.stringify(batch[0], null, 2));
      }
    } else {
      inserted += batch.length;
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`Progress: ${inserted}/${rows.length} (${errors} errors)`);
    }
  }

  // Verify
  const { data: { length: finalCount } = { length: 0 }, error: countError } = await supabase
    .from('assessment_reports')
    .select('*', { count: 'exact', head: true });

  console.log(`\nResults: ${inserted} inserted, ${errors} batch errors`);
  if (!countError) {
    console.log(`Total in table: ${finalCount}`);
  }
}

main().catch(console.error);
