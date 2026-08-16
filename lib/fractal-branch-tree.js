/**
 * FractalBranchTree - Standalone p5.js Library for Fractal Branching Trees
 * Supports Natural Multi-branching (Type 1: 'hybrid') and Sequential Branching (Type 2: 'sequential').
 * 
 * Usage:
 *   const tree = new FractalBranchTree({
 *     initLength: 200,
 *     branchAngle: 20,
 *     lengthDecay: 0.75,
 *     initThickness: 30,
 *     thicknessDecay: 0.75,
 *     maxDepth: 9,
 *     treeVariation: 0.8,
 *     leafType: 'emerald', // 'emerald', 'sakura', 'autumn'
 *     treeType: 'hybrid',   // 'hybrid' or 'sequential'
 *     windStrength: 1.0,
 *     colorTheme: 'cyberpunk', // 'cyberpunk', 'sakura', 'autumn', 'emerald'
 *     seed: 12345
 *   });
 * 
 *   tree.update(dt);
 *   tree.draw(); // or tree.draw(p5Instance)
 */
(function (global) {
  class BranchNode {
    constructor(treeRef, len, thickness, angle, branchId, depth, level, parent = null, nodeType = 'rachis') {
      this.tree = treeRef;
      this.maxLen = len;
      this.maxThickness = thickness;
      this.angle = angle;
      this.baseAngle = angle;
      this.tipLeanAngle = 0;
      this.branchId = branchId;
      this.depth = depth;
      this.level = level;
      this.parent = parent;
      this.nodeType = nodeType;
      this.pinnaCount = (parent && parent.nodeType === 'pinna') ? parent.pinnaCount + 1 : 0;
      
      this.currentLen = 0;
      this.currentThickness = 0.5;
      this.maxDrawnThickness = 0.5;
      this.children = [];
      this.hasSprouted = false;
      this.hasSproutedContinuation = false;
      this.hasSproutedSide = false;

      let noiseBranch = noise(branchId * 11.2 + 67.4);
      if (noiseBranch < 0.20) {
        this.maxSequentialBranches = 1;
      } else if (noiseBranch < 0.75) {
        this.maxSequentialBranches = 2;
      } else {
        this.maxSequentialBranches = 3;
      }
      
      let angleRad = radians(this.tree.branchAngle);
      let sideHash = noise(branchId * 3.7 + 1.2);
      if (this.maxSequentialBranches === 1) {
        this.slotAngles = [sideHash > 0.5 ? -angleRad : angleRad];
      } else if (this.maxSequentialBranches === 2) {
        this.slotAngles = sideHash > 0.5 ? [-angleRad, angleRad] : [angleRad, -angleRad];
      } else {
        this.slotAngles = [-angleRad, 0, angleRad];
      }

      this.firstSproutedTime = 0;

      let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
      this.slotLeafPhase = ['growing', 'growing', 'growing'];
      this.slotLeafProgress = [0, 0, 0];
      this.slotLeafFallTime = [0, 0, 0];
      this.slotLeafMatureElapsed = [0, 0, 0];
      this.slotLeafMatureWait = [
        0.1 + leafTimeNoise * 0.8 * this.tree.treeVariation,
        0.1 + noise(branchId * 42.4 + 89.2) * 0.8 * this.tree.treeVariation,
        0.1 + noise(branchId * 43.6 + 89.5) * 0.8 * this.tree.treeVariation
      ];
      this.slotDelays = [
        0,
        0.4 + noise(branchId * 9.8 + 14.5) * 1.0,
        0.8 + noise(branchId * 10.2 + 15.1) * 1.0
      ];
      this.slotSprouted = [false, false, false];
      this.sideLeafTimer = 0;
      
      if (parent === null) {
        if (this.tree.treeType === 'sequential') {
          this.terminalLevel = Math.round(this.tree.maxDepth * 0.8);
        } else {
          this.terminalLevel = this.tree.maxDepth;
        }
      } else {
        let noiseTerminal = noise(branchId * 51.3 + 24.7);
        let dev = round((noiseTerminal - 0.5) * 2 * 2.2 * this.tree.treeVariation);
        if (this.tree.treeType === 'sequential') {
          this.terminalLevel = constrain(parent.terminalLevel + dev, 6, 10);
        } else {
          this.terminalLevel = constrain(parent.terminalLevel + dev, 8, 12);
        }
      }
      
      this.leavesPhase = 'growing';
      this.leavesProgress = 0;
      this.leavesFallTime = 0;
      this.matureWaitTime = 0;
      this.matureTimeElapsed = 0;
      
      let noiseSpeed = noise(branchId * 14.7 + 3.2);
      this.speedFactor = 0.4 + noiseSpeed * 1.2 * this.tree.treeVariation;

      let leafSizeNoise = noise(branchId * 31.4 + 12.9);
      let randomScale = 0.85 + leafSizeNoise * 0.30;
      this.leafScaleFactor = randomScale;

      // Pre-build child branches hierarchy recursively
      let isLastLevel = (this.level >= this.terminalLevel);
      if (!isLastLevel) {
        if (this.tree.treeType === 'sequential') {
          for (let slot = 0; slot < this.maxSequentialBranches; slot++) {
            this.sproutSequentialChild(slot);
          }
        } else {
          this.sproutChildren();
        }
      }
    }

    measureGeometry(x = 0, y = 0, currentAngle = 0) {
      let tipX = x + sin(currentAngle) * this.maxLen;
      let tipY = y - cos(currentAngle) * this.maxLen;

      let minX = min(x, tipX);
      let maxX = max(x, tipX);
      let minY = min(y, tipY);
      let maxY = max(y, tipY);

      for (let child of this.children) {
        let childAngle = currentAngle + child.angle;
        let childBounds = child.measureGeometry(tipX, tipY, childAngle);
        minX = min(minX, childBounds.minX);
        maxX = max(maxX, childBounds.maxX);
        minY = min(minY, childBounds.minY);
        maxY = max(maxY, childBounds.maxY);
      }

      return { minX, maxX, minY, maxY };
    }

    applyAutoThickness(parentThickness = null) {
      if (parentThickness !== null) {
        this.maxThickness = parentThickness * this.tree.thicknessDecay;
      }
      for (let child of this.children) {
        child.applyAutoThickness(this.maxThickness);
      }
    }
    
    calculateTimeline(startTime) {
      this.startTime = startTime;
      // Growth duration fluctuates organically per branch between 2.4s and 4.8s
      let durationHash = noise(this.branchId * 14.7 + 3.2);
      let rawDuration = 2.4 + durationHash * 2.4; // 2.4s to 4.8s
      let lenDuration = rawDuration / Math.max(this.tree.growthSpeed || 1.0, 0.1);
      this.lenFullTime = this.startTime + lenDuration;

      let branchSproutDelay = 0.3 + hashRand(this.branchId, 89) * 1.7; // Independent delay 0.3s to 2.0s
      let sproutBaseTime = this.lenFullTime + branchSproutDelay;

      if (this.children.length === 0) {
        this.finishTime = this.lenFullTime + 6.0; // Đảm bảo lá ngọn có đủ 6.0s để rơi xuống tận mặt đất
      } else {
        let maxChildFinish = sproutBaseTime + 1.0;
        for (let i = 0; i < this.children.length; i++) {
          let child = this.children[i];
          let childStart;
          if (this.tree.treeType === 'sequential') {
            let delay = this.slotDelays[i] || 0;
            childStart = sproutBaseTime + delay;
          } else {
            childStart = sproutBaseTime;
          }
          child.calculateTimeline(childStart);
          maxChildFinish = Math.max(maxChildFinish, child.finishTime);
        }
        this.finishTime = maxChildFinish;
      }
      return this.finishTime;
    }

    updateTime(currentTime, totalDuration) {
      if (currentTime < this.startTime) {
        this.currentLen = 0;
        this.currentThickness = 0;
        this.maxDrawnThickness = 0.5;
        this.leavesProgress = 0;
        this.sideLeafTimer = 0;
        this.leavesPhase = 'growing';
        this.leavesFallTime = 0;
        for (let child of this.children) {
          child.updateTime(currentTime, totalDuration);
        }
        return;
      }

      if (currentTime < this.lenFullTime) {
        let progress = (currentTime - this.startTime) / Math.max(this.lenFullTime - this.startTime, 0.001);
        progress = constrain(progress, 0, 1);
        // Primary growth: length reaches 75% of maxLen
        this.currentLen = lerp(0, this.maxLen * 0.75, progress);
        this.leavesProgress = progress;
        this.leavesPhase = 'growing';
        this.leavesFallTime = 0;
        // Primary growth: slender shoot reaching 25% of maxThickness with ease-in curve
        let easedProgress = Math.pow(progress, 1.6);
        this.currentThickness = lerp(0.5, this.maxThickness * 0.25, easedProgress);
        this.sideLeafTimer = 0;
      } else {
        let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
        let matureWaitTime = 0.05 + leafTimeNoise * 0.20 * this.tree.treeVariation;
        let elapsedSinceFull = currentTime - this.lenFullTime;
        let isLastLevel = (this.level >= this.terminalLevel) || (this.children.length === 0);

        if (isLastLevel) {
          this.leavesPhase = 'mature';
          this.leavesFallTime = 0;
        } else {
          if (elapsedSinceFull < matureWaitTime) {
            this.leavesPhase = 'mature';
            this.leavesFallTime = 0;
          } else if (elapsedSinceFull < matureWaitTime + 1.5) {
            this.leavesPhase = 'falling';
            this.leavesFallTime = elapsedSinceFull - matureWaitTime;
          } else {
            this.leavesPhase = 'gone';
            this.leavesFallTime = 1.5;
          }
        }

        let sideT = elapsedSinceFull / 0.8;
        this.sideLeafTimer = constrain(sideT, 0, 1);

        // Global Secondary Growth: đồng bộ vươn dài (75% -> 100%) và phình to (25% -> 100%) theo T_total
        let swellRatio = (currentTime - this.lenFullTime) / Math.max(totalDuration - this.lenFullTime, 0.001);
        swellRatio = constrain(swellRatio, 0, 1);
        let easedSwell = swellRatio * swellRatio * (3 - 2 * swellRatio);

        // Secondary Extension: Vươn dài nốt 25% chiều dài còn lại
        this.currentLen = lerp(this.maxLen * 0.75, this.maxLen, easedSwell);
        this.leavesProgress = 1.0;

        // Secondary Thickening: Phình to nốt 75% độ dày còn lại
        let primaryW = this.maxThickness * 0.25;
        let finalW = this.maxThickness;
        this.currentThickness = lerp(primaryW, finalW, easedSwell);
      }

      this.maxDrawnThickness = max(0.5, this.currentThickness);

      for (let child of this.children) {
        child.updateTime(currentTime, totalDuration);
      }
    }

    getDescendantSproutDepth() {
      if (this.children.length === 0) return 0;
      let maxChild = -1;
      for (let child of this.children) {
        if (child.currentLen > 0) {
          maxChild = max(maxChild, child.getDescendantSproutDepth());
        }
      }
      return maxChild >= 0 ? 1 + maxChild : 0;
    }
    
    update(dt) {
      let activeDescendants = this.getDescendantSproutDepth();
      let globalBaseSpeed = (this.tree.initLength / 2.8);
      let v_base = globalBaseSpeed * this.speedFactor;
      let speed = v_base * Math.pow(0.5, activeDescendants);
      let isLastLevel = (this.level >= this.terminalLevel) || (this.hasSprouted && this.children.length === 0);
      
      if (this.currentLen < this.maxLen) {
        this.currentLen += speed * dt;
        if (this.currentLen > this.maxLen) this.currentLen = this.maxLen;
      }
      
      let progress = this.currentLen / this.maxLen;
      this.currentThickness = lerp(0.5, this.maxThickness, progress);
      
      let sproutProgress = 0.50;
      let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
      let leafTimeFactor = 0.35 + leafTimeNoise * 1.65 * this.tree.treeVariation;
      
      if (isLastLevel) {
        this.leavesProgress = progress;
        this.leavesPhase = 'mature';
      } else {
        if (progress >= 1.0) {
          if (this.leavesPhase === 'growing') {
            this.leavesProgress = 1.0;
            this.leavesPhase = 'mature';
            this.matureWaitTime = 0.05 + leafTimeNoise * 0.20 * this.tree.treeVariation;
            this.matureTimeElapsed = 0;
          } else if (this.leavesPhase === 'mature') {
            this.matureTimeElapsed += dt;
            if (this.matureTimeElapsed >= this.matureWaitTime) {
              this.leavesPhase = 'falling';
              this.leavesFallTime = 0;
              if (this.tree.treeType !== 'sequential') {
                this.sproutChildren();
              }
            }
          } else if (this.leavesPhase === 'falling') {
            this.leavesFallTime += dt;
            if (this.leavesFallTime >= 1.5) {
              this.leavesPhase = 'gone';
            }
          }
        } else {
          this.leavesProgress = progress;
        }

        if (this.tree.treeType === 'sequential') {
          for (let i = 0; i < this.maxSequentialBranches; i++) {
            let canStart = false;
            if (i === 0) {
              canStart = (this.leavesPhase === 'falling' || this.leavesPhase === 'gone' || progress >= 1.0);
            } else {
              if (this.slotSprouted[i - 1]) {
                let timeSinceFirstSprout = this.tree.animationTime - this.firstSproutedTime;
                canStart = (timeSinceFirstSprout >= this.slotDelays[i]);
              }
            }

            if (canStart && !this.slotSprouted[i]) {
              this.sproutSequentialChild(i);
            }
          }
        }
      }
      
      if (this.level >= 5 && !isLastLevel && this.currentLen >= this.maxLen) {
        this.sideLeafTimer += dt;
        if (this.sideLeafTimer > 1.0) {
          this.sideLeafTimer = 1.0;
        }
      }
      
      for (let child of this.children) {
        child.update(dt);
      }

      let raw_base = max(this.currentThickness, 1.0);
      let d_base = raw_base;
      if (this.children.length > 0) {
        let maxChildThickness = 0;
        for (let child of this.children) {
          maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
        }
        let d_tip = max(maxChildThickness, 1.0);
        let maxThicknessAllowed = d_tip / this.tree.thicknessDecay;
        d_base = min(raw_base, maxThicknessAllowed);
      }
      this.maxDrawnThickness = max(this.maxDrawnThickness, d_base);
    }
    
    sproutChildren() {
      if (this.hasSprouted) return;
      this.hasSprouted = true;
      
      let branchMode = 2;
      if (this.tree.treeVariation > 0) {
        let noiseBranchCount = noise(this.branchId * 11.2 + 67.4);
        let p1 = 0.10 * this.tree.treeVariation;
        let p3 = 0.25 * this.tree.treeVariation;
        
        if (noiseBranchCount < p1) {
          branchMode = (noiseBranchCount < p1 / 2) ? 1 : -1;
        } else if (noiseBranchCount > 1 - p3) {
          branchMode = 3;
        } else {
          branchMode = 2;
        }
      }
      
      if (branchMode === 0) return;
      
      let angleRad = radians(this.tree.branchAngle);
      let leftAngleVar = 0, rightAngleVar = 0, midAngleVar = 0;
      let leftLengthDecayVar = this.tree.lengthDecay;
      let rightLengthDecayVar = this.tree.lengthDecay;
      let midLengthDecayVar = this.tree.lengthDecay;
      
      if (this.tree.treeVariation > 0) {
        let noiseCommon = noise(this.branchId * 17.5 + 44.8);
        let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.tree.treeVariation;

        let noiseRelative = noise(this.branchId * 14.2 + 93.1);
        let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.tree.treeVariation;

        let noiseR_indiv = noise(this.branchId * 13.9 + 5.7);
        let noiseL_indiv = noise(this.branchId * 15.2 + 8.9);
        let rightIndivAngle = (noiseR_indiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;
        let leftIndivAngle = (noiseL_indiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;

        rightAngleVar = commonTilt + relativeAngleVar / 2 + rightIndivAngle;
        leftAngleVar = commonTilt - relativeAngleVar / 2 + leftIndivAngle;

        let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
        midAngleVar = (noiseM_angle - 0.5) * 2 * radians(15) * this.tree.treeVariation;
        let noiseR_len = noise(this.branchId * 5.9 + 45.1);
        let noiseL_len = noise(this.branchId * 6.1 + 89.4);
        rightLengthDecayVar = this.tree.lengthDecay * (1.0 + (noiseR_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);
        leftLengthDecayVar = this.tree.lengthDecay * (1.0 + (noiseL_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);

        let hashSide = (Math.abs(Math.sin(this.branchId * 54.321 + 19.876)) * 12345.6789) % 1;
        let noiseAsym = noise(this.branchId * 29.3 + 72.8);
        let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * this.tree.lengthDecay * this.tree.treeVariation;
        
        if (hashSide > 0.5) {
          rightLengthDecayVar += lengthBias;
          leftLengthDecayVar -= lengthBias;
        } else {
          leftLengthDecayVar += lengthBias;
          rightLengthDecayVar -= lengthBias;
        }

        rightLengthDecayVar = constrain(rightLengthDecayVar, 0.30, 0.90);
        leftLengthDecayVar = constrain(leftLengthDecayVar, 0.30, 0.90);

        let noiseM_len = noise(this.branchId * 9.3 + 14.8);
        midLengthDecayVar = this.tree.lengthDecay * 0.85 * (1.0 + (noiseM_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);
        midLengthDecayVar = constrain(midLengthDecayVar, 0.30, 0.90);
      }
      
      let nextThickness = this.maxThickness * this.tree.thicknessDecay;
      let minLen = this.tree.minBranchLength || 10;
      
      if (branchMode === -1 || branchMode === 2 || branchMode === 3) {
        let childAngle = angleRad + rightAngleVar;
        let childLen = this.maxLen * rightLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3, this.depth - 1, this.level + 1, this));
        }
      }
      
      if (branchMode === 3) {
        let childAngle = midAngleVar;
        let childLen = this.maxLen * midLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3 + 1, this.depth - 1, this.level + 1, this));
        }
      }
      
      if (branchMode === 1 || branchMode === 2 || branchMode === 3) {
        let childAngle = -angleRad + leftAngleVar;
        let childLen = this.maxLen * leftLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3 + 2, this.depth - 1, this.level + 1, this));
        }
      }
    }

    sproutSequentialChild(slot) {
      this.slotSprouted[slot] = true;
      this.hasSprouted = true;
      
      let noiseCommon = noise(this.branchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(15) * this.tree.treeVariation;
      
      let noiseRelative = noise(this.branchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(10) * this.tree.treeVariation;
      
      let noiseIndiv = noise(this.branchId * 15.3 + slot * 47.2);
      let indivAngle = (noiseIndiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;
      
      let baseAngle = this.slotAngles[slot];
      let side = (baseAngle === 0) ? 0 : Math.sign(baseAngle);
      let finalAngle = baseAngle + commonTilt + side * relativeAngleVar / 2 + indivAngle;
      
      let noiseLen = noise(this.branchId * 8.9 + slot * 29.1);
      let childDecay = this.tree.lengthDecay * (1.0 + (noiseLen - 0.5) * 2 * 0.38 * this.tree.treeVariation);
      
      let noiseAsym = noise(this.branchId * 29.3 + 72.8);
      let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * this.tree.lengthDecay * this.tree.treeVariation;
      
      if (slot === 0) childDecay += lengthBias;
      if (slot === 1) childDecay -= lengthBias;
      if (slot === 2) childDecay *= 0.85;
      
      childDecay = constrain(childDecay, 0.30, 0.90);
      
      let childLen = this.maxLen * childDecay;
      let minLen = this.tree.minBranchLength || 10;
      if (childLen < minLen) return;

      let nextThickness = this.maxThickness * this.tree.thicknessDecay;
      let childId = this.branchId * 4 + slot;
      let childNode = new BranchNode(this.tree, childLen, nextThickness, finalAngle, childId, this.depth - 1, this.level + 1, this);
      
      this.children.push(childNode);
      
      if (slot === 0) {
        this.firstSproutedTime = this.tree.animationTime;
      }
    }
    
    isSubtreeFinished() {
      if (this.currentLen < this.maxLen) return false;
      
      let isLastLevel = (this.level >= this.terminalLevel);
      if (this.level >= 5 && !isLastLevel) {
        if (this.sideLeafTimer < 1.0) return false;
      }
      
      if (this.level < this.terminalLevel) {
        if (this.tree.treeType === 'sequential') {
          for (let i = 0; i < this.maxSequentialBranches; i++) {
            if (!this.slotSprouted[i]) return false;
          }
        } else {
          if (!this.hasSprouted) return false;
        }
      }
      
      for (let child of this.children) {
        if (!child.isSubtreeFinished()) return false;
      }
      return true;
    }
    
    getTreeGrowthProgress() {
      let currentLenTotal = this.currentLen;
      let maxLenTotal = this.maxLen;

      for (let child of this.children) {
        let childProgress = child.getTreeGrowthProgress();
        currentLenTotal += childProgress.current;
        maxLenTotal += childProgress.target;
      }

      return { current: currentLenTotal, target: maxLenTotal };
    }

    draw(time) {
      push();
      
      let swayAngle = 0;
      if (this.tree.windStrength > 0 && this.level > 0) {
        swayAngle = sin(time + this.depth * 0.4) * (this.tree.windStrength * 0.006) * (this.tree.maxDepth - this.depth + 1);
      }
      
      let renderAngle = this.angle;
      rotate(renderAngle + swayAngle);

      this.tree.setBranchGradient(this.depth, this.currentLen);
      noStroke();

      let d_base = this.maxDrawnThickness;
      let d_tip;
      if (this.children.length > 0) {
        let maxChildThickness = 0;
        for (let child of this.children) {
          maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
        }
        d_tip = max(maxChildThickness, 1.0);
      } else {
        // Taper tip to 1.2px when unbranched to fit slender leaf petiole
        d_tip = 1.2;
      }

      ellipse(0, 0, d_base, d_base);
      ellipse(0, -this.currentLen, d_tip, d_tip);

      let w_base = d_base / 2;
      let w_tip = d_tip / 2;

      beginShape();
      vertex(-w_base, 0);
      vertex(-w_tip, -this.currentLen);
      vertex(w_tip, -this.currentLen);
      vertex(w_base, 0);
      endShape(CLOSE);
      
      let isLastLevel = (this.level >= this.terminalLevel);
      if (this.level >= 5 && !isLastLevel) {
        let progress = this.currentLen / this.maxLen;
        if (progress > 0.3) {
          let sideLeafHash = (Math.abs(Math.sin(this.branchId * 74.3 + 12.9)) * 1000) % 1;
          let sideLeafCount = floor(sideLeafHash * 5); // Generates 0 to 4 leaves per branch
          
          for (let k = 0; k < sideLeafCount; k++) {
            let leafHash = (Math.abs(Math.sin(this.branchId * 91.4 + k * 33.7)) * 1000) % 1;
            let isEarlyLeaf = (leafHash < 0.35);
            
            let t;
            if (isEarlyLeaf) {
              t = map(progress, 0.3, 0.9, 0, 1, true);
            } else {
              t = map(this.sideLeafTimer, 0, 1.0, 0, 1, true);
            }
            
            if (t > 0) {
              let stemLength = this.tree.initLength * Math.pow(this.tree.lengthDecay, this.terminalLevel);
              let lenMultiplier = 0.1 + leafHash * 0.8;
              
              let currentStemLen = stemLength * lenMultiplier * Math.max(0.3, t);
              let leafScale = lerp(0.45, 1.0, t);
              
              // Dynamic position ratio along the branch (15% to 90% of branch length)
              let ratio = (sideLeafCount === 1) ? 0.50 : (0.15 + (k / (sideLeafCount - 1)) * 0.75);
              let side = (k % 2 === 0) ? -1 : 1;
              
              let angleHash = (Math.abs(Math.sin(this.branchId * 66.2 + k * 41.7)) * 1000) % 1;
              let leafAngle = side * radians(20 + angleHash * 35);
              
              push();
              translate(0, -this.currentLen * ratio);
              rotate(leafAngle);
              
              let stemColor = this.tree.getBranchColorAtDepth(this.depth);
              stroke(stemColor);
              strokeWeight(d_tip * 0.4);
              line(0, 0, 0, -currentStemLen);
              noStroke();
              
              translate(0, -currentStemLen);
              if (leafScale > 0) {
                push();
                scale(leafScale * this.leafScaleFactor * 1.35);
                this.tree.drawSingleLeaf(this.branchId * 10 + k, 1.0, this.depth, time, false, false);
                pop();
              }
              pop();
            }
          }
        }
      }

      translate(0, -this.currentLen);
      if (this.tree.treeType === 'sequential' && this.tipLeanAngle) {
        rotate(this.tipLeanAngle);
      }

        let progress = this.currentLen / this.maxLen;
        let sproutProgress = 0.50;
        isLastLevel = (this.level >= this.terminalLevel);
        if (isLastLevel) {
          if (this.leavesProgress > 0) {
            push();
            scale(this.leavesProgress * this.leafScaleFactor);
            this.tree.drawLeafAtTip(this.branchId, true, this.depth, time);
            pop();
          }
        } else {
          if (this.leavesProgress > 0) {
              let angleRad = radians(this.tree.branchAngle);
              let extraLeafAngle = radians(10);
              
              let noiseCommon = noise(this.branchId * 17.5 + 44.8);
              let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.tree.treeVariation;
              let noiseRelative = noise(this.branchId * 14.2 + 93.1);
              let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.tree.treeVariation;
              
              let leftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraLeafAngle;
              let rightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraLeafAngle;
              let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
              let midAngle = (noiseM_angle - 0.5) * 2 * radians(15) * this.tree.treeVariation;

              // Random 1 to 3 sprout leaves per node junction (1, 2, or 3)
              let sproutLeafCount = 1 + floor(hashRand(this.branchId, 88) * 3);

              let leafItems = [];
              if (sproutLeafCount === 1) {
                let delayM = 0.3 + hashRand(this.branchId * 3 + 1, 81) * 1.7; // Independent delay 0.3s to 2.0s
                leafItems.push({ key: 'M', id: this.branchId * 3 + 1, angle: midAngle, delay: delayM });
              } else if (sproutLeafCount === 2) {
                let delayL = 0.3 + hashRand(this.branchId * 3 + 2, 81) * 1.7;
                let delayR = 0.3 + hashRand(this.branchId * 3 + 0, 82) * 1.7;
                leafItems.push({ key: 'L', id: this.branchId * 3 + 2, angle: leftAngle, delay: delayL });
                leafItems.push({ key: 'R', id: this.branchId * 3 + 0, angle: rightAngle, delay: delayR });
              } else {
                let delayL = 0.3 + hashRand(this.branchId * 3 + 2, 81) * 1.7;
                let delayM = 0.3 + hashRand(this.branchId * 3 + 1, 82) * 1.7;
                let delayR = 0.3 + hashRand(this.branchId * 3 + 0, 83) * 1.7;
                leafItems.push({ key: 'L', id: this.branchId * 3 + 2, angle: leftAngle, delay: delayL });
                leafItems.push({ key: 'M', id: this.branchId * 3 + 1, angle: midAngle, delay: delayM });
                leafItems.push({ key: 'R', id: this.branchId * 3 + 0, angle: rightAngle, delay: delayR });
              }

              // Use tree.animationTime for simulation age, while using time argument for wind sway
              let simTime = (this.tree && typeof this.tree.animationTime === 'number') ? this.tree.animationTime : time;
              let elapsedSinceFull = Math.max(0, simTime - this.lenFullTime);

              // Measure exact World/Screen coordinates of current branch tip (canvas origin is at tip)
              let m = drawingContext.getTransform();
              let worldAngle = Math.atan2(m.b, m.a);

              let maxD = Math.max(this.tree.maxDepth || 6, 1);
              let levelRatio = constrain(this.level / maxD, 0, 1);
              // Sprout leaves scale smoothly from 2.0x at root to 0.8x at top tips
              let sproutSizeMultiplier = lerp(2.0, 0.8, levelRatio);

              let drawL = false, drawM = false, drawR = false;

              if (simTime < this.lenFullTime) {
                // Stage 1: Primary Branch Elongation
                // First 30% of branch length -> leaf grows 0 to 50% size
                // Remaining 70% of branch length -> leaf grows 50% to 100% size
                drawL = leafItems.some(it => it.key === 'L');
                drawM = leafItems.some(it => it.key === 'M');
                drawR = leafItems.some(it => it.key === 'R');
                let p = constrain(this.leavesProgress, 0, 1);
                let sproutScale;
                if (p <= 0.30) {
                  sproutScale = 0.50 * Math.pow(p / 0.30, 0.7);
                } else {
                  sproutScale = lerp(0.50, 1.00, (p - 0.30) / 0.70);
                }

                push();
                scale(sproutScale * sproutSizeMultiplier);
                this.tree.drawSproutLeaves(this.branchId, leftAngle, rightAngle, midAngle, this.depth, time, drawL, drawM, drawR);
                pop();
              } else {
                // Stage 2: Maturing & Staggered Falling stage (leaves stay steady at 100% size)
                for (let item of leafItems) {
                  if (elapsedSinceFull < item.delay) {
                    if (item.key === 'L') drawL = true;
                    if (item.key === 'M') drawM = true;
                    if (item.key === 'R') drawR = true;
                  } else {
                    let t_f = elapsedSinceFull - item.delay;
                    let canvasH = (typeof height !== 'undefined' && height > 0) ? height : (typeof window !== 'undefined' ? window.innerHeight : 800);
                    let distToBottom = Math.max(150, canvasH - m.f + 30); // Rơi qua mép màn hình 30px chạm đất
                    let tau_fall = Math.max(2.0, distToBottom / 100.0);   // Thời gian rơi thong thả đến tận đất

                    if (t_f < tau_fall) {
                      let fallProgress = t_f / tau_fall;

                      // Quỹ đạo rơi thẳng đứng xuống tận mặt đất + Chao đảo gió ngang
                      let fallY = distToBottom * fallProgress;
                      let spinAmp = 12.0 + hashRand(item.id, 93) * 18.0;
                      let fallX = sin(t_f * 3.2 + item.id * 5.1) * spinAmp * Math.sin(fallProgress * Math.PI);

                      // Chuyển đổi ma trận tọa độ ngược về thế giới
                      let localX = fallX * Math.cos(worldAngle) + fallY * Math.sin(worldAngle);
                      let localY = -fallX * Math.sin(worldAngle) + fallY * Math.cos(worldAngle);

                      // Xoay lá xoay nhẹ nhàng êm ái theo thời gian
                      let spinDir = (hashRand(item.id, 91) > 0.5 ? 1 : -1);
                      let spinSpeed = (0.6 + hashRand(item.id, 92) * 1.4) * spinDir;
                      let currentAngle = item.angle + t_f * spinSpeed;

                      push();
                      drawingContext.save(); // Save canvas state
                      // Giữ lá rõ nét 100% suốt hành trình, chỉ mờ dần ở 8% cuối khi chạm hẳn xuống đất
                      let alphaVal = (fallProgress > 0.92) ? map(fallProgress, 0.92, 1.0, 1.0, 0.0, true) : 1.0;
                      drawingContext.globalAlpha = Math.max(0, alphaVal);
                      translate(localX, localY);
                      rotate(currentAngle);
                      scale(1.00 * sproutSizeMultiplier);
                      // drawPetiole = false (chỉ vẽ chiếc lá rụng, không vẽ cuống)
                      this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, false);
                      drawingContext.restore();
                      pop();
                    }
                  }
                }

                // Draw remaining attached leaves (steady at 100% full size)
                if (drawL || drawM || drawR) {
                  let sproutScale = 1.00;
                  push();
                  scale(sproutScale * sproutSizeMultiplier);
                  this.tree.drawSproutLeaves(this.branchId, leftAngle, rightAngle, midAngle, this.depth, time, drawL, drawM, drawR);
                  pop();
                }
              }
            }
          }

      for (let child of this.children) {
        child.draw(time);
      }
      
      pop();
    }
  }

  class FractalBranchTree {
    constructor(params = {}) {
      this.initLength = 200;
      this.branchAngle = 20;
      this.lengthDecay = 0.75;
      this.initThickness = 30;
      this.thicknessDecay = 0.66;
      this.maxDepth = 9;
      this.treeVariation = 0.80;
      this.leafType = 'emerald';
      this.leafShape = 'auto';
      this.minBranchLength = 15;
      this.windStrength = 1.0;
      this.colorTheme = 'cyberpunk';
      this.seed = Math.floor(Math.random() * 1000000);

      this.setParams(params);
      this.rebuild();
    }

    setParams(params = {}) {
      if (params.initLength !== undefined && !isNaN(params.initLength)) this.initLength = params.initLength;
      if (params.branchAngle !== undefined && !isNaN(params.branchAngle)) this.branchAngle = params.branchAngle;
      if (params.lengthDecay !== undefined && !isNaN(params.lengthDecay)) this.lengthDecay = params.lengthDecay;
      if (params.initThickness !== undefined && !isNaN(params.initThickness)) this.initThickness = params.initThickness;
      if (params.thicknessDecay !== undefined && !isNaN(params.thicknessDecay)) this.thicknessDecay = params.thicknessDecay;
      if (params.maxDepth !== undefined && !isNaN(params.maxDepth)) this.maxDepth = params.maxDepth;
      if (params.minBranchLength !== undefined && !isNaN(params.minBranchLength)) this.minBranchLength = params.minBranchLength;
      if (params.treeVariation !== undefined && !isNaN(params.treeVariation)) this.treeVariation = params.treeVariation;
      if (params.leafType !== undefined && params.leafType) this.leafType = params.leafType;
      if (params.leafShape !== undefined && params.leafShape) this.leafShape = params.leafShape;
      if (params.treeType !== undefined && params.treeType) this.treeType = params.treeType;
      if (params.windStrength !== undefined && !isNaN(params.windStrength)) this.windStrength = params.windStrength;
      if (params.colorTheme !== undefined && params.colorTheme) this.colorTheme = params.colorTheme;
      if (params.seed !== undefined && !isNaN(params.seed)) this.seed = params.seed;
    }

    rebuild() {
      let colorHash = (Math.abs(Math.sin(this.seed * 19.87 + 4.56)) * 1000) % 1;
      if (colorHash < 0.05) {
        this.treeFlowerColor = 'purple';
      } else if (colorHash < 0.525) {
        this.treeFlowerColor = 'red';
      } else {
        this.treeFlowerColor = 'yellow';
      }

      noiseSeed(this.seed);
      randomSeed(this.seed);

      // Create initial tree hierarchy
      this.root = new BranchNode(this, this.initLength, 30, 0, 1, this.maxDepth, 0);

      // Pre-measure geometry bounding box
      let bounds = this.root.measureGeometry(0, 0, 0);
      let treeH = Math.abs(bounds.minY);
      let treeW = bounds.maxX - bounds.minX;
      let treeScale = 0.65 * treeH + 0.35 * (treeW / 2);

      // Calculate golden ratio proportional root thickness (scaled down 20%) with direct +-20% random variation
      let autoThickness = treeScale * 0.092;
      let thicknessNoise = noise(this.seed * 0.317 + 88.4);
      let noiseFactor = 1.0 + (thicknessNoise - 0.5) * 2 * 0.20 * Math.max(0.5, this.treeVariation);
      autoThickness *= noiseFactor;

      autoThickness = constrain(autoThickness, treeH * 0.05, treeH * 0.14);
      autoThickness = max(8, autoThickness);

      this.initThickness = autoThickness;
      this.root.maxThickness = autoThickness;
      this.root.applyAutoThickness();

      this.animationTime = 0;
      this.totalGrowthTime = this.root ? this.root.calculateTimeline(0) : 5.0;
      if (this.root) {
        this.root.updateTime(0, this.totalGrowthTime);
      }
    }

    getTotalGrowthTime() {
      return this.totalGrowthTime || 5.0;
    }

    update(dt) {
      if (!this.root) return;
      this.animationTime += dt;
      this.root.updateTime(this.animationTime, this.totalGrowthTime);
    }

    draw(p, options = {}) {
      if (!this.root) return;
      let time;
      if (typeof p === 'number') {
        time = p;
      } else if (options && options.time !== undefined) {
        time = options.time;
      } else {
        time = frameCount * 0.015;
      }
      this.root.draw(time);
    }

    isSubtreeFinished() {
      return this.animationTime >= this.getTotalGrowthTime();
    }

    getTreeGrowthProgress() {
      let total = this.getTotalGrowthTime();
      return { current: Math.min(this.animationTime, total), target: total };
    }

    setBranchGradient(depth, branchLen) {
      let progressStart = (this.maxDepth - depth) / this.maxDepth;
      let progressEnd = (this.maxDepth - max(depth - 1, 0)) / this.maxDepth;
      let colStart, colEnd;
      
      switch(this.colorTheme) {
        case 'sakura':
          colStart = lerpColor(color(54, 38, 30), color(244, 143, 177), progressStart);
          colEnd = lerpColor(color(54, 38, 30), color(244, 143, 177), progressEnd);
          break;
        case 'autumn':
          colStart = lerpColor(color(24, 20, 18), color(245, 158, 11), progressStart);
          colEnd = lerpColor(color(24, 20, 18), color(245, 158, 11), progressEnd);
          break;
        case 'emerald':
          colStart = lerpColor(color(45, 34, 25), color(85, 115, 70), progressStart);
          colEnd = lerpColor(color(45, 34, 25), color(85, 115, 70), progressEnd);
          break;
        case 'cyberpunk':
        default:
          colStart = lerpColor(color(24, 18, 59), color(236, 72, 153), progressStart);
          colEnd = lerpColor(color(24, 18, 59), color(236, 72, 153), progressEnd);
          break;
      }

      let ctx = drawingContext;
      let grad = ctx.createLinearGradient(0, 0, 0, -branchLen);
      
      let r1 = (colStart && colStart.levels) ? colStart.levels[0] : (typeof red === 'function' ? red(colStart) : 24);
      let g1 = (colStart && colStart.levels) ? colStart.levels[1] : (typeof green === 'function' ? green(colStart) : 18);
      let b1 = (colStart && colStart.levels) ? colStart.levels[2] : (typeof blue === 'function' ? blue(colStart) : 59);
      let a1 = (colStart && colStart.levels) ? (colStart.levels[3] / 255) : 1;

      let r2 = (colEnd && colEnd.levels) ? colEnd.levels[0] : (typeof red === 'function' ? red(colEnd) : 236);
      let g2 = (colEnd && colEnd.levels) ? colEnd.levels[1] : (typeof green === 'function' ? green(colEnd) : 72);
      let b2 = (colEnd && colEnd.levels) ? colEnd.levels[2] : (typeof blue === 'function' ? blue(colEnd) : 153);
      let a2 = (colEnd && colEnd.levels) ? (colEnd.levels[3] / 255) : 1;

      let startRGBA = `rgba(${r1}, ${g1}, ${b1}, ${a1})`;
      let endRGBA = `rgba(${r2}, ${g2}, ${b2}, ${a2})`;
      
      grad.addColorStop(0, startRGBA);
      grad.addColorStop(1, endRGBA);
      ctx.strokeStyle = grad;
      ctx.fillStyle = grad;
    }

    getBranchColorAtDepth(depth) {
      let progress = (this.maxDepth - depth) / this.maxDepth;
      if (this.colorTheme === 'sakura') {
        return lerpColor(color(54, 38, 30), color(244, 143, 177), progress);
      } else if (this.colorTheme === 'autumn') {
        return lerpColor(color(24, 20, 18), color(245, 158, 11), progress);
      } else if (this.colorTheme === 'emerald') {
        return lerpColor(color(45, 34, 25), color(85, 115, 70), progress);
      } else {
        return lerpColor(color(24, 18, 59), color(236, 72, 153), progress);
      }
    }

    getEffectiveLeafShape() {
      if (this.leafShape && this.leafShape !== 'auto') {
        return this.leafShape;
      }
      switch(this.leafType) {
        case 'ginkgo': return 'ginkgo_fan';
        case 'autumn': return 'maple';
        case 'sakura': return 'sakura_leaf';
        case 'frost': return 'needle';
        case 'sunset': return 'maple';
        case 'wisteria': return 'pointed';
        case 'midnight': return 'pointed';
        case 'emerald':
        default: return 'pointed';
      }
    }

    drawPointedLobe(w, h) {
      beginShape();
      vertex(0, 0);
      bezierVertex(-w * 0.7, -h * 0.3, -w * 0.6, -h * 0.8, 0, -h * 1.1);
      bezierVertex(w * 0.6, -h * 0.8, w * 0.7, -h * 0.3, 0, 0);
      endShape(CLOSE);
    }

    drawRhombusLobe(w, h) {
      beginShape();
      vertex(0, 0);
      vertex(-w * 0.5, -h * 0.55);
      vertex(0, -h * 1.15);
      vertex(w * 0.5, -h * 0.55);
      endShape(CLOSE);
    }

    drawSingleLeafShape(shapeType, baseW = 7, baseH = 14) {
      if (shapeType === 'pointed') {
        this.drawPointedLobe(baseW, baseH);
      } else if (shapeType === 'needle') {
        // 7-Needle Fan Pine Cluster (Lá thông 7 chân xòe quạt)
        let strokeCol;
        if (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') {
          strokeCol = drawingContext.fillStyle;
        } else {
          strokeCol = color(50, 200, 150);
        }
        stroke(strokeCol);
        strokeWeight(1.4);

        // 7 Pine needles radiating symmetrically like a fan from petiole origin (0, 0)
        line(0, 0, -baseW * 0.89, -baseH * 0.16);  // Kim 1 (ngoài cùng trái -70 deg, ngắn 35% kim trung tâm)
        line(0, 0, -baseW * 1.18, -baseH * 0.55);  // Kim 2 (ngoài trái -47 deg, ngắn 60% kim trung tâm)
        line(0, 0, -baseW * 0.81, -baseH * 1.00);  // Kim 3 (giữa trái -22 deg, ngắn 80% kim trung tâm)
        line(0, 0, 0, -baseH * 1.35);               // Kim 4 (đỉnh trung tâm 0 deg, 100% chiều dài)
        line(0, 0, baseW * 0.81, -baseH * 1.00);   // Kim 5 (giữa phải +22 deg, ngắn 80% kim trung tâm)
        line(0, 0, baseW * 1.18, -baseH * 0.55);   // Kim 6 (ngoài phải +47 deg, ngắn 60% kim trung tâm)
        line(0, 0, baseW * 0.89, -baseH * 0.16);   // Kim 7 (ngoài cùng phải +70 deg, ngắn 35% kim trung tâm)

        // Petiole sheath cap at base (0, 0)
        fill(40, 30, 20, 200);
        noStroke();
        ellipse(0, 0, 3.5, 3.5);
      } else if (shapeType === 'maple') {
        // Redrawn 7-Lobe Composite Maple Leaf (Lá Phong 7 thùy đỉnh nhọn): Radiating from petiole origin (0, 0)
        let w = baseW * 1.4;
        let h = baseH * 1.4;

        // 1. Central Peak Lobe (1 thùy đỉnh chĩa thẳng lên trên)
        this.drawPointedLobe(w * 0.75, h * 1.1);

        // 2. Upper Shoulder Lobes (2 thùy vai chĩa nghiêng lên 2 bên +-40 deg)
        push();
        rotate(radians(-40));
        this.drawPointedLobe(w * 0.70, h * 1.0);
        pop();

        push();
        rotate(radians(40));
        this.drawPointedLobe(w * 0.70, h * 1.0);
        pop();

        // 3. Side Horizontal Lobes (2 thùy ngang nhỏ hơn chĩa sang 2 bên +-80 deg)
        push();
        rotate(radians(-80));
        this.drawPointedLobe(w * 0.55, h * 0.80);
        pop();

        push();
        rotate(radians(80));
        this.drawPointedLobe(w * 0.55, h * 0.80);
        pop();

        // 4. Rear Lobes (2 thùy sau nhỏ hơn nữa chĩa ra đằng sau +-135 deg)
        push();
        rotate(radians(-135));
        this.drawPointedLobe(w * 0.40, h * 0.55);
        pop();

        push();
        rotate(radians(135));
        this.drawPointedLobe(w * 0.40, h * 0.55);
        pop();
      } else if (shapeType === 'maple5') {
        // 7-Lobe Rhombus Maple Leaf (Lá Phong 7 thùy hình thoi xòe quạt)
        let w = baseW * 1.4;
        let h = baseH * 1.4;

        // 1. Central Top Rhombus Lobe (1 thùy chính đỉnh chĩa thẳng 0 deg)
        this.drawRhombusLobe(w * 0.80, h * 1.15);

        // 2. Upper Side Rhombus Lobes (2 thùy vai nghiêng 2 bên +-38 deg)
        push();
        rotate(radians(-38));
        this.drawRhombusLobe(w * 0.70, h * 0.95);
        pop();

        push();
        rotate(radians(38));
        this.drawRhombusLobe(w * 0.70, h * 0.95);
        pop();

        // 3. Lower Side Rhombus Lobes (2 thùy dưới nghiêng +-78 deg)
        push();
        rotate(radians(-78));
        this.drawRhombusLobe(w * 0.44, h * 0.60);
        pop();

        push();
        rotate(radians(78));
        this.drawRhombusLobe(w * 0.44, h * 0.60);
        pop();

        // 4. Rear Base Lobes (1 cặp thùy sát gốc +-128 deg, dài bằng 33% thùy chính)
        push();
        rotate(radians(-128));
        this.drawRhombusLobe(w * 0.41, h * 0.38);
        pop();

        push();
        rotate(radians(128));
        this.drawRhombusLobe(w * 0.41, h * 0.38);
        pop();
      } else if (shapeType === 'ginkgo_fan') {
        // Redesigned Ginkgo Leaf (Lá Ngân Hạnh): 4 isosceles triangles (35 deg apex, 6 deg central gap, 2 deg outer gaps), ULTRA-ROUNDED base corners, reduced size (baseH * 0.868)
        let totalTriangles = 4;
        let baseLen = baseH * 0.868;

        // Symmetric placement with 6 deg central gap ([-3 deg, +3 deg]):
        // T1 (Outer Left): center -57.5 deg, rays [-75 deg, -40 deg]
        // T2 (Inner Left): center -20.5 deg, rays [-38 deg, -3 deg]
        // T3 (Inner Right): center +20.5 deg, rays [+3 deg, +38 deg]
        // T4 (Outer Right): center +57.5 deg, rays [+40 deg, +75 deg]
        let triangles = [
          { center: -57.5, left: -75.0, right: -40.0 },
          { center: -20.5, left: -38.0, right: -3.0 },
          { center: 20.5,  left: 3.0,   right: 38.0 },
          { center: 57.5,  left: 40.0,  right: 75.0 }
        ];

        for (let k = 0; k < totalTriangles; k++) {
          let tInfo = triangles[k];
          let aCenter = radians(tInfo.center);
          let aLeft = radians(tInfo.left);
          let aRight = radians(tInfo.right);

          let envelopeFactor = Math.cos(radians(tInfo.center) * 0.45);
          let triLen = baseLen * (0.78 + 0.22 * envelopeFactor);

          // Điểm kết thúc cạnh bên trái & bắt đầu bo tròn SIÊU LỚN (Gấp 4-5 lần: bắt đầu bo từ 48% chiều dài)
          let aSideL = aLeft - radians(2.0);
          let x_sideL = sin(aSideL) * triLen * 0.48;
          let y_sideL = -cos(aSideL) * triLen * 0.48;

          // Tiếp tuyến cạnh bên trái từ gốc (0, 0)
          let cp1L_x = sin(aLeft) * triLen * 0.22;
          let cp1L_y = -cos(aLeft) * triLen * 0.22;

          let cp2L_x = sin(aSideL) * triLen * 0.38;
          let cp2L_y = -cos(aSideL) * triLen * 0.38;

          // Vòm bo tròn khổng lồ cho góc đáy trái (Ultra Large Corner Arc: gấp 4-5 lần)
          let x_cornerL_c1 = sin(aLeft - radians(6.0)) * triLen * 0.85;
          let y_cornerL_c1 = -cos(aLeft - radians(6.0)) * triLen * 0.85;

          let aBaseL = aLeft + radians(11.5);
          let x_baseL = sin(aBaseL) * triLen * 0.95;
          let y_baseL = -cos(aBaseL) * triLen * 0.95;

          let x_cornerL_c2 = sin(aLeft + radians(3.0)) * triLen * 1.14;
          let y_cornerL_c2 = -cos(aLeft + radians(3.0)) * triLen * 1.14;

          // Vòm bo tròn khổng lồ cho góc đáy phải (Ultra Large Corner Arc: gấp 4-5 lần)
          let aSideR = aRight + radians(2.0);
          let x_sideR = sin(aSideR) * triLen * 0.48;
          let y_sideR = -cos(aSideR) * triLen * 0.48;

          let aBaseR = aRight - radians(11.5);
          let x_baseR = sin(aBaseR) * triLen * 0.95;
          let y_baseR = -cos(aBaseR) * triLen * 0.95;

          let x_cornerR_c1 = sin(aRight - radians(3.0)) * triLen * 1.14;
          let y_cornerR_c1 = -cos(aRight - radians(3.0)) * triLen * 1.14;

          let x_cornerR_c2 = sin(aRight + radians(6.0)) * triLen * 0.85;
          let y_cornerR_c2 = -cos(aRight + radians(6.0)) * triLen * 0.85;

          // Tiếp tuyến cạnh bên phải về gốc (0, 0)
          let cp2R_x = sin(aSideR) * triLen * 0.38;
          let cp2R_y = -cos(aSideR) * triLen * 0.38;

          let cp1R_x = sin(aRight) * triLen * 0.22;
          let cp1R_y = -cos(aRight) * triLen * 0.22;

          // Cạnh đáy lượn hình sin nhẹ ở giữa
          let cp1Base_x = sin(aCenter - radians(4.0)) * triLen * 0.90;
          let cp1Base_y = -cos(aCenter - radians(4.0)) * triLen * 0.90;

          let cp2Base_x = sin(aCenter + radians(4.0)) * triLen * 1.02;
          let cp2Base_y = -cos(aCenter + radians(4.0)) * triLen * 1.02;

          beginShape();
          // 1. Đỉnh tam giác tại gốc (0, 0)
          vertex(0, 0);

          // 2. Cạnh bên trái uốn cong lên góc đáy
          bezierVertex(cp1L_x, cp1L_y, cp2L_x, cp2L_y, x_sideL, y_sideL);

          // 3. Bo góc đáy trái SIÊU TRÒN (bán kính gấp 4-5 lần)
          bezierVertex(x_cornerL_c1, y_cornerL_c1, x_cornerL_c2, y_cornerL_c2, x_baseL, y_baseL);

          // 4. Cạnh đáy hình sin lượn nhẹ ở giữa
          bezierVertex(cp1Base_x, cp1Base_y, cp2Base_x, cp2Base_y, x_baseR, y_baseR);

          // 5. Bo góc đáy phải SIÊU TRÒN (bán kính gấp 4-5 lần)
          bezierVertex(x_cornerR_c1, y_cornerR_c1, x_cornerR_c2, y_cornerR_c2, x_sideR, y_sideR);

          // 6. Cạnh bên phải uốn cong về gốc (0, 0)
          bezierVertex(cp2R_x, cp2R_y, cp1R_x, cp1R_y, 0, 0);

          endShape(CLOSE);
        }
      } else if (shapeType === 'heart') {
        // Classic Heart Leaf (Lá Trái Tim): Pointed tip at base (0, 0), two rounded upper lobes dipping into a central cleft notch at (0, -baseH * 0.82)
        beginShape();
        vertex(0, 0);
        bezierVertex(-baseW * 1.1, -baseH * 0.35, -baseW * 1.1, -baseH * 1.1, -baseW * 0.5, -baseH * 1.15);
        bezierVertex(-baseW * 0.25, -baseH * 1.18, -baseW * 0.08, -baseH * 0.92, 0, -baseH * 0.82);
        bezierVertex(baseW * 0.08, -baseH * 0.92, baseW * 0.25, -baseH * 1.18, baseW * 0.5, -baseH * 1.15);
        bezierVertex(baseW * 1.1, -baseH * 1.1, baseW * 1.1, -baseH * 0.35, 0, 0);
        endShape(CLOSE);
      } else if (shapeType === 'single_needle') {
        // Dạng Lá Me / Lá Kép Lông Chim Chẵn (Tăng tiếp 20% kích thước tổng thể, scale: 0.576)
        let totalH = baseH * 2.4 * 0.576;

        // Trục chính lá me (Main rachis stem, kéo dài vừa đủ qua 5 cặp lá)
        push();
        stroke(30, 50, 25, 220);
        strokeWeight(1.0);
        line(0, 0, 0, -totalH * 0.92);
        pop();

        // 5 Cặp lá phụ hình hạt gạo theo tỉ lệ độ dài & góc nghiêng chính xác của người dùng
        const pairs = [
          { yRatio: 0.16, scale: 0.90, angleDeg: 80 }, // #1: độ dài 90%, nghiêng 80°
          { yRatio: 0.34, scale: 0.95, angleDeg: 80 }, // #2: độ dài 95%, nghiêng 80°
          { yRatio: 0.52, scale: 1.00, angleDeg: 75 }, // #3: độ dài 100%, nghiêng 75°
          { yRatio: 0.70, scale: 0.95, angleDeg: 65 }, // #4: độ dài 95%, nghiêng 65°
          { yRatio: 0.86, scale: 0.85, angleDeg: 50 }  // #5: độ dài 85%, nghiêng 50°
        ];

        let baseLeafH = (baseH * 1.15 * 0.80) * 0.576; // Chiều dài lá con bằng 80% và tổng kích thước tăng tiếp 20%
        let baseLeafW = baseLeafH * 0.22;              // Chiều rộng lá oval hạt gạo (tỉ lệ 1/4.5)

        // Viền nét mảnh giữ định hình sắc nét cho hạt gạo
        stroke(20, 45, 20, 160);
        strokeWeight(0.6);

        for (let p of pairs) {
          let y = -totalH * p.yRatio;
          let h = baseLeafH * p.scale;
          let w = baseLeafW * p.scale;
          let angRad = radians(p.angleDeg);

          // Lá phụ bên trái (Left rice-grain leaflet)
          push();
          translate(0, y);
          rotate(-angRad);
          ellipse(0, -h * 0.5, w, h);
          pop();

          // Lá phụ bên phải (Right rice-grain leaflet)
          push();
          translate(0, y);
          rotate(angRad);
          ellipse(0, -h * 0.5, w, h);
          pop();
        }

        noStroke();
      } else if (shapeType === 'tung_lahan') {
        // Lá Tùng La Hán (1 lá giữa thẳng đứng + 4 cặp lá 2 bên xòe quạt bo cong hướng lên trời)
        push();
        
        // 1. Phép chiếu ma trận chính xác 100%: Xoay trục lá CHĨA THẲNG ĐỨNG LÊN TRỜI (Screen Up: -PI/2)
        let m = (typeof drawingContext !== 'undefined') ? drawingContext.getTransform() : null;
        if (m) {
          // Hướng thực tế của trục dọc lá (local -Y) trên màn hình canvas: vx = -m.c, vy = -m.d
          let currentScreenAngle = Math.atan2(-m.d, -m.c);
          // Góc xoay bù để đỉnh lá chĩa thẳng đứng lên trời (-PI/2)
          let correctionAngle = -Math.PI / 2 - currentScreenAngle;
          
          // Thêm độ sai lệch ngẫu nhiên tự nhiên ±15 độ
          let organicNoise = (Math.sin(baseW * 31.7 + baseH * 19.3) - 0.5) * 2 * radians(15);
          rotate(correctionAngle + organicNoise);
        }

        // 2. Màu sắc lá kim Tùng La Hán
        let col = (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') ? drawingContext.fillStyle : color(40, 180, 110);
        stroke(col);
        strokeWeight(1.4);

        // 3. Cấu trúc 9 lá kim: 1 lá giữa thẳng đứng (i=4) + 4 cặp lá 2 bên xòe quạt uốn cong nhẹ hướng lên
        let totalNeedles = 9;
        let maxLen = baseH * 1.8;
        let fanSpread = radians(136); // Góc xòe quạt 136 độ

        for (let i = 0; i < totalNeedles; i++) {
          let t = (i - (totalNeedles - 1) / 2) / ((totalNeedles - 1) / 2); // t từ -1.0 đến +1.0 (t=0 là lá giữa)
          let angle = t * (fanSpread / 2);

          // Tỉ lệ chiều dài: Lá giữa dài nhất, 4 cặp lá 2 bên ngắn dần mượt mà
          let shellEnvelope = Math.cos(t * Math.PI * 0.38);
          let bladeLen = maxLen * (0.55 + 0.45 * shellEnvelope);

          // Tọa độ đỉnh ngọn lá kim
          let tipX = sin(angle) * bladeLen;
          let tipY = -cos(angle) * bladeLen;

          // Uốn cong nhẹ hướng lên trên (Upward bow)
          let bowUp = (1 - Math.abs(t)) * baseW * 0.45 + bladeLen * 0.08;
          let ctrlX = sin(angle * 0.65) * bladeLen * 0.5;
          let ctrlY = -cos(angle * 0.65) * bladeLen * 0.5 - bowUp;

          // Vẽ đường lá kim uốn cong nhẹ hướng lên trời
          noFill();
          beginShape();
          vertex(0, 0);
          quadraticVertex(ctrlX, ctrlY, tipX, tipY);
          endShape();
        }

        // 4. Bao gốc cuống cụm lá (Petiole sheath cap)
        noStroke();
        fill(35, 45, 25, 230);
        ellipse(0, 0, 4.5, 4.5);

        pop();
      } else if (shapeType === 'sakura_leaf') {
        // Lá Anh Đào / Cánh Hoa Anh Đào (Dạng giọt nước với khía chữ V ở đỉnh như miệng cá há)
        let w = baseW * 1.15;
        let h = baseH * 1.25;
        beginShape();
        // Xuất phát từ gốc cuống lá (0, 0)
        vertex(0, 0);
        // Cạnh trái uốn cong bầu dạng giọt nước lên đỉnh trái (-w * 0.42, -h * 1.15)
        bezierVertex(-w * 0.95, -h * 0.35, -w * 0.85, -h * 0.85, -w * 0.42, -h * 1.15);
        // Vết khía chữ V lõm sâu vào lòng lá (miệng cá há) tới vị trí (0, -h * 0.82)
        vertex(0, -h * 0.82);
        // Đèn chéo lên đỉnh phải (w * 0.42, -h * 1.15)
        vertex(w * 0.42, -h * 1.15);
        // Cạnh phải uốn cong bầu về gốc cuống lá (0, 0)
        bezierVertex(w * 0.85, -h * 0.85, w * 0.95, -h * 0.35, 0, 0);
        endShape(CLOSE);
      } else if (shapeType === 'bodhi') {
        // Bodhi leaf (Lá Bồ Đề): Phóng to kích thước gấp rưỡi (1.5x)
        push();
        scale(1.5);
        translate(0, -baseH * 1.05);
        rotate(PI);
        beginShape();
        vertex(0, 0);
        bezierVertex(-baseW * 1.1, -baseH * 0.4, -baseW * 1.3, -baseH * 0.9, -baseW * 0.25, -baseH * 1.05);
        vertex(0, -baseH * 0.85);
        bezierVertex(baseW * 0.25, -baseH * 1.05, baseW * 1.3, -baseH * 0.9, baseW * 1.1, -baseH * 0.4);
        endShape(CLOSE);
        pop();
      } else {
        ellipse(0, -baseH * 0.5, baseW, baseH);
      }
    }

    drawLeafAtTip(branchId, isTerminal = false, depth = 0, time = 0) {
      noStroke();
      
      let hashGlow = (Math.abs(Math.sin(branchId * 12.9898 + 78.233)) * 43758.5453) % 1;
      let isGlowOrb = (this.treeVariation > 0) && (hashGlow < 0.08);

      if (isGlowOrb && isTerminal) {
        let r, g, b;
        if (this.colorTheme === 'cyberpunk') {
          r = 6; g = 182; b = 212;
        } else if (this.colorTheme === 'autumn') {
          r = 239; g = 68; b = 68;
        } else {
          r = 255; g = 215; b = 0;
        }
        
        fill(r, g, b, 0.15);
        ellipse(0, 0, 22, 22);
        fill(r, g, b, 0.4);
        ellipse(0, 0, 12, 12);
        fill(255, 255, 255, 0.95);
        ellipse(0, 0, 5, 5);
        return;
      }
      
      let flowerHash = (Math.abs(Math.sin(branchId * 93.117 + 45.29)) * 43758.5453) % 1;
      let hasFlowers = (this.treeType === 'sequential') && isTerminal && (flowerHash < 0.20);
      
      if (hasFlowers) {
        let clusterHash = (Math.abs(Math.sin(branchId * 61.7 + 12.9)) * 1000) % 1;
        let clusterCount = 2 + floor(clusterHash * 3);
        
        let r, g, b;
        if (this.colorTheme === 'cyberpunk') {
          if (this.treeFlowerColor === 'purple') {
            r = 168; g = 85; b = 247;
          } else if (this.treeFlowerColor === 'red') {
            r = 244; g = 63; b = 94;
          } else {
            r = 250; g = 204; b = 21;
          }
        } else if (this.colorTheme === 'autumn') {
          if (this.treeFlowerColor === 'purple') {
            r = 217; g = 70; b = 239;
          } else if (this.treeFlowerColor === 'red') {
            r = 239; g = 68; b = 68;
          } else {
            r = 251; g = 191; b = 36;
          }
        } else {
          if (this.treeFlowerColor === 'purple') {
            r = 192; g = 132; b = 252;
          } else if (this.treeFlowerColor === 'red') {
            r = 251; g = 113; b = 133;
          } else {
            r = 253; g = 224; b = 71;
          }
        }
        
        for (let i = 0; i < clusterCount; i++) {
          let clusterAngle = (i - (clusterCount - 1) / 2) * radians(15);
          let dist = 12 + i * 8;
          let popHash = (Math.abs(Math.sin(branchId * 33.1 + i * 17.4)) * 1000) % 1;
          let popScale = 0.8 + popHash * 0.4 * this.treeVariation;
          
          push();
          translate(sin(clusterAngle) * dist, dist);
          rotate(clusterAngle);
          scale(popScale);
          
          fill(r, g, b, 0.25);
          ellipse(0, 0, 18, 18);
          fill(r, g, b, 0.6);
          ellipse(0, 0, 11, 11);
          fill(255, 255, 255, 0.9);
          ellipse(0, 0, 5, 5);
          pop();
        }
        return;
      }
      
      let h = hashRand(branchId, 1);
      let w = hashRand(branchId, 2);
      let r = hashRand(branchId, 3);
      let s = hashRand(branchId, 4);
      let rotateOffset = radians((r - 0.5) * 25 * this.treeVariation);
      let scaleBase = 0.55 + s * 0.90 * this.treeVariation; // 0.55x to 1.45x organic leaf size variance
      let lenScale = scaleBase * (0.8 + (h - 0.5) * 0.4 * this.treeVariation);
      let widthScale = scaleBase * (0.8 + (w - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale = 1.0; widthScale = 1.0; }
      let shape = this.getEffectiveLeafShape();

      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let angleRad = radians(this.branchAngle || 20);
      let extraAngle = radians(10);

      let noiseCommon = noise(branchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.treeVariation;
      let noiseRelative = noise(branchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.treeVariation;

      let leftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraAngle;
      let rightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraAngle;

      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (!isTerminal && nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);

      // MurmurHash3 High-Entropy PRNG leaf wind sway calculation (6 to 16 degrees flutter amplitude)
      let swayFreqL = 2.0 + hashRand(branchId, 11) * 2.5;
      let swayAmpL = radians(6 + hashRand(branchId, 12) * 10);
      let leafSwayL = sin(timeVal * swayFreqL + branchId * 5.7) * swayAmpL * windMult;

      let swayFreqR = 2.2 + hashRand(branchId, 13) * 2.5;
      let swayAmpR = radians(6 + hashRand(branchId, 14) * 10);
      let leafSwayR = sin(timeVal * swayFreqR + branchId * 8.3) * swayAmpR * windMult;

      let petioleMult = (shape === 'maple' || shape === 'maple5' || shape === 'ginkgo_fan') ? 2.0 : 1.0;

      if (isTerminal) {
        // Left terminal leaf with slender randomized petiole (no sprout wind flutter for permanent leaves)
        let petioleHashL = hashRand(branchId, 21);
        let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

        push();
        rotate(leftAngle + rotateOffset + leafSwayL);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXL = (shape === 'ginkgo_fan') ? (petioleLenL * 0.20) : (petioleLenL * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXL, -petioleLenL * 0.5, 0, -petioleLenL);
        endShape();
        noStroke();
        translate(0, -petioleLenL);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3 + 2);
        this.drawSingleLeafShape(shape, 7, 14);
        pop();

        // Right terminal leaf with slender randomized petiole (no sprout wind flutter for permanent leaves)
        let petioleHashR = hashRand(branchId, 22);
        let petioleLenR = (4.0 + petioleHashR * 8.0) * petioleMult;

        push();
        rotate(rightAngle + rotateOffset + leafSwayR);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXR = (shape === 'ginkgo_fan') ? (-petioleLenR * 0.20) : (-petioleLenR * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXR, -petioleLenR * 0.5, 0, -petioleLenR);
        endShape();
        noStroke();
        translate(0, -petioleLenR);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3);
        this.drawSingleLeafShape(shape, 7, 14);
        pop();
      } else {
        // Sprout leaves attached to growing branch tip on first 4 levels with extra 10deg outward tilt, randomized petioles & wind flutter
        let petioleHashL = hashRand(branchId, 21);
        let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

        push();
        rotate(leftAngle + rotateOffset + leafSwayL);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXL = (shape === 'ginkgo_fan') ? (petioleLenL * 0.20) : (petioleLenL * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXL, -petioleLenL * 0.5, 0, -petioleLenL);
        endShape();
        noStroke();
        translate(0, -petioleLenL);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3 + 2);
        this.drawSingleLeafShape(shape, 7, 14);
        pop();

        let petioleHashR = hashRand(branchId, 22);
        let petioleLenR = (4.0 + petioleHashR * 8.0) * petioleMult;

        push();
        rotate(rightAngle + rotateOffset + leafSwayR);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXR = (shape === 'ginkgo_fan') ? (-petioleLenR * 0.20) : (-petioleLenR * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXR, -petioleLenR * 0.5, 0, -petioleLenR);
        endShape();
        noStroke();
        translate(0, -petioleLenR);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3);
        this.drawSingleLeafShape(shape, 7, 14);
        pop();
      }
    }

    drawSproutLeaves(branchId, leftAngle, rightAngle, midAngle = 0, depth = 0, time = 0, drawLeft = true, drawMid = true, drawRight = true) {
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
      let petioleMult = (shape === 'maple' || shape === 'maple5') ? 2.0 : 1.0;

      let swayFreqL = 2.0 + hashRand(branchId, 31) * 2.5;
      let swayAmpL = radians(6 + hashRand(branchId, 32) * 10);
      let leafSwayL = sin(timeVal * swayFreqL + branchId * 4.1) * swayAmpL * windMult;

      let swayFreqM = 2.2 + hashRand(branchId, 33) * 2.5;
      let swayAmpM = radians(6 + hashRand(branchId, 34) * 10);
      let leafSwayM = sin(timeVal * swayFreqM + branchId * 6.2) * swayAmpM * windMult;

      let swayFreqR = 2.1 + hashRand(branchId, 35) * 2.5;
      let swayAmpR = radians(6 + hashRand(branchId, 36) * 10);
      let leafSwayR = sin(timeVal * swayFreqR + branchId * 8.4) * swayAmpR * windMult;

      if (drawLeft) {
        let leafIdL = branchId * 3 + 2;
        push();
        rotate(leftAngle);
        this.drawSingleLeaf(leafIdL, 1.0, depth, time, false, true);
        pop();
      }
      
      if (drawMid) {
        let leafIdM = branchId * 3 + 1;
        push();
        rotate(midAngle);
        this.drawSingleLeaf(leafIdM, 1.0, depth, time, false, true);
        pop();
      }
      
      if (drawRight) {
        let leafIdR = branchId * 3 + 0;
        push();
        rotate(rightAngle);
        this.drawSingleLeaf(leafIdR, 1.0, depth, time, false, true);
        pop();
      }
    }

    drawSingleLeaf(branchId, scaleVal, depth = 0, time = 0, isTerminal = false, drawPetiole = true) {
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (!isTerminal && nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
      let petioleMult = (shape === 'maple' || shape === 'maple5' || shape === 'ginkgo_fan') ? 2.0 : 1.0;

      let swayFreq = 2.0 + hashRand(branchId, 71) * 2.5;
      let swayAmp = radians(6 + hashRand(branchId, 72) * 10);
      let leafSway = sin(timeVal * swayFreq + branchId * 6.9) * swayAmp * windMult;

      let h = hashRand(branchId, 73);
      let w = hashRand(branchId, 74);
      let r = hashRand(branchId, 75);
      let s = hashRand(branchId, 76);
      let rotateOffset = radians((r - 0.5) * 25 * this.treeVariation);
      let scaleBase = (0.55 + s * 0.90 * this.treeVariation) * scaleVal;
      let lenScale = scaleBase * (0.8 + (h - 0.5) * 0.4 * this.treeVariation);
      let widthScale = scaleBase * (0.8 + (w - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale = scaleVal; widthScale = scaleVal; }

      let petioleHash = hashRand(branchId, 77);
      let petioleLen = (4.0 + petioleHash * 8.0) * petioleMult;

      push();
      rotate(rotateOffset + leafSway);
      if (drawPetiole) {
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveX = (shape === 'ginkgo_fan') ? (petioleLen * 0.18) : (petioleLen * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveX, -petioleLen * 0.5, 0, -petioleLen);
        endShape();
        noStroke();
        translate(0, -petioleLen);
      }
      scale(widthScale, lenScale);
      this.setLeafFillColor(branchId);
      this.drawSingleLeafShape(shape, 6, 12);
      pop();
    }

    setLeafFillColor(branchId) {
      let hashColor = (Math.abs(Math.sin(branchId * 37.719 + 104.233)) * 98765.4321) % 1;
      
      switch(this.leafType) {
        case 'sakura':
          if (hashColor < 0.33) {
            fill(253, 164, 186, 0.85); // Sakura Pink
          } else if (hashColor < 0.66) {
            fill(244, 114, 182, 0.85); // Soft Magenta
          } else {
            fill(252, 231, 243, 0.90); // Pearl White-Pink
          }
          break;

        case 'autumn':
          if (hashColor < 0.33) {
            fill(220, 38, 38, 0.85); // Autumn Red
          } else if (hashColor < 0.66) {
            fill(245, 158, 11, 0.85); // Amber Gold
          } else {
            fill(180, 83, 9, 0.85); // Deep Orange-brown
          }
          break;

        case 'ginkgo':
          if (hashColor < 0.35) {
            fill(250, 204, 21, 0.88); // Bright Canary Yellow
          } else if (hashColor < 0.70) {
            fill(234, 179, 8, 0.88); // Sun Gold
          } else {
            fill(245, 158, 11, 0.88); // Warm Honey
          }
          break;

        case 'wisteria':
          if (hashColor < 0.33) {
            fill(192, 132, 252, 0.85); // Pastel Lavender
          } else if (hashColor < 0.66) {
            fill(168, 85, 247, 0.85); // Royal Violet
          } else {
            fill(232, 121, 249, 0.85); // Soft Orchid
          }
          break;

        case 'frost':
          if (hashColor < 0.35) {
            fill(56, 189, 248, 0.80); // Ice Cyan
          } else if (hashColor < 0.70) {
            fill(125, 211, 252, 0.85); // Diamond Sky
          } else {
            fill(224, 242, 254, 0.90); // Frozen Crystal
          }
          break;

        case 'sunset':
          if (hashColor < 0.33) {
            fill(244, 63, 94, 0.85); // Coral Red
          } else if (hashColor < 0.66) {
            fill(251, 146, 60, 0.85); // Fiery Peach
          } else {
            fill(251, 191, 36, 0.85); // Golden Flame
          }
          break;

        case 'midnight':
          if (hashColor < 0.35) {
            fill(99, 102, 241, 0.85); // Celestial Indigo
          } else if (hashColor < 0.70) {
            fill(59, 130, 246, 0.85); // Sapphire Blue
          } else {
            fill(129, 140, 248, 0.85); // Neon Violet-Blue
          }
          break;

        case 'emerald':
        default:
          if (hashColor < 0.35) {
            fill(52, 211, 153, 0.80); // Emerald Green
          } else if (hashColor < 0.70) {
            fill(110, 231, 183, 0.85); // Mint Green
          } else {
            fill(5, 150, 105, 0.85); // Deep Forest Green
          }
          break;
      }
    }
  }

  // Export for Browser global & Node/ES module compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FractalBranchTree;
  } else {
    global.FractalBranchTree = FractalBranchTree;
  }
})(typeof window !== 'undefined' ? window : this);
