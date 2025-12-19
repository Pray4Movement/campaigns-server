import { sql } from '#imports'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const results: { query: string; ms: number }[] = []
  const queryCount = 10

  // Test 1: Simple SELECT 1 (multiple times to see warmup effect)
  for (let i = 0; i < queryCount; i++) {
    const start = performance.now()
    await sql`SELECT 1`
    const elapsed = performance.now() - start
    results.push({ query: `SELECT 1 (#${i + 1})`, ms: Math.round(elapsed * 100) / 100 })
  }

  // Test 2: Simple table query (if people_groups exists)
  try {
    const start = performance.now()
    await sql`SELECT COUNT(*) FROM people_groups`
    const elapsed = performance.now() - start
    results.push({ query: 'SELECT COUNT(*) FROM people_groups', ms: Math.round(elapsed * 100) / 100 })
  } catch (e) {
    results.push({ query: 'SELECT COUNT(*) FROM people_groups', ms: -1 })
  }

  // Test 3: Indexed lookup
  try {
    const start = performance.now()
    await sql`SELECT * FROM people_groups WHERE dt_id = 'nonexistent' LIMIT 1`
    const elapsed = performance.now() - start
    results.push({ query: 'SELECT by indexed dt_id (miss)', ms: Math.round(elapsed * 100) / 100 })
  } catch (e) {
    results.push({ query: 'SELECT by indexed dt_id', ms: -1 })
  }

  // Test 4: Multiple parallel queries
  const parallelStart = performance.now()
  await Promise.all([
    sql`SELECT 1`,
    sql`SELECT 2`,
    sql`SELECT 3`,
    sql`SELECT 4`,
    sql`SELECT 5`,
  ])
  const parallelElapsed = performance.now() - parallelStart
  results.push({ query: '5 parallel SELECT queries', ms: Math.round(parallelElapsed * 100) / 100 })

  // Calculate stats
  const selectOnes = results.filter(r => r.query.startsWith('SELECT 1')).map(r => r.ms)
  const avg = selectOnes.reduce((a, b) => a + b, 0) / selectOnes.length
  const min = Math.min(...selectOnes)
  const max = Math.max(...selectOnes)
  const first = selectOnes[0]
  const restAvg = selectOnes.slice(1).reduce((a, b) => a + b, 0) / (selectOnes.length - 1)

  return {
    summary: {
      firstQueryMs: Math.round(first * 100) / 100,
      subsequentAvgMs: Math.round(restAvg * 100) / 100,
      minMs: Math.round(min * 100) / 100,
      maxMs: Math.round(max * 100) / 100,
      avgMs: Math.round(avg * 100) / 100,
      parallelQueriesMs: Math.round(parallelElapsed * 100) / 100,
    },
    details: results,
    interpretation: {
      firstQuerySlow: first > restAvg * 2 ? 'First query significantly slower - connection warmup overhead' : 'First query normal',
      overallLatency: avg > 20 ? 'HIGH - Railway infrastructure issue likely' : avg > 5 ? 'MODERATE - some overhead present' : 'GOOD - latency acceptable',
      parallelEfficiency: parallelElapsed < avg * 5 ? 'Parallel queries efficient - connection pooling working' : 'Parallel queries slow - possible pooling issue',
    }
  }
})
