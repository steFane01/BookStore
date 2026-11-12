import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CAMPAIGN_LIMITS,
  buildCampaignEmail,
  messageToHtml,
  validateCampaign,
} from '../src/lib/newsletterCampaign.js'

test('validateCampaign accepts a normal subject and message, trimmed', () => {
  const result = validateCampaign({ subject: '  Oferte de toamnă  ', message: '  Trei cărți noi.  ' })
  assert.deepEqual(result, { ok: true, subject: 'Oferte de toamnă', message: 'Trei cărți noi.' })
})

test('validateCampaign rejects missing or too short fields', () => {
  assert.equal(validateCampaign({}).ok, false)
  assert.equal(validateCampaign({ subject: 'ab', message: 'mesaj suficient de lung' }).ok, false)
  assert.equal(validateCampaign({ subject: 'Ofertă nouă', message: 'scurt' }).ok, false)
})

test('validateCampaign enforces the length limits', () => {
  const longSubject = 'a'.repeat(CAMPAIGN_LIMITS.subject + 1)
  const longMessage = 'a'.repeat(CAMPAIGN_LIMITS.message + 1)
  assert.equal(validateCampaign({ subject: longSubject, message: 'mesaj suficient de lung' }).ok, false)
  assert.equal(validateCampaign({ subject: 'Ofertă', message: longMessage }).ok, false)
})

test('validateCampaign collapses newlines in the subject (header-injection guard)', () => {
  const result = validateCampaign({
    subject: 'Ofertă\nBcc: altcineva@exemplu.ro',
    message: 'Mesajul campaniei este aici.',
  })
  assert.equal(result.ok, true)
  assert.equal(result.subject, 'Ofertă Bcc: altcineva@exemplu.ro')
})

test('messageToHtml escapes HTML and keeps paragraph breaks', () => {
  const html = messageToHtml('Prima <script>alert(1)</script> linie.\nA doua linie.\n\nAl doilea paragraf.')
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('<br/>'))
  assert.equal((html.match(/<p /g) || []).length, 2)
})

test('buildCampaignEmail renders the subject, message and opt-out note', () => {
  const email = buildCampaignEmail({
    brand: 'RV STUDIO',
    subject: 'Oferte de toamnă',
    message: 'Reduceri la eseuri.\n\nDoar săptămâna aceasta.',
    publicUrl: 'https://rvstudio.ro',
    contactEmail: 'contact@rvstudio.ro',
  })

  assert.equal(email.subject, 'Oferte de toamnă')
  assert.ok(email.html.includes('RV STUDIO'))
  assert.ok(email.html.includes('Reduceri la eseuri.'))
  assert.ok(email.html.includes('https://rvstudio.ro'))
  assert.ok(email.html.includes('mailto:contact@rvstudio.ro'))
  assert.ok(email.html.includes('te-ai abonat la newsletter-ul'))
  assert.ok(email.text.includes('Reduceri la eseuri.'))
  assert.ok(email.text.includes('contact@rvstudio.ro'))
})

test('buildCampaignEmail escapes the subject and brand', () => {
  const email = buildCampaignEmail({
    brand: '<b>Brand</b>',
    subject: '<img src=x onerror=alert(1)>',
    message: 'Mesaj normal.',
  })
  assert.ok(!email.html.includes('<img src=x'))
  assert.ok(email.html.includes('&lt;img src=x'))
  assert.ok(!email.html.includes('<b>Brand</b>'))
})
