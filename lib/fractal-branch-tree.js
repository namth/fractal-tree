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

      let minThicknessVal = this.tree.initThickness * Math.pow(this.tree.thicknessDecay, this.tree.maxDepth);
      let maxThicknessVal = this.tree.initThickness;
      let tRatio = (this.maxThickness - minThicknessVal) / Math.max(maxThicknessVal - minThicknessVal, 1.0);
      tRatio = constrain(tRatio, 0, 1);
      
      let levelScale = lerp(1.0, 3.5, tRatio);
      let leafSizeNoise = noise(branchId * 31.4 + 12.9);
      let randomScale = 0.75 + leafSizeNoise * 0.5;
      this.leafScaleFactor = levelScale * randomScale;
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
          let sideLeafCount = 1 + floor(sideLeafHash * 3);
          
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
              
              let currentStemLen, leafScale;
              if (t < 0.5) {
                currentStemLen = map(t, 0, 0.5, 0, stemLength * lenMultiplier);
                leafScale = 0;
              } else {
                currentStemLen = stemLength * lenMultiplier;
                leafScale = map(t, 0.5, 1.0, 0, 1.0);
              }
              
              let ratio = (k === 0) ? 0.35 : (k === 1 ? 0.65 : 0.85);
              let side = (k % 2 === 0) ? -1 : 1;
              
              let angleHash = (Math.abs(Math.sin(this.branchId * 66.2 + k * 41.7)) * 1000) % 1;
              let leafAngle = side * radians(angleHash * 50);
              
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
                scale(leafScale * this.leafScaleFactor * 0.9);
                this.tree.drawLeafAtTip(this.branchId * 10 + k, false, this.depth);
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

      if (this.tree.treeType === 'sequential') {
        let progress = this.currentLen / this.maxLen;
        let sproutProgress = 0.50;
        let isLastLevel = (this.level >= this.terminalLevel);
        if (isLastLevel) {
          if (this.leavesProgress > 0) {
            push();
            scale(this.leavesProgress * this.leafScaleFactor);
            this.tree.drawLeafAtTip(this.branchId, true, this.depth, time);
            pop();
          }
        } else {
          if (this.leavesProgress > 0) {
            if (this.leavesPhase !== 'falling' && this.leavesPhase !== 'gone') {
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
              
              push();
              scale(this.leavesProgress * this.leafScaleFactor);
              this.tree.drawSproutLeaves(this.branchId, leftAngle, rightAngle, midAngle, this.depth, time);
              pop();
            } else if (this.leavesPhase === 'falling') {
              let t_f = this.leavesFallTime;
              let tau_fall = 1.5;
              let fallProgress = t_f / tau_fall;
              
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
              
              push();
              let fallY_L = 150 * fallProgress;
              let fallX_L = -12 - 30 * sin(t_f * 8) * fallProgress;
              let fallRot_L = leftAngle - t_f * 6;
              translate(fallX_L, fallY_L);
              rotate(fallRot_L);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3 + 2, 1.0, this.depth, time);
              pop();

              push();
              let fallY_M = 150 * fallProgress;
              let fallX_M = 20 * sin(t_f * 6 + 1.5) * fallProgress;
              let fallRot_M = midAngle + t_f * 5;
              translate(fallX_M, fallY_M);
              rotate(fallRot_M);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3 + 1, 1.0, this.depth, time);
              pop();

              push();
              let fallY_R = 150 * fallProgress;
              let fallX_R = 12 + 30 * sin(t_f * 8 + 3.14) * fallProgress;
              let fallRot_R = rightAngle + t_f * 6;
              translate(fallX_R, fallY_R);
              rotate(fallRot_R);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3, 1.0, this.depth, time);
              pop();
            }
          }


        }
      } else {
        if (this.leavesProgress > 0) {
          let isLastLevel = (this.level >= this.terminalLevel) || (this.hasSprouted && this.children.length === 0);
          let leafShape = this.tree.getEffectiveLeafShape();

          if (leafShape === 'single_needle' && this.leavesPhase !== 'falling' && this.leavesPhase !== 'gone') {
            // Double leaf quantity on the last 2 terminal levels (8 steps vs 4 steps)
            let isLast2Levels = (this.level >= this.terminalLevel - 1) || (this.depth <= 2);
            let steps = isLast2Levels 
              ? [0.125, 0.25, 0.375, 0.50, 0.625, 0.75, 0.875, 1.00]
              : [0.25, 0.50, 0.75, 1.00];

            for (let s = 0; s < steps.length; s++) {
              let posRatio = steps[s];
              push();
              translate(0, (1.0 - posRatio) * this.currentLen);
              scale(this.leavesProgress * this.leafScaleFactor * 0.85);
              this.tree.drawLeafAtTip(this.branchId * 100 + s, isLastLevel, this.depth, time);
              pop();
            }
          } else if (isLastLevel) {
            push();
            scale(this.leavesProgress * this.leafScaleFactor);
            this.tree.drawLeafAtTip(this.branchId, true, this.depth, time);
            pop();
          } else {
            if (this.leavesPhase !== 'falling' && this.leavesPhase !== 'gone') {
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
              
              push();
              scale(this.leavesProgress * this.leafScaleFactor);
              this.tree.drawSproutLeaves(this.branchId, leftAngle, rightAngle, midAngle, this.depth, time);
              pop();
            } else if (this.leavesPhase === 'falling') {
              let t_f = this.leavesFallTime;
              let tau_fall = 1.5;
              let fallProgress = t_f / tau_fall;
              
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
              
              push();
              let fallY_L = 150 * fallProgress;
              let fallX_L = -12 - 30 * sin(t_f * 8) * fallProgress;
              let fallRot_L = leftAngle - t_f * 6;
              translate(fallX_L, fallY_L);
              rotate(fallRot_L);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3 + 2, 1.0, this.depth, time);
              pop();

              push();
              let fallY_M = 150 * fallProgress;
              let fallX_M = 20 * sin(t_f * 6 + 1.5) * fallProgress;
              let fallRot_M = midAngle + t_f * 5;
              translate(fallX_M, fallY_M);
              rotate(fallRot_M);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3 + 1, 1.0, this.depth, time);
              pop();

              push();
              let fallY_R = 150 * fallProgress;
              let fallX_R = 12 + 30 * sin(t_f * 8 + 3.14) * fallProgress;
              let fallRot_R = rightAngle + t_f * 6;
              translate(fallX_R, fallY_R);
              rotate(fallRot_R);
              scale((1 - fallProgress) * this.leafScaleFactor);
              this.tree.drawSingleLeaf(this.branchId * 3, 1.0, this.depth, time);
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

      this.root = new BranchNode(this, this.initLength, this.initThickness, 0, 1, this.maxDepth, 0);
      this.animationTime = 0;
    }

    update(dt) {
      if (!this.root) return;
      this.root.update(dt);
      this.animationTime += dt;
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
      return this.root ? this.root.isSubtreeFinished() : true;
    }

    getTreeGrowthProgress() {
      return this.root ? this.root.getTreeGrowthProgress() : { current: 0, target: 1 };
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
        case 'sakura': return 'bodhi';
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

    drawSingleLeafShape(shapeType, baseW = 7, baseH = 14) {
      if (shapeType === 'pointed') {
        this.drawPointedLobe(baseW, baseH);
      } else if (shapeType === 'needle') {
        if (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') {
          stroke(drawingContext.fillStyle);
        } else {
          stroke(50, 200, 150);
        }
        strokeWeight(1.5);
        line(0, 0, -baseW * 0.6, -baseH * 1.1);
        line(0, 0, 0, -baseH * 1.25);
        line(0, 0, baseW * 0.6, -baseH * 1.1);
        noStroke();
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
      } else if (shapeType === 'ginkgo_fan') {
        beginShape();
        vertex(0, 0);
        bezierVertex(-baseW * 1.1, -baseH * 0.4, -baseW * 1.3, -baseH * 0.9, -baseW * 0.25, -baseH * 1.05);
        vertex(0, -baseH * 0.85);
        bezierVertex(baseW * 0.25, -baseH * 1.05, baseW * 1.3, -baseH * 0.9, baseW * 1.1, -baseH * 0.4);
        endShape(CLOSE);
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
        // Single Pine Needle (Lá Kim Đơn): A simple clean straight line segment like 3-prong pine needle lines
        let col = drawingContext.fillStyle;
        stroke(col);
        strokeWeight(1.2);
        line(0, 0, 0, -baseH * 1.15);
        noStroke();
      } else if (shapeType === 'bodhi') {
        // Bodhi leaf (Lá Bồ Đề): Ginkgo fan geometry rotated 180 degrees
        push();
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

      let petioleMult = (shape === 'maple') ? 2.0 : 1.0;

      if (isTerminal) {
        // Left terminal leaf with slender randomized petiole (no sprout wind flutter for permanent leaves)
        let petioleHashL = hashRand(branchId, 21);
        let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

        push();
        rotate(leftAngle + rotateOffset + leafSwayL);
        stroke(stemColor);
        strokeWeight(1.2);
        line(0, 0, 0, -petioleLenL);
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
        strokeWeight(1.2);
        line(0, 0, 0, -petioleLenR);
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
        strokeWeight(1.2);
        line(0, 0, 0, -petioleLenL);
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
        strokeWeight(1.2);
        line(0, 0, 0, -petioleLenR);
        noStroke();
        translate(0, -petioleLenR);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3);
        this.drawSingleLeafShape(shape, 7, 14);
        pop();
      }
    }

    drawSproutLeaves(branchId, leftAngle, rightAngle, midAngle = 0, depth = 0, time = 0) {
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
      let petioleMult = (shape === 'maple') ? 2.0 : 1.0;

      let swayFreqL = 2.0 + hashRand(branchId, 31) * 2.5;
      let swayAmpL = radians(6 + hashRand(branchId, 32) * 10);
      let leafSwayL = sin(timeVal * swayFreqL + branchId * 4.1) * swayAmpL * windMult;

      let swayFreqM = 2.2 + hashRand(branchId, 33) * 2.5;
      let swayAmpM = radians(6 + hashRand(branchId, 34) * 10);
      let leafSwayM = sin(timeVal * swayFreqM + branchId * 6.2) * swayAmpM * windMult;

      let swayFreqR = 2.1 + hashRand(branchId, 35) * 2.5;
      let swayAmpR = radians(6 + hashRand(branchId, 36) * 10);
      let leafSwayR = sin(timeVal * swayFreqR + branchId * 8.4) * swayAmpR * windMult;

      push();
      let h_L = hashRand(branchId, 41);
      let w_L = hashRand(branchId, 42);
      let r_L = hashRand(branchId, 43);
      let s_L = hashRand(branchId, 44);
      let rotateOffset_L = radians((r_L - 0.5) * 20 * this.treeVariation);
      let scaleBase_L = 0.55 + s_L * 0.90 * this.treeVariation;
      let lenScale_L = scaleBase_L * (0.8 + (h_L - 0.5) * 0.4 * this.treeVariation);
      let widthScale_L = scaleBase_L * (0.8 + (w_L - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale_L = 1.0; widthScale_L = 1.0; }
      
      let petioleHashL = hashRand(branchId, 45);
      let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

      rotate(leftAngle + rotateOffset_L + leafSwayL);
      stroke(stemColor);
      strokeWeight(1.2);
      line(0, 0, 0, -petioleLenL);
      noStroke();
      translate(0, -petioleLenL);
      scale(widthScale_L, lenScale_L);
      this.setLeafFillColor(branchId * 3 + 2);
      this.drawSingleLeafShape(shape, 6, 12);
      pop();
      
      push();
      let h_M = hashRand(branchId, 51);
      let w_M = hashRand(branchId, 52);
      let r_M = hashRand(branchId, 53);
      let s_M = hashRand(branchId, 54);
      let rotateOffset_M = radians((r_M - 0.5) * 20 * this.treeVariation);
      let scaleBase_M = 0.55 + s_M * 0.90 * this.treeVariation;
      let lenScale_M = scaleBase_M * (0.8 + (h_M - 0.5) * 0.4 * this.treeVariation);
      let widthScale_M = scaleBase_M * (0.8 + (w_M - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale_M = 1.0; widthScale_M = 1.0; }
      
      let petioleHashM = hashRand(branchId, 55);
      let petioleLenM = (4.0 + petioleHashM * 8.0) * petioleMult;

      rotate(midAngle + rotateOffset_M + leafSwayM);
      stroke(stemColor);
      strokeWeight(1.2);
      line(0, 0, 0, -petioleLenM);
      noStroke();
      translate(0, -petioleLenM);
      scale(widthScale_M, lenScale_M);
      this.setLeafFillColor(branchId * 3 + 1);
      this.drawSingleLeafShape(shape, 6, 12);
      pop();
      
      push();
      let h_R = hashRand(branchId, 61);
      let w_R = hashRand(branchId, 62);
      let r_R = hashRand(branchId, 63);
      let s_R = hashRand(branchId, 64);
      let rotateOffset_R = radians((r_R - 0.5) * 20 * this.treeVariation);
      let scaleBase_R = 0.55 + s_R * 0.90 * this.treeVariation;
      let lenScale_R = scaleBase_R * (0.8 + (h_R - 0.5) * 0.4 * this.treeVariation);
      let widthScale_R = scaleBase_R * (0.8 + (w_R - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale_R = 1.0; widthScale_R = 1.0; }
      
      let petioleHashR = hashRand(branchId, 65);
      let petioleLenR = (4.0 + petioleHashR * 8.0) * petioleMult;

      rotate(rightAngle + rotateOffset_R + leafSwayR);
      stroke(stemColor);
      strokeWeight(1.2);
      line(0, 0, 0, -petioleLenR);
      noStroke();
      translate(0, -petioleLenR);
      scale(widthScale_R, lenScale_R);
      this.setLeafFillColor(branchId * 3);
      this.drawSingleLeafShape(shape, 6, 12);
      pop();
    }

    drawSingleLeaf(branchId, scaleVal, depth = 0, time = 0, isTerminal = false) {
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (!isTerminal && nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
      let petioleMult = (shape === 'maple') ? 2.0 : 1.0;

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
      stroke(stemColor);
      strokeWeight(1.2);
      line(0, 0, 0, -petioleLen);
      noStroke();
      translate(0, -petioleLen);
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
