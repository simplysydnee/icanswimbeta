const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as the app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPurchaseOrdersSchema() {
  console.log('Checking purchase_orders table schema...');

  try {
    // Get table information
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching purchase_orders:', error);
      return;
    }

    if (data && data.length > 0) {
      const sampleRow = data[0];
      console.log('\nSample purchase order row keys:');
      console.log(Object.keys(sampleRow));

      console.log('\nChecking for billing columns:');
      const billingColumns = [
        'billing_status',
        'billed_amount_cents',
        'paid_amount_cents',
        'due_date',
        'billed_at',
        'paid_at',
        'invoice_number',
        'payment_reference',
        'billing_notes'
      ];

      billingColumns.forEach(col => {
        const exists = col in sampleRow;
        console.log(`${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
        if (exists) {
          console.log(`  Value: ${sampleRow[col]}`);
        }
      });
    } else {
      console.log('No purchase orders found in database.');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function checkMigrationStatus() {
  console.log('\n=== Checking Migration Status ===');

  // Check if we can query the schema_migrations table
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(5);

    if (error) {
      console.log('Cannot query schema_migrations table:', error.message);
      console.log('Trying to check via information_schema...');

      // Try a different approach - check columns via information_schema
      const { data: columns, error: colsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'purchase_orders')
        .eq('table_schema', 'public')
        .order('column_name');

      if (colsError) {
        console.error('Error checking information_schema:', colsError);
      } else {
        console.log('\nColumns in purchase_orders table:');
        columns.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type})`);
        });

        // Check for specific billing columns
        const billingCols = columns.filter(col =>
          col.column_name.includes('billing') ||
          col.column_name.includes('amount') ||
          col.column_name.includes('due') ||
          col.column_name.includes('invoice') ||
          col.column_name.includes('payment')
        );

        console.log('\nBilling-related columns found:');
        billingCols.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type})`);
        });
      }
    } else {
      console.log('Recent migrations:', data);
    }
  } catch (err) {
    console.error('Error checking migration status:', err);
  }
}

async function main() {
  await checkPurchaseOrdersSchema();
  await checkMigrationStatus();
}

main().catch(console.error);