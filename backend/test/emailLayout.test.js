import test from 'node:test'
import assert from 'node:assert/strict'
import { renderEmail, textToHtml, detailRows } from '../src/lib/emailLayout.js'

test('renderEmail wraps the content in the shared brand shell', () => {
  const { html, text } = renderEmail({
    brand: 'RV STUDIO',
    eyebrow: 'Comandă nouă',
    title: 'Comanda RV-1001',
    bodyHtml: '<p>Conținutul emailului.</p>',
    bodyText: 'Conținutul emailului.',
    cta: { label: 'Deschide panoul', url: 'https://rvstudio.ro/admin' },
    footerHtml: ['Comandă plasată pe RV STUDIO.'],
    footerText: ['Comandă plasată pe RV STUDIO.'],
  })

  // Shell markers shared with the campaign email.
  assert.ok(html.includes('background-color:#f5f0e6'))
  assert.ok(html.includes('background-color:#fbf8f2'))
  assert.ok(html.includes('background-color:#642a2e'))
  assert.ok(html.includes('Georgia'))
  assert.ok(html.includes('RV STUDIO &middot; Comandă nouă'))
  assert.ok(html.includes('Comanda RV-1001'))
  assert.ok(html.includes('Conținutul emailului.'))
  assert.ok(html.includes('href="https://rvstudio.ro/admin"'))
  assert.ok(html.includes('Deschide panoul'))
  assert.ok(html.includes('Comandă plasată pe RV STUDIO.'))

  assert.ok(text.includes('Conținutul emailului.'))
  assert.ok(text.includes('Deschide panoul: https://rvstudio.ro/admin'))
  assert.ok(text.includes('Comandă plasată pe RV STUDIO.'))
})

test('renderEmail escapes the brand, eyebrow and title', () => {
  const { html } = renderEmail({
    brand: '<b>Brand</b>',
    eyebrow: 'Test & <script>',
    title: '<img src=x onerror=alert(1)>',
    bodyHtml: '<p>Corp.</p>',
    bodyText: 'Corp.',
  })

  assert.ok(!html.includes('<b>Brand</b>'))
  assert.ok(!html.includes('<img src=x'))
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;b&gt;Brand&lt;/b&gt;'))
  assert.ok(html.includes('Test &amp; &lt;script&gt;'))
})

test('renderEmail works without a CTA or footer lines', () => {
  const { html, text } = renderEmail({
    brand: 'Librăria',
    bodyHtml: '<p>Doar text.</p>',
    bodyText: 'Doar text.',
  })
  assert.ok(!html.includes('display:inline-block;background-color:#642a2e'))
  assert.ok(html.includes('Librăria'))
  assert.ok(text.startsWith('Doar text.'))
  assert.ok(text.includes('—\nLibrăria'))
})

test('textToHtml escapes markup and keeps paragraphs/line breaks', () => {
  const html = textToHtml('Prima <b>linie</b>.\nA doua.\n\nAl doilea paragraf.')
  assert.ok(!html.includes('<b>'))
  assert.ok(html.includes('&lt;b&gt;'))
  assert.ok(html.includes('<br/>'))
  assert.equal((html.match(/<p style=/g) || []).length, 2)
})

test('detailRows escapes labels and keeps already-escaped values', () => {
  const html = detailRows([
    ['Nume <client>', 'Ion &amp; Ana'],
    ['Gol', ''],
  ])
  assert.ok(html.includes('Nume &lt;client&gt;:'))
  assert.ok(html.includes('Ion &amp; Ana'))
  assert.ok(!html.includes('Gol'))
})
