import test from 'node:test';
import assert from 'node:assert/strict';
import { deveMostrarAvisoIOS, ehIOS, DIAS_ATE_REAPARECER } from '../src/instalar-ios.js';

const DIA = 86400000;
const base = { ios: true, standalone: false, nativo: false, fechadoEm: null, agora: 10 * DIA };

test('mostra no Safari do iPhone fora do modo app', () => assert.equal(deveMostrarAvisoIOS(base), true));
test('não mostra fora do iOS', () => assert.equal(deveMostrarAvisoIOS({ ...base, ios: false }), false));
test('não mostra em modo app (standalone)', () => assert.equal(deveMostrarAvisoIOS({ ...base, standalone: true }), false));
test('não mostra dentro do app nativo', () => assert.equal(deveMostrarAvisoIOS({ ...base, nativo: true }), false));
test('some depois de fechado e volta após alguns dias', () => {
  assert.equal(deveMostrarAvisoIOS({ ...base, fechadoEm: 9 * DIA }), false);
  assert.equal(deveMostrarAvisoIOS({ ...base, fechadoEm: 10 * DIA - (DIAS_ATE_REAPARECER - 1) * DIA }), false);
  assert.equal(deveMostrarAvisoIOS({ ...base, fechadoEm: 10 * DIA - DIAS_ATE_REAPARECER * DIA }), true);
});
test('valor inválido guardado não esconde o aviso', () => assert.equal(deveMostrarAvisoIOS({ ...base, fechadoEm: NaN }), true));
test('detecta iPhone, iPad e iPad disfarçado de Mac', () => {
  assert.equal(ehIOS({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }), true);
  assert.equal(ehIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }), true);
  assert.equal(ehIOS({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)', platform: 'Win32' }), false);
  assert.equal(ehIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }), false);
});
