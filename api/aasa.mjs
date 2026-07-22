import { expectedFamilyAASA } from '../scripts/family-production-security-contract.mjs'

export default function aasa(_request, response) {
  response.setHeader('Cache-Control', 'public, max-age=300, must-revalidate')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.status(200).send(JSON.stringify(expectedFamilyAASA))
}
