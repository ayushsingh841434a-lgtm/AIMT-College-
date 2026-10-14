import test from 'node:test';
import assert from 'node:assert/strict';
import { accounts, authenticate, restoreAccount } from '../src/auth.js';

for (const role of Object.keys(accounts)) {
  test(`${role} can sign in with email or ID`, () => {
    const account = accounts[role];
    assert.deepEqual(authenticate(account.email, account.password), { role, id: account.id, name: account.name });
    assert.deepEqual(authenticate(` ${account.id.toLowerCase()} `, account.password), { role, id: account.id, name: account.name });
  });
}

test('wrong passwords, mixed account credentials and unknown users are rejected', () => {
  assert.equal(authenticate(accounts.student.id, 'wrong'), null);
  assert.equal(authenticate(accounts.student.id, accounts.admin.password), null);
  assert.equal(authenticate('unknown', accounts.admin.password), null);
});

test('only known demo accounts can be restored', () => {
  assert.equal(restoreAccount({ role: 'student', id: 'anything' }), null);
  assert.deepEqual(restoreAccount({ role: 'admin', id: accounts.admin.id }), { role: 'admin', id: accounts.admin.id, name: accounts.admin.name });
});
