export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const appName = config.appName || 'Base'

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appName} API - Scalar</title>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/_openapi.yaml"
      data-configuration='{"theme":"purple"}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`
})
