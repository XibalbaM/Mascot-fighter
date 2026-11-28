export class AIController {
  constructor() {
    this.decisionTimer = 0;
    this.decisionInterval = 120; // Re-evaluates every 120ms
    this.state = 'NEUTRAL'; // NEUTRAL, RETREAT, RUSH, BLOCKING
    this.dummyMode = 'STAND'; // 'STAND', 'CROUCH', 'AUTO_BLOCK'

    // Held directional intent. The fighter's input flags are fully reset
    // every frame and re-applied from here, so a decision can never get
    // "stuck" (previously `up`/`down` stayed true forever once set).
    this.held = { left: false, right: false, down: false };
  }

  resetInputFlags(inp) {
    inp.left = false;
    inp.right = false;
    inp.up = false;
    inp.down = false;
    inp.justUp = false;
    inp.justLightPunch = false;
    inp.justHeavyPunch = false;
    inp.justLightKick = false;
    inp.justHeavyKick = false;
    inp.justFireball = false;
    inp.justUppercut = false;
    inp.justSuper = false;
  }

  setHeld(left, right, down) {
    this.held.left = !!left;
    this.held.right = !!right;
    this.held.down = !!down;
  }

  update(dt, aiFighter, opponent, gameMode) {
    if (gameMode === 'PVP') return;

    const inp = aiFighter.input;
    this.resetInputFlags(inp);

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
        inp.justUppercut = true;
      }
    } else if (oppIsAttacking && distX < 220) {
      if (Math.random() < 0.75) {
        // Hold backward to block!
        const backKey = (aiFighter.facing === 1) ? 'left' : 'right';
        this.setHeld(backKey === 'left', backKey === 'right', opponent.currentAttack?.attackType === 'low');
      }
    } else if (this.decisionTimer >= this.decisionInterval) {
      // Strategic decisions every interval
      this.decisionTimer = 0;
      this.makeStrategicDecision(aiFighter, opponent, distX);
    }

    // Apply the held directional intent to the fighter's input
    inp.left = this.held.left;
    inp.right = this.held.right;
    inp.down = this.held.down;
  }

  makeStrategicDecision(ai, opp, distX) {
    const inp = ai.input;

    // Super check: if meter full and in range, unleash!
    if (ai.superMeter >= 100 && distX < 200 && Math.random() < 0.7) {
      this.setHeld(false, false, false);
      inp.justSuper = true;
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
        this.setHeld(fwdLeft, fwdRight, false);
      } else if (roll < 0.75) {
        // Fireball!
        this.setHeld(false, false, false);
        inp.justFireball = true;
      } else {
        // Jump in (edge-triggered like a human player)
        this.setHeld(fwdLeft, fwdRight, false);
        inp.justUp = true;
      }
    } else if (distX > 140) {
      // Mid range (Footsies / Poking range)
      const roll = Math.random();
      if (roll < 0.3) {
        // Heavy Kick / Poke
        this.setHeld(false, false, false);
        inp.justHeavyKick = true;
      } else if (roll < 0.5) {
        // Crouch sweep
        this.setHeld(false, false, true);
        inp.justHeavyKick = true;
      } else if (roll < 0.75) {
        // Walk forward into close range
        this.setHeld(fwdLeft, fwdRight, false);
      } else {
        // Step back defensively
        this.setHeld(!fwdLeft, !fwdRight, false);
      }
    } else {
      // Close range (Brawling / Pressure)
      const roll = Math.random();
      if (roll < 0.35) {
        // Fast Light Jab
        this.setHeld(false, false, false);
        inp.justLightPunch = true;
      } else if (roll < 0.6) {
        // Light Kick
        this.setHeld(false, false, false);
        inp.justLightKick = true;
      } else if (roll < 0.75) {
        // Uppercut
        this.setHeld(false, false, false);
        inp.justUppercut = true;
      } else if (roll < 0.9) {
        // Heavy Punch
        this.setHeld(false, false, false);
        inp.justHeavyPunch = true;
      } else {
        // Crouch guard
        this.setHeld(!fwdLeft, !fwdRight, true);
      }
    }
  }

  handleTrainingDummy(dummy, opponent) {
    // Dummy holds position or auto blocks
    this.setHeld(false, false, this.dummyMode === 'CROUCH');
    dummy.input.left = this.held.left;
    dummy.input.right = this.held.right;
    dummy.input.up = false;
    dummy.input.down = this.held.down;

    if (this.dummyMode === 'AUTO_BLOCK' && opponent.state === 'ATTACK') {
      const blockKey = (dummy.facing === 1) ? 'left' : 'right';
      dummy.input[blockKey] = true;
      dummy.input.down = (opponent.currentAttack?.attackType === 'low');
    }
  }
}
