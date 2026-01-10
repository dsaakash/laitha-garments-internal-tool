import { Pool } from 'pg'

// Determine SSL configuration based on connection string
function getPoolConfig() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    const errorMsg = [
      'DATABASE_URL environment variable is not set.',
      '',
      'Please add DATABASE_URL to your .env file in the project root.',
      'Example format:',
      '  DATABASE_URL=postgresql://username:password@localhost:5432/database_name',
      '',
      'For remote databases (Neon, Supabase, etc.):',
      '  DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require',
      '',
      'After adding DATABASE_URL, restart your Next.js development server.'
    ].join('\n')
    throw new Error(errorMsg)
  }
  
  const isLocalhost = connectionString.includes('localhost') || 
                      connectionString.includes('127.0.0.1')
  const sslConfig = isLocalhost 
    ? false 
    : { rejectUnauthorized: false }

  return {
    connectionString,
    ssl: sslConfig
  }
}

// Create a connection pool with lazy initialization
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    try {
      const config = getPoolConfig()
      pool = new Pool(config)
      
      // Set up event handlers
      pool.on('connect', () => {
        console.log('Database connected successfully')
      })

      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err)
        // Don't exit process in Next.js, just log the error
      })
    } catch (error) {
      console.error('Failed to create database pool:', error)
      throw error
    }
  }
  return pool
}

// Export getPool function if needed (most code uses query function)
export { getPool }

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const poolInstance = getPool()
    const res = await poolInstance.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error', error)
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        throw new Error('Database configuration error: DATABASE_URL is not set. Please check your .env file.')
      }
      if (error.message.includes('connect') || error.message.includes('connection')) {
        throw new Error('Database connection failed. Please check your DATABASE_URL and ensure the database is accessible.')
      }
    }
    
    throw error
  }
}
