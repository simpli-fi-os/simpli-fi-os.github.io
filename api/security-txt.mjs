import { familySecurityTxt } from '../scripts/family-security-txt.mjs'

export default function securityTxt(_request, response) {
  response.setHeader('Cache-Control', 'public, max-age=300, must-revalidate')
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.status(200).send(familySecurityTxt)
}
