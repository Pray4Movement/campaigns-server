import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const yamlPath = resolve('./server/openapi.yaml')
  const yamlContent = await readFile(yamlPath, 'utf-8')

  // Set the correct content type for YAML
  setHeader(event, 'Content-Type', 'application/x-yaml')

  return yamlContent
})
