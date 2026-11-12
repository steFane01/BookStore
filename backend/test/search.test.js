import test from 'node:test'
import assert from 'node:assert/strict'
import { likePattern, normalizeSearchTerm, searchExpression } from '../src/lib/search.js'

test('normalizeSearchTerm strips Romanian diacritics and lowercases', () => {
  assert.equal(normalizeSearchTerm('Cărți'), 'carti')
  assert.equal(normalizeSearchTerm('ȘTIINȚĂ'), 'stiinta')
  assert.equal(normalizeSearchTerm('Ştiinţă'), 'stiinta')
  assert.equal(normalizeSearchTerm('  Ana   Maria  '), 'ana maria')
  assert.equal(normalizeSearchTerm(null), '')
})

test('likePattern escapes SQL wildcards and wraps the term', () => {
  assert.equal(likePattern(''), '')
  assert.equal(likePattern('Cărți'), '%carti%')
  assert.equal(likePattern('50%_x'), '%50\\%\\_x%')
})

test('searchExpression lowercases and translates diacritics in SQL', () => {
  assert.equal(
    searchExpression('title'),
    "translate(lower(title), 'ăâîșțşţü', 'aaiststu')",
  )
})
