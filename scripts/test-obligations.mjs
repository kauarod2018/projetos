import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';

const dateSchema = zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
const source = readFileSync(new URL('../lib/obligations.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
runInNewContext(output, { module, exports: module.exports, require: name => name === 'zod' ? zod : name === '@/lib/validation' ? { dateSchema } : (() => { throw new Error(`Unexpected import: ${name}`); })(), Date, Array, Math, Number, String });
const { installmentDate, splitInstallments, obligationCreateSchema, obligationPaymentSchema } = module.exports;

assert.deepEqual([...splitInstallments(10001, 3)], [3334, 3334, 3333]);
assert.equal(splitInstallments(10001, 3).reduce((sum, amount) => sum + amount, 0), 10001);
assert.equal(installmentDate('2028-01-31', 1), '2028-02-29');
assert.equal(installmentDate('2028-01-31', 2), '2028-03-31');
const base = { type: 'receivable', customerId: 7, description: 'Serviço', amountCents: 10000, dueDate: '2028-01-31', installmentCount: 3 };
assert.equal(obligationCreateSchema.safeParse(base).success, true);
for (const patch of [{ customerId: 0 }, { amountCents: 0 }, { dueDate: '2028-02-30' }, { installmentCount: 25 }, { userId: 9 }]) assert.equal(obligationCreateSchema.safeParse({ ...base, ...patch }).success, false);
assert.equal(obligationPaymentSchema.safeParse({ amountCents: 100, transactionDate: '2028-02-29', requestKey: '26b0c506-5672-4c46-9d87-d87cd77d3ab9' }).success, true);
assert.equal(obligationPaymentSchema.safeParse({ amountCents: -1, transactionDate: '2028-02-29', requestKey: '26b0c506-5672-4c46-9d87-d87cd77d3ab9' }).success, false);
console.log('Financial obligation installment distribution, due-date clamping, owner-input validation and partial payment validation passed.');
