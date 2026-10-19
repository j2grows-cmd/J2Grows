import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ENVIRONMENT } from "../src/game/genetics.ts";
import { advanceStaffDay, canStartStaffTraining, DEFAULT_STAFF_STATE, effectiveStaffCareCondition, normalizeStaffState, STAFF_TRAINING_COST, startStaffTraining, weeklyStaffOperatingCost } from "../src/game/staff.ts";

test("staff controls persist safely and malformed values are normalized", () => {
  assert.deepEqual(normalizeStaffState(undefined), DEFAULT_STAFF_STATE);
  assert.deepEqual(normalizeStaffState({ routineCareEnabled: false, trainingDaysRemaining: 99, trainingLevel: 9 }), { routineCareEnabled: false, trainingDaysRemaining: 3, trainingLevel: 3 });
  assert.deepEqual(normalizeStaffState({ trainingDaysRemaining: -2, trainingLevel: 1.9 }), { routineCareEnabled: true, trainingDaysRemaining: 0, trainingLevel: 1 });
});

test("routine care buffers low environmental conditions and can be paused", () => {
  const poor = { ...DEFAULT_ENVIRONMENT, light: 20, nutrition: 25, humidity: 30 };
  assert.equal(effectiveStaffCareCondition(poor, DEFAULT_STAFF_STATE), 55);
  assert.equal(effectiveStaffCareCondition(poor, { ...DEFAULT_STAFF_STATE, routineCareEnabled: false }), 25);
  assert.equal(effectiveStaffCareCondition(poor, { ...DEFAULT_STAFF_STATE, trainingLevel: 2 }), 65);
});

test("training requires funds, takes three simulated days, and improves care up to level three", () => {
  assert.equal(canStartStaffTraining(STAFF_TRAINING_COST - 1, DEFAULT_STAFF_STATE), false);
  assert.equal(canStartStaffTraining(STAFF_TRAINING_COST, DEFAULT_STAFF_STATE), true);
  let state = startStaffTraining(DEFAULT_STAFF_STATE);
  assert.deepEqual(state, { routineCareEnabled: true, trainingDaysRemaining: 3, trainingLevel: 0 });
  assert.equal(startStaffTraining(state), null);
  state = advanceStaffDay(state);
  assert.equal(state.trainingDaysRemaining, 2);
  assert.equal(state.trainingLevel, 0);
  state = advanceStaffDay(advanceStaffDay(state));
  assert.equal(state.trainingDaysRemaining, 0);
  assert.equal(state.trainingLevel, 1);
  state = { ...state, trainingLevel: 3 };
  assert.equal(canStartStaffTraining(STAFF_TRAINING_COST, state), false);
});

test("routine care has a clear weekly running cost that stops when paused", () => {
  assert.equal(weeklyStaffOperatingCost(DEFAULT_STAFF_STATE), 8);
  assert.equal(weeklyStaffOperatingCost({ ...DEFAULT_STAFF_STATE, routineCareEnabled: false }), 0);
});
