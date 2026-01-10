# Airtable to Supabase Migration Script

This script migrates all clients from Airtable to Supabase, with support for resuming if interrupted.

## Features

- **Batch Processing**: Processes records in configurable batches (default: 50)
- **Resume Capability**: Saves state after each batch, can resume if interrupted
- **Error Handling**: Logs errors to file and continues with next record
- **Retry Logic**: Automatically retries failed migrations (default: 3 retries)
- **Progress Tracking**: Real-time progress reporting with statistics
- **State Management**: Saves migration state to resume later

## Prerequisites

1. Node.js installed
2. Airtable API key with access to your base
3. Supabase project with service role key
4. Required environment variables configured

## Setup

### 1. Copy environment file

```bash
cp .env.migrate_all_clients.example .env.migrate_all_clients
```

### 2. Configure environment variables

Edit `.env.migrate_all_clients` and fill in your values:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=appa5hlX697VP1FSo  # iCanSwim base
AIRTABLE_TABLE_ID=tblXfCVX2NaUuXbYm  # Clients table
AIRTABLE_VIEW_ID=viwKm0ev03MhrSyCc   # All Clients view

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Admin user ID for created_by/approved_by fields
# ADMIN_USER_ID=uuid_of_admin_user_here

# Migration Settings
BATCH_SIZE=50
DELAY_BETWEEN_BATCHES_MS=2000
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

### 3. Get your Airtable API key

1. Go to https://airtable.com/create/tokens
2. Create a new token with access to your base
3. Copy the token to `AIRTABLE_API_KEY`

### 4. Get your Supabase service role key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the `service_role` key (not the anon key)
4. Copy the URL to `SUPABASE_URL`

## Running the Migration

### Basic migration

```bash
node migrate_all_clients.js
```

### Monitor progress

The script will show:
- Current batch being processed
- Progress percentage
- Statistics (migrated, errors, parents created, etc.)
- Estimated time remaining

### Interrupt and resume

If you need to stop the migration:
- Press `Ctrl+C` to interrupt gracefully
- The script will save its state to `migration_state.json`
- To resume, simply run the script again:
  ```bash
  node migrate_all_clients.js
  ```

### Force fresh start

To start over (ignoring previous state):
```bash
rm migration_state.json migration_error_log.txt
node migrate_all_clients.js
```

## Output Files

- `migration_error_log.txt`: Detailed error log with timestamps
- `migration_state.json`: State file for resuming (automatically cleaned up on success)

## Migration Details

### What gets migrated

For each client record where `Supabase Migrated != true`:
1. **Parent Profile**: Creates or links to existing parent profile based on email
2. **Swimmer Record**: Creates swimmer with all mapped fields
3. **Airtable Updates**: Marks record as migrated and adds Supabase IDs

### Field Mapping

The script maps Airtable fields to Supabase schema:
- Client Name → first_name, last_name
- Email → parent profile email
- Medical/behavioral fields → boolean/text fields
- Arrays (diagnosis, swim goals, etc.) → JSON arrays
- Status fields → appropriate enum values

### Error Handling

- Errors are logged to `migration_error_log.txt`
- Failed records are marked in Airtable with error message
- Script continues with next record after retries
- Final report shows error count and sample errors

## Configuration Options

You can adjust these in `.env.migrate_all_clients`:

| Variable | Default | Description |
|----------|---------|-------------|
| `BATCH_SIZE` | 50 | Records per batch |
| `DELAY_BETWEEN_BATCHES_MS` | 2000 | Delay between batches (ms) |
| `MAX_RETRIES` | 3 | Max retries per failed record |
| `RETRY_DELAY_MS` | 1000 | Delay between retries (ms) |

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Error: "Missing required environment variables"
   - Solution: Check `.env.migrate_all_clients` file exists and has all required values

2. **Airtable API rate limiting**
   - Symptom: "429 Too Many Requests" errors
   - Solution: Increase `DELAY_BETWEEN_BATCHES_MS` to 5000 or more

3. **Supabase connection issues**
   - Error: "Failed to fetch" or connection errors
   - Solution: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

4. **Duplicate parent profiles**
   - Symptom: Multiple parents with same email
   - Solution: Script handles this automatically by linking to existing profile

### Debug Mode

For detailed debugging, you can modify the script to add console logs or run with Node debug flag:

```bash
node --inspect migrate_all_clients.js
```

## Post-Migration

After migration completes successfully:

1. **Verify data** in Supabase dashboard
2. **Check error log** for any issues
3. **Review migrated records** in Airtable (look for "Migration Notes" field)
4. **Clean up** state files (automatically done on success)

## Support

If you encounter issues:
1. Check the error log: `migration_error_log.txt`
2. Review migration state: `migration_state.json`
3. Verify environment variables are correct
4. Check Airtable and Supabase API access

## License

This script is provided as-is for migrating iCanSwim data from Airtable to Supabase.