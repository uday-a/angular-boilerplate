// Imported FIRST by server/dev-api.ts (after dotenv): `tsx watch` doesn't
// set NODE_ENV, and server/utils/env.ts only treats an EXPLICIT
// 'development' as dev (demo mode, non-secure cookies). Must be its own
// module — ESM evaluates imports in order, before dev-api.ts's body runs.
process.env['NODE_ENV'] ??= 'development'
