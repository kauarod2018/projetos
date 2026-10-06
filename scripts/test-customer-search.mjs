import test from 'node:test';
import assert from 'node:assert/strict';
import { customerMatches } from '../lib/customer-search.ts';
const customer = { name: 'João da Silva', phone: '+55 (41) 99999-1234', email: 'JOAO@example.com' };
test('Customer search matches accents, case, email and formatted telephone', () => {
  for (const query of [' joao ', 'JOÃO DA', 'joao@EXAMPLE', '41999991234', '(41) 99999-1234', '', '   ']) assert.equal(customerMatches(customer, query), true, query);
});
test('Search does not interpret punctuation or commands or search private fields', () => {
  for (const query of ['Maria', '---', '()', 'excluir João', '11999991234', 'privado']) assert.equal(customerMatches({ ...customer, notes: 'privado' }, query), false, query);
  assert.equal(customerMatches({ name: 'Sem contato', phone: '', email: '' }, '999'), false);
});
