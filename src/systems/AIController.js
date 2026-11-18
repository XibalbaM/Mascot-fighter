export class AIController {
  constructor() {
    this.decisionTimer = 0;
    this.decisionInterval = 120; // Re-evaluates every 120ms
    this.state = 'NEUTRAL'; // NEUTRAL, RETREAT, RUSH, BLOCKING
    this.dummyMode = 'STAND'; // 'STAND', 'CROUCH', 'AUTO_BLOCK'
  }

  update(dt, aiFighter, opponent, gameMode) {
    // Reset edge triggers each frame
    if (gameMode === 'PVP') return;

    aiFighter.input.justLightPunch = false;
    aiFighter.input.justHeavyPunch = false;
    aiFighter.input.justLightKick = false;
    aiFighter.input.justHeavyKick = false;
    aiFighter.input.justFireball = false;
    aiFighter.input.justUppercut = false;
    aiFighter.input.justSuper = false;

    if (gameMode === 'TRAINING') {
      this.handleTrainingDummy(aiFighter, opponent);
      return;
    }

    this.decisionTimer += dt;
    const distX = Math.abs(aiFighter.x - opponent.x);
    const oppIsAttacking = opponent.state === 'ATTACK';
    const oppIsAirborne = !opponent.isGrounded;

    // React immediately to anti-air or incoming strikes
    if (oppIsAirborne && distX < 160 && aiFighter.isGrounded) {
      // Anti-air Dragon Uppercut!
      if (Math.random() < 0.65) {
        aiFighter.input.justUppercut = true;
        return;
      }
    }

    // Reaction to incoming attack (Guard)
    if (oppIsAttacking && distX < 220) {
      if (Math.random() < 0.75) {
        // Hold backward to block!
        const blockDir = (aiFighter.facing === 1) ? { left: true, right: false } : { left: false, right: true };
        aiFighter.input.left = blockDir.left;
        aiFighter.input.right = blockDir.right;
        aiFighter.input.down = opponent.currentAttack?.attackType === 'low';
        return;
      }
    }

    // Strategic decisions every interval
    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0;
      this.makeStrategicDecision(aiFighter, opponent, distX);
    }
  }

  makeStrategicDecision(ai, opp, distX) {
    // Super check: if meter full and in range, unleash!
    if (ai.superMeter >= 100 && distX < 200 && Math.random() < 0.7) {
      ai.input.justSuper = true;
      return;
    }

    const fwdLeft = ai.facing === -1;
    const fwdRight = ai.facing === 1;

    // Range zones:
    if (distX > 320) {
      // Long distance: Approach or throw projectile
      const roll = Math.random();
      if (roll < 0.45) {
        // Walk forward
        ai.input.left = fwdLeft;
        ai.input.right = fwdRight;
        ai.input.down = false;
        ai.input.up = false;
      } else if (roll < 0.75) {
        // Fireball!
        ai.input.left = false;
        ai.input.right = false;
        ai.input.justFireball = true;
      } else {
        // Jump in
        ai.input.left = fwdLeft;
        ai.input.right = fwdRight;
        ai.input.up = true;
      }
    } else if (distX > 140) {
      // Mid range (Footsies / Poking range)
      const roll = Math.random();
      if (roll < 0.3) {
        // Heavy Kick / Poke
        ai.input.justHeavyKick = true;
      } else if (roll < 0.5) {
        // Crouch sweep
        ai.input.down = true;
        ai.input.justHeavyKick = true;
      } else if (roll < 0.75) {
        // Walk forward into close range
        ai.input.left = fwdLeft;
        ai.input.right = fwdRight;
        ai.input.down = false;
      } else {
        // Step back defensively
        ai.input.left = !fwdLeft;
        ai.input.right = !fwdRight;
      }
    } else {
      // Close range (Brawling / Pressure)
      const roll = Math.random();
      if (roll < 0.35) {
        // Fast Light Jab
        ai.input.justLightPunch = true;
      } else if (roll < 0.6) {
        // Light Kick
        ai.input.justLightKick = true;
      } else if (roll < 0.75) {
        // Uppercut
        ai.input.justUppercut = true;
      } else if (roll < 0.9) {
        // Heavy Punch
        ai.input.justHeavyPunch = true;
      } else {
        // Crouch guard
        ai.input.down = true;
        ai.input.left = !fwdLeft;
        ai.input.right = !fwdRight;
      }
    }
  }

  handleTrainingDummy(dummy, opponent) {
    // Dummy holds position or auto blocks
    dummy.input.left = false;
    dummy.input.right = false;
    dummy.input.up = false;
    dummy.input.down = (this.dummyMode === 'CROUCH');

    if (this.dummyMode === 'AUTO_BLOCK' && opponent.state === 'ATTACK') {
      const blockDir = (dummy.facing === 1) ? { left: true, right: false } : { left: false, right: true };
      dummy.input.left = blockDir.left;
      dummy.input.right = blockDir.right;
      dummy.input.down = (opponent.currentAttack?.attackType === 'low');
    }
  }
}
