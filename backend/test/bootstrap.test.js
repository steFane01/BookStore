import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAdminAccounts } from '../src/bootstrap.js'

test('ADMIN_ACCOUNTS parses several accounts and normalises emails', () => {
  const accounts = parseAdminAccounts({
    ADMIN_ACCOUNTS:
      'RalucaRV@rvstudio.ro|Parola1!|RalucaRV; stefanlucian@rvstudio.ro |Parola2!| Stefan Lucian ',
  })
  assert.deepEqual(accounts, [
    { email: 'ralucarv@rvstudio.ro', password: 'Parola1!', name: 'RalucaRV' },
    { email: 'stefanlucian@rvstudio.ro', password: 'Parola2!', name: 'Stefan Lucian' },
  ])
})

test('legacy admin variables are kept as a fallback and duplicates are ignored', () => {
  const accounts = parseAdminAccounts({
    ADMIN_ACCOUNTS: 'admin@rvstudio.ro|Parola1!|RalucaRV',
    ADMIN_EMAIL: 'ADMIN@rvstudio.ro',
    ADMIN_PASSWORD: 'Parola2!',
    ADMIN_NAME: 'RalucaRV',
  })
  assert.equal(accounts.length, 1)
  assert.equal(accounts[0].password, 'Parola1!')

  const legacy = parseAdminAccounts({
    ADMIN_EMAIL: 'owner@rvstudio.ro',
    ADMIN_PASSWORD: 'Parola3!',
    ADMIN_NAME: 'Owner',
  })
  assert.deepEqual(legacy, [{ email: 'owner@rvstudio.ro', password: 'Parola3!', name: 'Owner' }])
})

test('incomplete admin entries are ignored', () => {
  assert.deepEqual(parseAdminAccounts({ ADMIN_ACCOUNTS: '||;only-email@rvstudio.ro||' }), [])
})
