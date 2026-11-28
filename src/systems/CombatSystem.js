import { GAME_CONFIG } from '../config.js';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitstopRemaining = 0;
  }

  isHitstopped() {
    return this.hitstopRemaining > 0;
  }

  triggerHitstop(durationMs) {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs);
  }

  update(dt, p1, p2, projectiles) {
    // If in hitstop (impact freeze), decrement and skip combat movement.
    // Returns frozen=true only while time actually remains (the expiry frame
    // is not frozen, avoiding one extra frozen frame per hit).
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= dt;
      return this.hitstopRemaining > 0;
    }

    // 1. Pushbox Collision (Separation)
    this.resolvePushboxes(p1, p2);

    // 2. Direct Melee Attack Collisions (2 phases)
    // Phase 1: detect every hit. Nobody takes damage yet, so a fighter's
    // attack is never cancelled before it has been checked.
    const hits = [];
    this.detectMeleeHit(p1, p2, hits);
    this.detectMeleeHit(p2, p1, hits);

    // Phase 2: apply the damage once both attacks have been detected
    for (const { attack, defender, hitbox } of hits) {
      attack.hasHit = true;
      const result = defender.takeDamage(hitbox);

      // Micro hitstop
      this.triggerHitstop(result.blocked ? GAME_CONFIG.HITSTOP.BLOCK : hitbox.hitstop);
    }

    // 3. Projectile Collisions
    this.checkProjectiles(projectiles, p1, p2);

    return false;
  }

  /**
   * Authentic fighting game pushbox separation with corner handling
   */
  resolvePushboxes(p1, p2) {
    // Skip pushbox separation if either player is airborne or knocked down
    if (!p1.isGrounded || !p2.isGrounded || p1.state === 'KNOCKDOWN' || p2.state === 'KNOCKDOWN' ||
        p1.state === 'DEFEAT' || p2.state === 'DEFEAT') {
      return;
    }

    const b1 = p1.getPushBox();
    const b2 = p2.getPushBox();

    // AABB overlap check
    const overlapX = (b1.x < b2.x + b2.w) && (b1.x + b1.w > b2.x);
    const overlapY = (b1.y < b2.y + b2.h) && (b1.y + b1.h > b2.y);

    if (overlapX && overlapY) {
      const minX = 70;
      const maxX = GAME_CONFIG.STAGE_WIDTH - 70;

      // Distance to separate
      let diffX;
      if (p1.x < p2.x) {
        diffX = (b1.x + b1.w) - b2.x;
        // P1 is on left, P2 on right
        const p1AtWall = (p1.x <= minX + 10);
        const p2AtWall = (p2.x >= maxX - 10);

        if (p1AtWall && !p2AtWall) {
          p2.x += diffX;
        } else if (p2AtWall && !p1AtWall) {
          p1.x -= diffX;
        } else {
          p1.x -= diffX * 0.5;
          p2.x += diffX * 0.5;
        }
      } else {
        diffX = (b2.x + b2.w) - b1.x;
        // P2 is on left, P1 on right
        const p2AtWall = (p2.x <= minX + 10);
        const p1AtWall = (p1.x >= maxX - 10);

        if (p2AtWall && !p1AtWall) {
          p1.x += diffX;
        } else if (p1AtWall && !p2AtWall) {
          p2.x -= diffX;
        } else {
          p2.x -= diffX * 0.5;
          p1.x += diffX * 0.5;
        }
      }
    }
  }

  // Phase 1: only detects the hit and stores it. takeDamage is called later in update().
  detectMeleeHit(attacker, defender, hits) {
    const hitbox = attacker.getActiveHitbox();
    const attack = attacker.currentAttack;
    if (!hitbox || !attack || attack.hasHit) return;

    const hurtboxes = defender.getHurtBoxes();
    if (!hurtboxes || hurtboxes.length === 0) return;

    if (hurtboxes.some(hb => this.intersectAABB(hitbox, hb))) {
      hits.push({ attacker, defender, attack, hitbox });
    }
  }

  checkProjectiles(projectiles, p1, p2) {
    // 1. Projectile vs Projectile Clash
    for (let i = 0; i < projectiles.length; i++) {
      for (let j = i + 1; j < projectiles.length; j++) {
        const pA = projectiles[i];
        const pB = projectiles[j];
        if (!pA.isDead && !pB.isDead && pA.owner !== pB.owner) {
          const bA = pA.getHitbox();
          const bB = pB.getHitbox();
          if (bA && bB && this.intersectAABB(bA, bB)) {
            pA.clash();
            pB.clash();
            this.triggerHitstop(40);
          }
        }
      }
    }

    // 2. Projectile vs Fighters
    projectiles.forEach(proj => {
      if (proj.isDead) return;
      const target = (proj.owner === p1) ? p2 : p1;
      const pHitbox = proj.getHitbox();
      if (!pHitbox) return;

      const hurtboxes = target.getHurtBoxes();
      for (let i = 0; i < hurtboxes.length; i++) {
        const hb = hurtboxes[i];
        if (this.intersectAABB(pHitbox, hb)) {
          const result = target.takeDamage(pHitbox);
          proj.onHit(result.blocked);
          this.triggerHitstop(result.blocked ? GAME_CONFIG.HITSTOP.BLOCK : pHitbox.hitstop);
          break;
        }
      }
    });
  }

  intersectAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.w &&
      rectA.x + rectA.w > rectB.x &&
      rectA.y < rectB.y + rectB.h &&
      rectA.y + rectA.h > rectB.y
    );
  }
}
