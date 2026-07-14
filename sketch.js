// Global variables for control inputs
let initLength;
let branchAngle;
let lengthDecay;
let initThickness;
let thicknessDecay;
let maxDepth;
let treeVariation;
let drawLeaves;
let leafType;
let windSway;
let windStrength;
let colorTheme;
let treeType = 'hybrid'; // Default to hybrid tree type
let treeFlowerColor = 'yellow'; // Determined once per tree based on treeSeed

// Fern specific global parameters
let fernFrondCount = 5;
let fernSpreadAngle = 45;
let fernLeafletLength = 75;
let fernLeafletWidth = 100;
let fernTaperProfile = 1.2;
let fernBranchPoints = 8;
let fernAlternateRate = 0;

// Parameter storage state for tree types
let paramState = {
  shared: {
    initLength: 200,
    branchAngle: 20,
    lengthDecay: 0.75,
    initThickness: 30,
    thicknessDecay: 0.75,
    maxDepth: 9,
    treeVariation: 0.80,
    leafType: 'emerald',
    windStrength: 1.0,
    colorTheme: 'cyberpunk',
    growthSpeed: 1.0
  },
  'barnsley-fern': {
    initLength: 640,
    initThickness: 4,
    maxDepth: 3,
    treeVariation: 0.15,
    windStrength: 1.0,
    colorTheme: 'emerald',
    growthSpeed: 1.0,
    fernFrondCount: 5,
    fernSpreadAngle: 45,
    fernLeafletLength: 75,
    fernLeafletWidth: 100,
    fernTaperProfile: 1.2,
    fernBranchPoints: 8,
    fernAlternateRate: 0
  }
};

function getActiveParamGroup(type) {
  if (type === 'barnsley-fern') {
    return 'barnsley-fern';
  } else {
    return 'shared';
  }
}

function toggleUIContext(type) {
  const isFern = (type === 'barnsley-fern');
  
  // Show/Hide specific control items using classList
  const fernOnly = document.querySelectorAll('.fern-only');
  const treeOnly = document.querySelectorAll('.tree-only');
  
  fernOnly.forEach(el => {
    if (isFern) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  
  treeOnly.forEach(el => {
    if (isFern) {
      el.classList.add('hidden');
    } else {
      el.classList.remove('hidden');
    }
  });
  
  // Change labels
  const initLengthLabel = document.querySelector('label[for="initLength"]');
  const initThicknessLabel = document.querySelector('label[for="initThickness"]');
  const maxDepthLabel = document.querySelector('label[for="maxDepth"]');
  
  if (isFern) {
    if (initLengthLabel) initLengthLabel.textContent = "Chiều dài lá chính";
    if (initThicknessLabel) initThicknessLabel.textContent = "Độ dày gốc lá";
    if (maxDepthLabel) maxDepthLabel.textContent = "Cấp đệ quy lá (2 - 4)";
  } else {
    if (initLengthLabel) initLengthLabel.textContent = "Chiều dài thân chính";
    if (initThicknessLabel) initThicknessLabel.textContent = "Độ dày gốc";
    if (maxDepthLabel) maxDepthLabel.textContent = "Độ sâu đệ quy";
  }
}

function loadParamsToUI(type) {
  const activeGroup = getActiveParamGroup(type);
  const params = paramState[activeGroup];
  
  if (!params) return;
  
  // Set element values in UI dynamically configuring initLength limits
  if (elements.initLength) {
    if (type === 'barnsley-fern') {
      elements.initLength.min = "300";
      elements.initLength.max = "900";
      elements.initLength.step = "10";
    } else {
      elements.initLength.min = "150";
      elements.initLength.max = "300";
      elements.initLength.step = "5";
    }
    elements.initLength.value = params.initLength;
  }
  if (elements.branchAngle && params.branchAngle !== undefined) elements.branchAngle.value = params.branchAngle;
  if (elements.lengthDecay && params.lengthDecay !== undefined) elements.lengthDecay.value = params.lengthDecay;
  
  // Configure initThickness limits dynamically before setting the value
  if (elements.initThickness) {
    if (type === 'barnsley-fern') {
      elements.initThickness.min = "1";
      elements.initThickness.max = "6";
      elements.initThickness.step = "0.5";
    } else {
      elements.initThickness.min = "20";
      elements.initThickness.max = "50";
      elements.initThickness.step = "1";
    }
    elements.initThickness.value = params.initThickness;
  }
  if (elements.thicknessDecay && params.thicknessDecay !== undefined) elements.thicknessDecay.value = params.thicknessDecay;
  
  // Configure maxDepth limits dynamically before setting the value
  if (elements.maxDepth) {
    if (type === 'barnsley-fern') {
      elements.maxDepth.min = "0";
      elements.maxDepth.max = "4";
    } else {
      elements.maxDepth.min = "8";
      elements.maxDepth.max = "12";
    }
    elements.maxDepth.value = params.maxDepth;
  }
  
  if (elements.treeVariation) elements.treeVariation.value = params.treeVariation;
  if (elements.growthSpeed) elements.growthSpeed.value = params.growthSpeed;
  if (elements.leafType && params.leafType !== undefined) elements.leafType.value = params.leafType;
  if (elements.windStrength) elements.windStrength.value = params.windStrength;
  if (elements.colorTheme) elements.colorTheme.value = params.colorTheme;
  
  if (elements.fernFrondCount && params.fernFrondCount !== undefined) {
    elements.fernFrondCount.value = params.fernFrondCount;
  }
  if (elements.fernSpreadAngle && params.fernSpreadAngle !== undefined) {
    elements.fernSpreadAngle.value = params.fernSpreadAngle;
  }
  if (elements.fernLeafletLength && params.fernLeafletLength !== undefined) {
    elements.fernLeafletLength.value = params.fernLeafletLength;
  }
  if (elements.fernLeafletWidth && params.fernLeafletWidth !== undefined) {
    elements.fernLeafletWidth.value = params.fernLeafletWidth;
  }
  if (elements.fernTaperProfile && params.fernTaperProfile !== undefined) {
    elements.fernTaperProfile.value = params.fernTaperProfile;
  }
  if (elements.fernBranchPoints && params.fernBranchPoints !== undefined) {
    elements.fernBranchPoints.value = params.fernBranchPoints;
  }
  if (elements.fernAlternateRate && params.fernAlternateRate !== undefined) {
    elements.fernAlternateRate.value = params.fernAlternateRate;
  }

  // Toggle UI visibility
  toggleUIContext(type);
  
  // Refresh display labels via trigger
  triggerAllInputUpdates();
}

// Seed for deterministic noise/random tree generation
let treeSeed;
let canvasElement; // Store canvas reference for taking screenshots

// Real-time animation & growth simulation variables
let animationTime = 0; // Current simulation time T in seconds
let isPlaying = true; // Play state (default to true)
let simulationSpeed = 1.0; // Playback speed modifier
let treeRoot = null; // The root node of the stateful tree

// DOM elements references
const elements = {};

function setup() {
  // Create p5 canvas inside container
  const container = document.getElementById('canvas-container');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');
  canvasElement = canvas; // Store canvas reference for screenshot captures

  // Initialize DOM references and event listeners
  initDOMControls();

  // Color mode setup
  colorMode(RGB, 255, 255, 255, 1);
  
  // Set lower frame rate for better performance if needed, 60fps is default
  frameRate(60);

  // Initialize seed and the stateful tree
  treeSeed = floor(random(1, 1000000));
  rebuildTree();
  
  // Populate the garden grid at start
  renderDashboardGrid();
}

function draw() {
  // Read current parameters from UI
  readUIValues();

  // Rebuild the tree root if it's null
  if (!treeRoot) {
    rebuildTree();
  }

  // Increment animation time if playing
  if (isPlaying) {
    let dt = (deltaTime / 1000) * simulationSpeed;
    // Clamp dt to avoid huge jumps if tab is unfocused
    dt = min(dt, 0.1);

    treeRoot.update(dt);
    animationTime += dt;

    // Check if the entire tree has finished growing
    if (treeRoot.isSubtreeFinished()) {
      isPlaying = false; // Pause when fully grown
      
      // Update UI button state
      const playText = document.getElementById('playText');
      const playIcon = document.getElementById('playIcon');
      const pauseIcon = document.getElementById('pauseIcon');
      if (playText && playIcon && pauseIcon) {
        playText.textContent = 'Phát';
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
  }

  // Update progress bar and age display
  updateGrowthUI();

  // Draw background based on color theme
  drawThemeBackground();

  // Position tree at the bottom center of screen
  translate(width / 2, height);
  
  // Initial tilt of the trunk based on noise for organic asymmetry
  if (treeVariation > 0) {
    let initTilt = (noise(99.9) - 0.5) * 2 * radians(15) * treeVariation; // +-15 degrees base tilt
    rotate(initTilt);
  }

  // Draw the stateful tree recursively
  let time = frameCount * 0.015; // Time variable for wind sway animation
  treeRoot.draw(time);
}

function rebuildTree() {
  readUIValues();
  if (treeSeed === undefined) {
    treeSeed = floor(random(1, 1000000));
  }
  
  // Determine global flower color for Type 2 tree based on treeSeed (5% purple, 47.5% red, 47.5% yellow)
  let colorHash = (Math.abs(Math.sin(treeSeed * 19.87 + 4.56)) * 1000) % 1;
  if (colorHash < 0.05) {
    treeFlowerColor = 'purple';
  } else if (colorHash < 0.525) {
    treeFlowerColor = 'red';
  } else {
    treeFlowerColor = 'yellow';
  }

  noiseSeed(treeSeed);
  randomSeed(treeSeed);
  
  if (treeType === 'barnsley-fern') {
    treeRoot = new BarnsleyFern(initLength, maxDepth, treeVariation, fernFrondCount, fernSpreadAngle, initThickness, fernLeafletLength, fernLeafletWidth, fernTaperProfile, fernBranchPoints, fernAlternateRate);
  } else {
    treeRoot = new BranchNode(initLength, initThickness, 0, 1, maxDepth, 0);
  }
  
  animationTime = 0;
}

// Class representing a single branch node in the growth tree
class BranchNode {
  constructor(len, thickness, angle, branchId, depth, level, parent = null, nodeType = 'rachis') {
    this.maxLen = len;
    this.maxThickness = thickness;
    this.angle = angle; // Local angle relative to parent branch
    this.baseAngle = angle; // Store original angle for sequential leaning balance
    this.tipLeanAngle = 0; // Lean offset for parent tip
    this.branchId = branchId;
    this.depth = depth;
    this.level = level;
    this.parent = parent;
    this.nodeType = nodeType;
    this.pinnaCount = (parent && parent.nodeType === 'pinna') ? parent.pinnaCount + 1 : 0;
    
    this.currentLen = 0;
    this.currentThickness = 0.5;
    this.maxDrawnThickness = 0.5; // Historical maximum thickness drawn to prevent teo nhỏ (shrinking)
    this.children = [];
    this.hasSprouted = false;
    this.hasSproutedContinuation = false;
    this.hasSproutedSide = false;

    // Sequential branching properties (Type 2) - Up to 3 sequential slots
    let noiseBranch = noise(branchId * 11.2 + 67.4);
    if (noiseBranch < 0.20) {
      this.maxSequentialBranches = 1;
    } else if (noiseBranch < 0.75) {
      this.maxSequentialBranches = 2;
    } else {
      this.maxSequentialBranches = 3;
    }
    
    let angleRad = radians(branchAngle);
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
      0.1 + leafTimeNoise * 0.8 * treeVariation,
      0.1 + noise(branchId * 42.4 + 89.2) * 0.8 * treeVariation,
      0.1 + noise(branchId * 43.6 + 89.5) * 0.8 * treeVariation
    ];
    this.slotDelays = [
      0, // Slot 0 starts growing leaf immediately
      0.4 + noise(branchId * 9.8 + 14.5) * 1.0, // Delay for Slot 1
      0.8 + noise(branchId * 10.2 + 15.1) * 1.0 // Delay for Slot 2
    ];
    this.slotSprouted = [false, false, false];
    this.sideLeafTimer = 0; // Growth timer for late side leaves (level >= 5)
    
    if (parent === null) {
      if (treeType === 'sequential') {
        this.terminalLevel = Math.round(maxDepth * 0.8);
      } else {
        this.terminalLevel = maxDepth;
      }
    } else {
      let noiseTerminal = noise(branchId * 51.3 + 24.7);
      let dev = round((noiseTerminal - 0.5) * 2 * 2.2 * treeVariation);
      if (treeType === 'sequential') {
        this.terminalLevel = constrain(parent.terminalLevel + dev, 6, 10);
      } else {
        this.terminalLevel = constrain(parent.terminalLevel + dev, 8, 12);
      }
    }
    
    // Leaves and fruits properties
    this.leavesPhase = 'growing'; // 'growing', 'mature', 'falling', 'gone'
    this.leavesProgress = 0; // 0 to 1 scale
    this.leavesFallTime = 0;
    this.matureWaitTime = 0; // Staggered wait time before falling
    this.matureTimeElapsed = 0;
    
    // Unique speed factor variation per branch (up to +-60%)
    let noiseSpeed = noise(branchId * 14.7 + 3.2);
    this.speedFactor = 0.4 + noiseSpeed * 1.2 * treeVariation; // High variance (0.4x to 1.6x)

    // Calculate leaf scale: proportional to base maxThickness of the branch (thick base = large leaves)
    let minThicknessVal = initThickness * Math.pow(thicknessDecay, maxDepth);
    let maxThicknessVal = initThickness;
    let tRatio = (this.maxThickness - minThicknessVal) / Math.max(maxThicknessVal - minThicknessVal, 1.0);
    tRatio = constrain(tRatio, 0, 1);
    
    let levelScale = lerp(1.0, 3.5, tRatio);
    let leafSizeNoise = noise(branchId * 31.4 + 12.9);
    let randomScale = 0.75 + leafSizeNoise * 0.5; // +-25% random size variation
    this.leafScaleFactor = levelScale * randomScale;
  }
  
  // Recursively find the deepest active sprouted generation below this branch
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
  
  // Update physics, length growth, and leaf fall recursively
  update(dt) {
    let activeDescendants = this.getDescendantSproutDepth();
    
    // Base growth rate in pixels per second (same for all branches, scaled by speedFactor)
    // A trunk of initLength will take about 2.8 seconds to grow to full length if uninhibited
    let globalBaseSpeed = (initLength / 2.8);
    let v_base = globalBaseSpeed * this.speedFactor;
    
    // Actual speed decays by 50% for each active sprouted generation below it
    let speed = v_base * Math.pow(0.5, activeDescendants);
    let progress = 0;
    let isLastLevel = (this.level >= this.terminalLevel);
    
    // Original standard elongation for Type 1 & Type 2
    if (this.currentLen < this.maxLen) {
      this.currentLen += speed * dt;
      if (this.currentLen > this.maxLen) this.currentLen = this.maxLen;
    }
    
    progress = this.currentLen / this.maxLen;
    this.currentThickness = lerp(0.5, this.maxThickness, progress);
    
    let sproutProgress = 0.50;
    let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
    let leafTimeFactor = 0.35 + leafTimeNoise * 1.65 * treeVariation;
    
    if (treeType === 'sequential') {
      if (isLastLevel) {
        this.leavesProgress = progress;
      } else {
        // Update all active sequential slots
        for (let i = 0; i < this.maxSequentialBranches; i++) {
          // Always update falling leaf animation if it is currently falling
          if (this.slotLeafPhase[i] === 'falling') {
            this.slotLeafFallTime[i] += dt;
            if (this.slotLeafFallTime[i] >= 1.5) {
              this.slotLeafPhase[i] = 'gone';
            }
          }

          let canGrowSlot = false;
          if (i === 0) {
            canGrowSlot = (progress >= sproutProgress);
          } else {
            if (this.slotSprouted[i - 1]) {
              let timeSinceFirstSprout = animationTime - this.firstSproutedTime;
              canGrowSlot = (timeSinceFirstSprout >= this.slotDelays[i]);
            }
          }

          if (canGrowSlot) {
            if (this.slotLeafPhase[i] === 'growing') {
              let tSlotLeafGrowDuration = 0.45 * Math.pow(0.7, this.level) * leafTimeFactor;
              this.slotLeafProgress[i] += dt / tSlotLeafGrowDuration;
              if (this.slotLeafProgress[i] >= 1.0) {
                this.slotLeafProgress[i] = 1.0;
                this.slotLeafPhase[i] = 'mature';
                
                // Staggered wait time before falling
                this.slotLeafMatureWait[i] = 0.1 + leafTimeNoise * 0.8 * treeVariation;
                this.slotLeafMatureElapsed[i] = 0;
              }
            } else if (this.slotLeafPhase[i] === 'mature') {
              this.slotLeafMatureElapsed[i] += dt;
              if (this.slotLeafMatureElapsed[i] >= this.slotLeafMatureWait[i]) {
                this.slotLeafPhase[i] = 'falling';
                this.slotLeafFallTime[i] = 0;
                this.sproutSequentialChild(i);
              }
            }
          }
        }
      }
    } else {
      // Original hybrid binary-ternary tree triggers
      if (isLastLevel) {
        // Leaf level: leaves grow proportional to branch progress
        this.leavesProgress = progress;
      } else {
        if (progress >= sproutProgress) {
          if (this.leavesPhase === 'growing') {
            let tLeafGrowDuration = 0.45 * Math.pow(0.7, this.level) * leafTimeFactor;
            this.leavesProgress += dt / tLeafGrowDuration;
            if (this.leavesProgress >= 1.0) {
              this.leavesProgress = 1.0;
              this.leavesPhase = 'mature';
              
              // Random wait time before leaf falls to create natural stagger (0.1s to 0.9s)
              this.matureWaitTime = 0.1 + leafTimeNoise * 0.8 * treeVariation;
              this.matureTimeElapsed = 0;
            }
          } else if (this.leavesPhase === 'mature') {
            this.matureTimeElapsed += dt;
            if (this.matureTimeElapsed >= this.matureWaitTime) {
              // Leaf falls and triggers sprouting of child branches!
              this.leavesPhase = 'falling';
              this.leavesFallTime = 0;
              this.sproutChildren();
            }
          } else if (this.leavesPhase === 'falling') {
            this.leavesFallTime += dt;
            if (this.leavesFallTime >= 1.5) {
              this.leavesPhase = 'gone';
            }
          }
        } else {
          // Leaves are growing at the tip along with the branch elongation
          this.leavesProgress = progress / sproutProgress;
        }
      }
    }
    
    // Update side leaf timer for level >= 5 (non-terminal branches) after branch reaches max length
    if (this.level >= 5 && !isLastLevel && this.currentLen >= this.maxLen) {
      this.sideLeafTimer += dt;
      if (this.sideLeafTimer > 1.0) {
        this.sideLeafTimer = 1.0;
      }
    }
    
    // Update children branches first to propagate thickness limits bottom-up
    for (let child of this.children) {
      child.update(dt);
    }

    // Calculate drawn base thickness with child limits, ensuring it never shrinks
    let raw_base = max(this.currentThickness, 1.0);
    let d_base = raw_base;
    if (this.children.length > 0) {
      let maxChildThickness = 0;
      for (let child of this.children) {
        maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
      }
      let d_tip = max(maxChildThickness, 1.0);
      let maxThicknessAllowed = d_tip / thicknessDecay;
      d_base = min(raw_base, maxThicknessAllowed);
    }
    this.maxDrawnThickness = max(this.maxDrawnThickness, d_base);
  }
  
  // Spawn child branch nodes when leaves fall
  sproutChildren() {
    if (this.hasSprouted) return;
    this.hasSprouted = true;
    
    let branchMode = 2; // Default is 2 branches per split (left, right)
    if (treeVariation > 0) {
      let noiseBranchCount = noise(this.branchId * 11.2 + 67.4);
      let p1 = 0.10 * treeVariation; // 10% chance of 1 branch
      let p3 = 0.25 * treeVariation; // 25% chance of 3 branches
      
      if (noiseBranchCount < p1) {
        branchMode = (noiseBranchCount < p1 / 2) ? 1 : -1; // 1 branch (left or right)
      } else if (noiseBranchCount > 1 - p3) {
        branchMode = 3; // 3 branches (left, middle, right)
      } else {
        branchMode = 2; // 2 branches (left, right)
      }
    }
    
    if (branchMode === 0) return;
    
    let angleRad = radians(branchAngle);
    let leftAngleVar = 0, rightAngleVar = 0, midAngleVar = 0;
    let leftLengthDecayVar = lengthDecay;
    let rightLengthDecayVar = lengthDecay;
    let midLengthDecayVar = lengthDecay;
    
    if (treeVariation > 0) {
      let noiseCommon = noise(this.branchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * treeVariation;

      let noiseRelative = noise(this.branchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * treeVariation;

      let noiseR_indiv = noise(this.branchId * 13.9 + 5.7);
      let noiseL_indiv = noise(this.branchId * 15.2 + 8.9);
      let rightIndivAngle = (noiseR_indiv - 0.5) * 2 * radians(10) * treeVariation;
      let leftIndivAngle = (noiseL_indiv - 0.5) * 2 * radians(10) * treeVariation;

      rightAngleVar = commonTilt + relativeAngleVar / 2 + rightIndivAngle;
      leftAngleVar = commonTilt - relativeAngleVar / 2 + leftIndivAngle;

      let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
      midAngleVar = (noiseM_angle - 0.5) * 2 * radians(15) * treeVariation;
      let noiseR_len = noise(this.branchId * 5.9 + 45.1);
      let noiseL_len = noise(this.branchId * 6.1 + 89.4);
      rightLengthDecayVar = lengthDecay * (1.0 + (noiseR_len - 0.5) * 2 * 0.38 * treeVariation);
      leftLengthDecayVar = lengthDecay * (1.0 + (noiseL_len - 0.5) * 2 * 0.38 * treeVariation);

      let hashSide = (Math.abs(Math.sin(this.branchId * 54.321 + 19.876)) * 12345.6789) % 1;
      let noiseAsym = noise(this.branchId * 29.3 + 72.8);
      let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * lengthDecay * treeVariation;
      
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
      midLengthDecayVar = lengthDecay * 0.85 * (1.0 + (noiseM_len - 0.5) * 2 * 0.38 * treeVariation);
      midLengthDecayVar = constrain(midLengthDecayVar, 0.30, 0.90);
    }
    
    let nextThickness = this.maxThickness * thicknessDecay;
    
    // Right Branch
    if (branchMode === -1 || branchMode === 2 || branchMode === 3) {
      let childAngle = angleRad + rightAngleVar;
      let childLen = this.maxLen * rightLengthDecayVar;
      this.children.push(new BranchNode(childLen, nextThickness, childAngle, this.branchId * 3, this.depth - 1, this.level + 1, this));
    }
    
    // Middle Branch
    if (branchMode === 3) {
      let childAngle = midAngleVar;
      let childLen = this.maxLen * midLengthDecayVar;
      this.children.push(new BranchNode(childLen, nextThickness, childAngle, this.branchId * 3 + 1, this.depth - 1, this.level + 1, this));
    }
    
    // Left Branch
    if (branchMode === 1 || branchMode === 2 || branchMode === 3) {
      let childAngle = -angleRad + leftAngleVar;
      let childLen = this.maxLen * leftLengthDecayVar;
      this.children.push(new BranchNode(childLen, nextThickness, childAngle, this.branchId * 3 + 2, this.depth - 1, this.level + 1, this));
    }
  }

  // Sprout child branch sequentially for Type 2 (Sequential Tree)
  sproutSequentialChild(slot) {
    this.slotSprouted[slot] = true;
    this.hasSprouted = true; // Mark sprouted for standard check structures
    
    // 1. Angle Variations (like hybrid tree)
    let noiseCommon = noise(this.branchId * 17.5 + 44.8);
    let commonTilt = (noiseCommon - 0.5) * 2 * radians(15) * treeVariation;
    
    let noiseRelative = noise(this.branchId * 14.2 + 93.1);
    let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(10) * treeVariation;
    
    let noiseIndiv = noise(this.branchId * 15.3 + slot * 47.2);
    let indivAngle = (noiseIndiv - 0.5) * 2 * radians(10) * treeVariation;
    
    let baseAngle = this.slotAngles[slot];
    let side = (baseAngle === 0) ? 0 : Math.sign(baseAngle);
    let finalAngle = baseAngle + commonTilt + side * relativeAngleVar / 2 + indivAngle;
    
    // 2. Length Variations & Asymmetry Bias (like hybrid tree, but with increased deviation)
    let noiseLen = noise(this.branchId * 8.9 + slot * 29.1);
    let childDecay = lengthDecay * (1.0 + (noiseLen - 0.5) * 2 * 0.38 * treeVariation);
    
    let noiseAsym = noise(this.branchId * 29.3 + 72.8);
    let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * lengthDecay * treeVariation;
    
    // Distribute asymmetry bias across slot indexes
    if (slot === 0) childDecay += lengthBias;
    if (slot === 1) childDecay -= lengthBias;
    if (slot === 2) childDecay *= 0.85; // Middle is slightly shorter for variety
    
    childDecay = constrain(childDecay, 0.30, 0.90);
    
    let childLen = this.maxLen * childDecay;
    let nextThickness = this.maxThickness * thicknessDecay;
    
    // Binary branching ID mapping
    let childId = this.branchId * 4 + slot;
    let childNode = new BranchNode(childLen, nextThickness, finalAngle, childId, this.depth - 1, this.level + 1, this);
    
    this.children.push(childNode);
    
    if (slot === 0) {
      this.firstSproutedTime = animationTime;
    }
  }
  
  // Recursively check if the entire subtree has finished growing
  isSubtreeFinished() {
    if (this.currentLen < this.maxLen) return false;
    
    // Check if late side leaves have finished growing
    let isLastLevel = (this.level >= this.terminalLevel);
    if (this.level >= 5 && !isLastLevel) {
      if (this.sideLeafTimer < 1.0) return false;
    }
    
    if (this.level < this.terminalLevel) {
      if (treeType === 'sequential') {
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
  
  // Helper to calculate the actual drawn base thickness dynamically, propagating child limits
  getDrawnBaseThickness() {
    return this.maxDrawnThickness;
  }
  
  // Recursive render function
  draw(time) {
    push();
    
    // Apply wind sway if wind is active and this is not the trunk
    let swayAngle = 0;
    if (windSway && this.level > 0) {
      swayAngle = sin(time + this.depth * 0.4) * (windStrength * 0.006) * (maxDepth - this.depth + 1);
    }
    
    let renderAngle = this.angle;
    rotate(renderAngle + swayAngle);

    // Set smooth linear gradient for fills
    setBranchGradient(this.depth, this.currentLen);
    noStroke();

    // Calculate dynamic base and tip thickness to ensure seamless joints during growth (non-shrinking)
    let d_base = this.maxDrawnThickness;
    let d_tip;
    if (this.children.length > 0) {
      let maxChildThickness = 0;
      for (let child of this.children) {
        maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
      }
      d_tip = max(maxChildThickness, 1.0);
    } else {
      d_tip = max(this.maxDrawnThickness * thicknessDecay, 1.0);
    }

    ellipse(0, 0, d_base, d_base);
    ellipse(0, -this.currentLen, d_tip, d_tip);

    // Draw the tapered branch as a filled trapezoid
    let w_base = d_base / 2;
    let w_tip = d_tip / 2;

    beginShape();
    vertex(-w_base, 0); // bottom left
    vertex(-w_tip, -this.currentLen); // top left
    vertex(w_tip, -this.currentLen); // top right
    vertex(w_base, 0); // bottom right
    endShape(CLOSE);
    
    // Draw side leaves along the branch body for level >= 5 (non-terminal branches)
    // Draw side leaves along the branch body for level >= 5 (non-terminal branches) for Type 1 and Type 2
    let isLastLevel = (this.level >= this.terminalLevel);
    if (this.level >= 5 && !isLastLevel) {
      let progress = this.currentLen / this.maxLen;
      if (progress > 0.3) {
        let sideLeafHash = (Math.abs(Math.sin(this.branchId * 74.3 + 12.9)) * 1000) % 1;
        let sideLeafCount = 1 + floor(sideLeafHash * 3); // 1, 2, or 3 side leaves
        
        for (let k = 0; k < sideLeafCount; k++) {
          // Check if this specific leaf grows early (35% chance) or late (rest)
          let leafHash = (Math.abs(Math.sin(this.branchId * 91.4 + k * 33.7)) * 1000) % 1;
          let isEarlyLeaf = (leafHash < 0.35);
          
          let t;
          if (isEarlyLeaf) {
            t = map(progress, 0.3, 0.9, 0, 1, true);
          } else {
            // Late leaves only grow after branch is fully elongated
            t = map(this.sideLeafTimer, 0, 1.0, 0, 1, true);
          }
          
          if (t > 0) {
            let stemLength = initLength * Math.pow(lengthDecay, this.terminalLevel);
            
            // Random multiplier for stem length between 0.1 and 0.9
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
            
            // Random angle deviation between 0 and 50 degrees
            let angleHash = (Math.abs(Math.sin(this.branchId * 66.2 + k * 41.7)) * 1000) % 1;
            let leafAngle = side * radians(angleHash * 50);
            
            push();
            translate(0, -this.currentLen * ratio);
            rotate(leafAngle);
            
            // Draw stem (cuống lá) - color matches the branch wood color at this depth
            let stemColor = getBranchColorAtDepth(this.depth);
            stroke(stemColor);
            strokeWeight(d_tip * 0.4);
            line(0, 0, 0, -currentStemLen);
            noStroke();
            
            // Draw leaf blade at the tip of the stem
            translate(0, -currentStemLen);
            if (leafScale > 0) {
              push();
              scale(leafScale * this.leafScaleFactor * 0.9);
              drawLeafAtTip(this.branchId * 10 + k, false, this.depth);
              pop();
            }
            pop();
          }
        }
      }
    }

    // Move coordinate system to end of the drawn branch
    translate(0, -this.currentLen);
    if (treeType === 'sequential' && this.tipLeanAngle) {
      rotate(this.tipLeanAngle);
    }

    // Draw leaves/fruits
    if (treeType === 'sequential') {
      let progress = this.currentLen / this.maxLen;
      let sproutProgress = 0.50;
      let isLastLevel = (this.level >= this.terminalLevel);
      if (isLastLevel) {
        if (this.leavesProgress > 0) {
          push();
          scale(this.leavesProgress * this.leafScaleFactor);
          drawLeafAtTip(this.branchId, true, this.depth); // true = terminal (flowers drawn at tips)
          pop();
        }
      } else {
        // Draw leaves for each active sequential slot (false = standard leaves along branches)
        for (let i = 0; i < this.maxSequentialBranches; i++) {
          let canDraw = false;
          if (i === 0) {
            canDraw = (progress >= sproutProgress);
          } else {
            if (this.slotSprouted[i - 1]) {
              let timeSinceFirstSprout = animationTime - this.firstSproutedTime;
              canDraw = (timeSinceFirstSprout >= this.slotDelays[i]);
            }
          }

          if (canDraw && this.slotLeafPhase[i] !== 'falling' && this.slotLeafPhase[i] !== 'gone' && !this.slotSprouted[i]) {
            // Apply slight offset to angle for leaf growth direction
            let angle = this.slotAngles[i] + (this.slotAngles[i] === 0 ? 0 : Math.sign(this.slotAngles[i]) * radians(12));
            push();
            rotate(angle);
            scale(this.slotLeafProgress[i] * this.leafScaleFactor);
            drawLeafAtTip(this.branchId * 4 + i, false, this.depth); // false = non-terminal standard leaf shape
            pop();
          }

          // Slot falling leaf animation
          if (this.slotLeafPhase[i] === 'falling') {
            let fallProgress = this.slotLeafFallTime[i] / 1.5;
            let side = this.slotAngles[i] === 0 ? 0.3 : Math.sign(this.slotAngles[i]);
            let angle = this.slotAngles[i] + side * radians(12);
            push();
            translate(
              side * fallProgress * 30 + sin(this.slotLeafFallTime[i] * 8) * 10,
              fallProgress * 150 + cos(this.slotLeafFallTime[i] * 5) * 5
            );
            rotate(angle + this.slotLeafFallTime[i] * 6 * side);
            scale((1 - fallProgress) * this.leafScaleFactor);
            drawLeafAtTip(this.branchId * 4 + i, false, this.depth); // false = non-terminal standard leaf shape
            pop();
          }
        }
      }
    } else {
      // Original hybrid binary-ternary tree leaves
      if (this.leavesProgress > 0) {
        let isLastLevel = (this.level >= this.terminalLevel);
        
        if (isLastLevel) {
          push();
          scale(this.leavesProgress * this.leafScaleFactor);
          drawLeafAtTip(this.branchId, true, this.depth);
          pop();
        } else {
          if (this.leavesPhase !== 'falling' && this.leavesPhase !== 'gone') {
            // Determine the angles of future child splits for leaf orientation (with an extra 12 degrees tilt)
            let angleRad = radians(branchAngle);
            let extraLeafAngle = radians(12);
            
            let noiseCommon = noise(this.branchId * 17.5 + 44.8);
            let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * treeVariation;
            let noiseRelative = noise(this.branchId * 14.2 + 93.1);
            let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * treeVariation;
            
            let leftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraLeafAngle;
            let rightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraLeafAngle;
            
            let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
            let midAngle = (noiseM_angle - 0.5) * 2 * radians(15) * treeVariation;
            
            push();
            scale(this.leavesProgress * this.leafScaleFactor);
            drawSproutLeaves(this.branchId, leftAngle, rightAngle, midAngle);
            pop();
          } else if (this.leavesPhase === 'falling') {
            let t_f = this.leavesFallTime;
            let tau_fall = 1.5;
            let fallProgress = t_f / tau_fall;
            
            let angleRad = radians(branchAngle);
            let extraLeafAngle = radians(12);
            let noiseCommon = noise(this.branchId * 17.5 + 44.8);
            let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * treeVariation;
            let noiseRelative = noise(this.branchId * 14.2 + 93.1);
            let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * treeVariation;
            
            let leftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraLeafAngle;
            let rightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraLeafAngle;
            
            let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
            let midAngle = (noiseM_angle - 0.5) * 2 * radians(15) * treeVariation;
            
            // Left falling leaf
            push();
            let fallY_L = 150 * fallProgress;
            let fallX_L = -12 - 30 * sin(t_f * 8) * fallProgress;
            let fallRot_L = leftAngle - t_f * 6;
            translate(fallX_L, fallY_L);
            rotate(fallRot_L);
            scale((1 - fallProgress) * this.leafScaleFactor);
            drawSingleLeaf(this.branchId * 3 + 2, 1.0);
            pop();

            // Middle falling leaf
            push();
            let fallY_M = 150 * fallProgress;
            let fallX_M = 20 * sin(t_f * 6 + 1.5) * fallProgress;
            let fallRot_M = midAngle + t_f * 5;
            translate(fallX_M, fallY_M);
            rotate(fallRot_M);
            scale((1 - fallProgress) * this.leafScaleFactor);
            drawSingleLeaf(this.branchId * 3 + 1, 1.0);
            pop();

            // Right falling leaf
            push();
            let fallY_R = 150 * fallProgress;
            let fallX_R = 12 + 30 * sin(t_f * 8 + 3.14) * fallProgress;
            let fallRot_R = rightAngle + t_f * 6;
            translate(fallX_R, fallY_R);
            rotate(fallRot_R);
            scale((1 - fallProgress) * this.leafScaleFactor);
            drawSingleLeaf(this.branchId * 3, 1.0);
            pop();
          }
        }
      }
    }

    // Draw child branches recursively
    for (let child of this.children) {
      child.draw(time);
    }
    
    pop();
  }
}

// Class representing a mathematical Fern using ordinary trigonometry (Hình học lượng giác)
class BarnsleyFern {
  constructor(initLength, maxDepth, treeVariation, frondCount, spreadAngle, initThickness, leafletLength, leafletWidth, taperProfile, branchPoints, alternateRate) {
    this.initLength = initLength;
    this.maxDepth = (maxDepth !== undefined && !isNaN(maxDepth)) ? parseInt(maxDepth) : 3;
    this.treeVariation = treeVariation;
    this.fernFrondCount = frondCount || 5;
    this.fernSpreadAngle = spreadAngle || 30;
    this.initThickness = initThickness || 4;
    this.fernLeafletLength = leafletLength || 75;
    this.fernLeafletWidth = (leafletWidth !== undefined) ? parseFloat(leafletWidth) : 100;
    this.fernTaperProfile = taperProfile || 1.2;
    this.fernBranchPoints = parseInt(branchPoints) || 8;
    this.fernAlternateRate = parseInt(alternateRate) || 0;
  }

  update(dt) {
    // Global animationTime handles progress tracking
  }

  getFrondTiming() {
    let frondDuration = 1.0; // Each frond takes 1.0 second to grow
    let staggerDelay = frondDuration; // Sequential growth
    let totalDuration = this.fernFrondCount * frondDuration;
    return { staggerDelay, frondDuration, totalDuration };
  }

  isSubtreeFinished() {
    let { totalDuration } = this.getFrondTiming();
    return animationTime >= totalDuration;
  }

  getTreeGrowthProgress() {
    let { totalDuration } = this.getFrondTiming();
    return { current: min(animationTime, totalDuration), target: totalDuration };
  }

  drawSoftPointedLeaf(x, y, angle, w, h, pColor) {
    if (h < 0.6 || w < 0.2) return; // completely skip if too microscopic
    
    push();
    translate(x, y);
    rotate(angle);
    
    if (h < 1.8) {
      // Mid-to-microscopic range LOD: draw a simple, sharp sub-pixel line
      stroke(pColor);
      strokeWeight(max(0.4, w));
      line(0, 0, 0, -h);
    } else if (h < 3.8) {
      // Mid range LOD: draw a simple sharp ellipse
      noStroke();
      fill(pColor);
      ellipse(0, -h * 0.5, w, h);
    } else {
      // High details LOD: draw the full premium soft-pointed bezier shape
      noStroke();
      fill(pColor);
      beginShape();
      vertex(0, 0);
      bezierVertex(-w * 0.5, -h * 0.05, -w * 1.0, -h * 0.12, -w * 1.0, -h * 0.25);
      bezierVertex(-w * 0.9, -h * 0.45, -w * 0.4, -h * 0.75, 0, -h);
      bezierVertex(w * 0.4, -h * 0.75, w * 0.9, -h * 0.45, w * 1.0, -h * 0.25);
      bezierVertex(w * 1.0, -h * 0.12, w * 0.5, -h * 0.05, 0, 0);
      endShape(CLOSE);
    }
    pop();
  }

  drawSegmentedLeaf(startX, startY, branchAngle, branchLen, pColor, ratio, widthScale) {
    if (widthScale === undefined) widthScale = 1.0;
    
    let M = 8; // 8 segments for a smooth, high-fidelity bending leaf
    let step = branchLen / M;
    
    let curX = startX;
    let curY = startY;
    let curAngle = branchAngle;
    
    // Calculate dynamic wind bending phase and strength
    let frondPhase = (millis() / 1000.0) * 3.4;
    let activeWind = windStrength * (1.0 + 2.0 * (noise(treeSeed + startX * 0.05 + startY * 0.05) - 0.5));
    let segmentSway = sin(frondPhase) * (activeWind * 0.006); // subtle curvature along the leaf
    
    let pts = [];
    for (let m = 0; m <= M; m++) {
      pts.push({ x: curX, y: curY, u: m / M, angle: curAngle });
      curX += step * sin(curAngle);
      curY -= step * cos(curAngle);
      curAngle += segmentSway;
    }
    
    let maxW = branchLen * ratio * widthScale;
    
    noStroke();
    fill(pColor);
    
    for (let m = 0; m < M; m++) {
      let pt1 = pts[m];
      let pt2 = pts[m + 1];
      
      // Calculate widths at pt1 and pt2 using the soft-pointed profile
      let w1 = maxW * Math.pow(pt1.u, 0.35) * (1.0 - pt1.u) * 2.15;
      let w2 = maxW * Math.pow(pt2.u, 0.35) * (1.0 - pt2.u) * 2.15;
      
      // Left and right offsets at pt1 (perpendicular normal vector: cos(a), sin(a))
      let x1_L = pt1.x - w1 * 0.5 * cos(pt1.angle);
      let y1_L = pt1.y - w1 * 0.5 * sin(pt1.angle);
      let x1_R = pt1.x + w1 * 0.5 * cos(pt1.angle);
      let y1_R = pt1.y + w1 * 0.5 * sin(pt1.angle);
      
      // Left and right offsets at pt2
      let x2_L = pt2.x - w2 * 0.5 * cos(pt2.angle);
      let y2_L = pt2.y - w2 * 0.5 * sin(pt2.angle);
      let x2_R = pt2.x + w2 * 0.5 * cos(pt2.angle);
      let y2_R = pt2.y + w2 * 0.5 * sin(pt2.angle);
      
      beginShape();
      vertex(x1_L, y1_L);
      vertex(x2_L, y2_L);
      vertex(x2_R, y2_R);
      vertex(x1_R, y1_R);
      endShape(CLOSE);
    }
  }

  drawFernBranch(startX, startY, branchAngle, branchLen, baseThickness, currentLevel, maxLevel, pColor, widthScale, overridePairs, bId) {
    if (widthScale === undefined) widthScale = 1.0;
    if (bId === undefined) bId = 1;
    
    // Early culling: skip drawing and recursing if the branch is too microscopic
    if (branchLen < 0.8) return;
    
    // Base case: draw a soft pointed leaf or a segmented leaf
    if (currentLevel >= maxLevel || branchLen < 2.2) {
      // Width-to-length ratio increases per level (extremely slender at level 1, normal oval at level 4)
      let leafWidthFactor = this.fernLeafletWidth / 100.0;
      let ratio = 0.065 * leafWidthFactor;
      if (currentLevel === 2) ratio = 0.12 * leafWidthFactor;
      else if (currentLevel === 3) ratio = 0.22 * leafWidthFactor;
      else if (currentLevel >= 4) ratio = 0.42 * leafWidthFactor;
      
      // Cascading width reduction per level
      let levelWidthScale = Math.pow(0.82, currentLevel - 1);
      // Cascading overall size reduction per level for final leaves
      let leafScale = Math.pow(0.72, currentLevel - 1);
      
      // Generate deterministic variation based on bId instead of startX and startY
      let leafHash = (Math.abs(Math.sin(bId * 12.9898 + 78.233)) * 43758.5453) % 1;
      let leafHash2 = (Math.abs(Math.sin(bId * 73.987 + 12.45)) * 98765.4321) % 1;
      let leafHash3 = (Math.abs(Math.sin(bId * 19.345 + 56.78)) * 54321.0987) % 1;
      let leafHash4 = (Math.abs(Math.sin(bId * 87.654 + 34.21)) * 67890.1234) % 1;

      // 1. Angle offset: e.g. ±12 degrees * treeVariation
      let angleOffset = (leafHash - 0.5) * radians(24) * this.treeVariation;
      
      // 2. Length scale: e.g. from 0.8 to 1.2 * treeVariation
      let finalBranchLen = branchLen * (1.0 + (leafHash2 - 0.5) * 0.4 * this.treeVariation);
      
      // 3. Width scale: e.g. from 0.8 to 1.2 * treeVariation
      let finalWidthScale = widthScale * (1.0 + (leafHash3 - 0.5) * 0.4 * this.treeVariation);

      // 4. Position offset: e.g. ±2px * treeVariation
      let posX = startX + (leafHash4 - 0.5) * 4 * this.treeVariation;
      let posY = startY + (leafHash2 - 0.5) * 4 * this.treeVariation;

      if (maxLevel <= 2) {
        this.drawSegmentedLeaf(posX, posY, branchAngle + angleOffset, finalBranchLen, pColor, ratio, finalWidthScale * levelWidthScale * leafScale);
      } else {
        let w = finalBranchLen * ratio * finalWidthScale * levelWidthScale * leafScale;
        let h = finalBranchLen * leafScale;
        this.drawSoftPointedLeaf(posX, posY, branchAngle + angleOffset, w, h, pColor);
      }
      return;
    }

    // Number of branch-point pairs = overridePairs if specified, else calculated
    let levelPairs = (overridePairs !== undefined) ? overridePairs : Math.max(2, Math.round(this.fernBranchPoints * Math.pow(0.65, currentLevel)));
    let M = levelPairs + 1; // segments = pairs + 1 (loop runs m=1..M-1)
    
    let step = branchLen / M;
    let curX = startX;
    let curY = startY;
    
    let pts = [];
    for (let m = 0; m <= M; m++) {
      pts.push({ x: curX, y: curY, u: m / M });
      curX += step * sin(branchAngle);
      curY -= step * cos(branchAngle);
    }
    
    // Draw stem lines with tapering thickness
    stroke(pColor);
    noFill();
    for (let m = 0; m < M; m++) {
      let u = m / M;
      let segThick = max(0.2, baseThickness * 0.72 * Math.pow(1.0 - u, 1.2));
      strokeWeight(segThick);
      line(pts[m].x, pts[m].y, pts[m + 1].x, pts[m + 1].y);
    }
    
    // Draw child branches recursively (staggered/alternating based on fernAlternateRate)
    let altFactor = this.fernAlternateRate / 100.0;
    let baseAng = (currentLevel === 1) ? 50.0 : 40.0;
    let tipAng  = (currentLevel === 1) ? 6.0  : 5.0;
    
    let P = levelPairs;
    let reduceCount = Math.max(1, Math.round(P * 0.25));
    let defaultChildPairs = Math.max(2, Math.round(this.fernBranchPoints * Math.pow(0.65, currentLevel + 1)));
    
    for (let m = 1; m < M; m++) {
      // Calculate child pairs for left branch based on distance to tip
      let distFromTipL = P - m;
      let childPairsL = defaultChildPairs;
      if (distFromTipL < reduceCount) {
        let steps = reduceCount - distFromTipL;
        childPairsL = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
      }
      
      // Left branch position at uL
      let uL = m / M;
      
      // Deterministic hashes for Left branch variations based on bId and m
      let hashL = (Math.abs(Math.sin(bId * 11.1 + m * 44.4)) * 1000) % 1;
      let hashL2 = (Math.abs(Math.sin(bId * 55.5 + m * 88.8)) * 1000) % 1;
      let hashL3 = (Math.abs(Math.sin(bId * 99.9 + m * 33.3)) * 1000) % 1;
      
      let uL_var = uL + (hashL - 0.5) * 0.08 * this.treeVariation;
      uL_var = constrain(uL_var, 0.05, 0.95);
      
      let xL = startX + uL_var * branchLen * sin(branchAngle);
      let yL = startY - uL_var * branchLen * cos(branchAngle);
      
      let subLenL = branchLen * 1.15 * Math.pow(uL_var, 0.4) * Math.pow(1.0 - uL_var, 1.3);
      subLenL *= (1.0 + (hashL2 - 0.5) * 0.25 * this.treeVariation);
      
      if (subLenL >= 0.6) {
        let childWidthScaleL = widthScale * (1.0 - uL_var * 0.55);
        let subBranchAngleL = map(uL_var, 0, 1, radians(baseAng), radians(tipAng));
        let angleDevL = (hashL3 - 0.5) * radians(15) * this.treeVariation;
        
        let subThickL = max(0.3, baseThickness * 0.4 * (1.0 - 0.4 * uL_var));
        let childIdL = bId * 100 + m * 2;
        this.drawFernBranch(xL, yL, branchAngle - (subBranchAngleL + angleDevL), subLenL, subThickL, currentLevel + 1, maxLevel, pColor, childWidthScaleL, childPairsL, childIdL);
      }
      
      // Calculate child pairs for right branch based on distance to tip (using float index m + 0.5 * altFactor)
      let distFromTipR = P - (m + 0.5 * altFactor);
      let childPairsR = defaultChildPairs;
      if (distFromTipR < reduceCount) {
        let steps = reduceCount - distFromTipR;
        childPairsR = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
      }
      
      // Right branch position at uR (shifted forward by half step based on altFactor)
      let uR = (m + 0.5 * altFactor) / M;
      
      // Deterministic hashes for Right branch variations based on bId and m
      let hashR = (Math.abs(Math.sin(bId * 12.3 + m * 78.9)) * 1000) % 1;
      let hashR2 = (Math.abs(Math.sin(bId * 90.1 + m * 67.8)) * 1000) % 1;
      let hashR3 = (Math.abs(Math.sin(bId * 34.5 + m * 90.1)) * 1000) % 1;
      
      let uR_var = uR + (hashR - 0.5) * 0.08 * this.treeVariation;
      uR_var = constrain(uR_var, 0.05, 0.95);
      
      let xR = startX + uR_var * branchLen * sin(branchAngle);
      let yR = startY - uR_var * branchLen * cos(branchAngle);
      
      let subLenR = branchLen * 1.15 * Math.pow(uR_var, 0.4) * Math.pow(1.0 - uR_var, 1.3);
      subLenR *= (1.0 + (hashR2 - 0.5) * 0.25 * this.treeVariation);
      
      if (subLenR >= 0.6) {
        let childWidthScaleR = widthScale * (1.0 - uR_var * 0.55);
        let subBranchAngleR = map(uR_var, 0, 1, radians(baseAng), radians(tipAng));
        let angleDevR = (hashR3 - 0.5) * radians(15) * this.treeVariation;
        
        let subThickR = max(0.3, baseThickness * 0.4 * (1.0 - 0.4 * uR_var));
        let childIdR = bId * 100 + m * 2 + 1;
        this.drawFernBranch(xR, yR, branchAngle + (subBranchAngleR + angleDevR), subLenR, subThickR, currentLevel + 1, maxLevel, pColor, childWidthScaleR, childPairsR, childIdR);
      }
    }
  }

  drawFrond(heightFactor, animTime, frondDuration, leafletBranchAngle, colStart, colEnd, time, i, baseAngle) {
    let p = min(animTime / frondDuration, 1.0);
    if (p <= 0) return;
    
    // Number of segments (leaflet pairs) on the main stem is exactly fernBranchPoints
    let N = this.fernBranchPoints;
    let countToDraw = Math.floor(N * p);
    
    let h = this.initLength * heightFactor;
    
    // If maxDepth is 0, draw the entire frond as a single segmented leaf!
    if (this.maxDepth === 0) {
      let pColor = lerpColor(colStart, colEnd, 0.5);
      pColor.setAlpha(0.9);
      let leafWidthFactor = this.fernLeafletWidth / 100.0;
      this.drawSegmentedLeaf(0, 0, baseAngle, h * p, pColor, 0.11 * leafWidthFactor, 1.0);
      return;
    }
    
    // Softer, stronger wind bending parameters (scaled up internal multiplier for 1-6 range, near synchronized)
    let frondPhase = time * 3.4 + i * 0.08;
    // Active wind fluctuates dynamically between 0 and 2 * windStrength based on noise
    let activeWind = windStrength * (1.0 + 2.0 * (noise(treeSeed + i * 15.3 + time * 0.4) - 0.5));
    let baseSway = sin(frondPhase) * (activeWind * 0.075);
    
    // 1. Generate the spine points dynamically with high resolution (M = 60 segments) for a smooth concave sheath curve
    let M = 60;
    let spinePoints = [];
    let curX = 0;
    let curY = 0;
    let curAngle = baseAngle;
    let stepLenDetailed = h / M;
    let spineCurvatureDetailed = radians(12.0 / M) * (noise(treeSeed + i * 19.8) - 0.5);
    
    for (let k = 0; k <= M; k++) {
      let t = k / M;
      let bendingFactor = 1.0 + 12.5 * Math.pow(t, 2.4);
      let currentAngle = curAngle + baseSway * bendingFactor;
      
      spinePoints.push({
        x: curX,
        y: curY,
        angle: currentAngle,
        t: t
      });
      
      // Move along the spine
      curX += stepLenDetailed * sin(currentAngle);
      curY -= stepLenDetailed * cos(currentAngle);
      
      // Natural curvature
      curAngle += spineCurvatureDetailed;
    }
    
    // 2. Draw the spine stem using detailed quads for a beautiful, organic concave leaf sheath (bẹ lá loe hình phễu)
    let countToDrawDetailed = Math.floor(M * p);
    noStroke();
    
    let transitionLimit = 0.22; // Leaf sheath occupies a fixed 22% of frond length
    
    for (let k = 0; k < countToDrawDetailed; k++) {
      let pt1 = spinePoints[k];
      let pt2 = spinePoints[k + 1];
      if (!pt2) break;
      
      let t1 = pt1.t;
      let t2 = pt2.t;
      
      // Bulge factor with high exponent (3.5) and 6.5x base thickness for a true flared concave sheath profile (loe dần lõm ở 2 bên)
      let bulge1 = 1.0;
      let bulge2 = 1.0;
      
      if (t1 < transitionLimit) {
        bulge1 = 1.0 + (6.5 - 1.0) * Math.pow(1.0 - (t1 / transitionLimit), 3.5);
      }
      if (t2 < transitionLimit) {
        bulge2 = 1.0 + (6.5 - 1.0) * Math.pow(1.0 - (t2 / transitionLimit), 3.5);
      }
      
      let thick1 = max(0.2, this.initThickness * 1.3 * Math.pow(1.0 - t1, 1.25) * bulge1);
      let thick2 = max(0.2, this.initThickness * 1.3 * Math.pow(1.0 - t2, 1.25) * bulge2);
      
      let w1 = thick1 / 2;
      let w2 = thick2 / 2;
      
      // Perpendicular normal vectors to the spine direction at both joints
      let nx1 = cos(pt1.angle);
      let ny1 = sin(pt1.angle);
      let nx2 = cos(pt2.angle);
      let ny2 = sin(pt2.angle);
      
      // Left and Right boundary points for pt1 and pt2
      let x1_L = pt1.x - w1 * nx1, y1_L = pt1.y - w1 * ny1;
      let x1_R = pt1.x + w1 * nx1, y1_R = pt1.y + w1 * ny1;
      
      let x2_L = pt2.x - w2 * nx2, y2_L = pt2.y - w2 * ny2;
      let x2_R = pt2.x + w2 * nx2, y2_R = pt2.y + w2 * ny2;
      
      // Shift sheath colors to be lighter, more similar to the main leaves (gần tương đồng với màu lá)
      let tColor = t1;
      if (t1 < transitionLimit) {
        tColor = map(t1, 0, transitionLimit, 0.25, 0.45);
      }
      let pColor = lerpColor(colStart, colEnd, tColor);
      pColor.setAlpha(0.9); // solid and clean
      fill(pColor);
      
      // Add a very subtle, gentle outline ONLY to the leaf sheath segments
      if (transitionLimit > 0 && t1 < transitionLimit) {
        let outlineCol = color(red(colEnd), green(colEnd), blue(colEnd));
        outlineCol.setAlpha(0.15); // Low opacity for soft blending
        stroke(outlineCol);
        strokeWeight(0.5); // Thinner line
      } else {
        noStroke();
      }
      
      beginShape();
      vertex(x1_L, y1_L);
      vertex(x2_L, y2_L);
      vertex(x2_R, y2_R);
      vertex(x1_R, y1_R);
      endShape(CLOSE);
    }
    
    // Reset stroke for the rest of drawing
    noStroke();
    
    // Helper function to dynamically interpolate spine points at any continuous t value
    let getSpinePointAtT = (tVal, ptsList) => {
      let len = ptsList.length;
      let idxFloat = tVal * (len - 1);
      let idxFloor = Math.floor(idxFloat);
      let idxCeil = Math.ceil(idxFloat);
      if (idxFloor >= len) return ptsList[len - 1];
      if (idxFloor === idxCeil) return ptsList[idxFloor];
      
      let frac = idxFloat - idxFloor;
      let pF = ptsList[idxFloor];
      let pC = ptsList[idxCeil];
      
      return {
        x: lerp(pF.x, pC.x, frac),
        y: lerp(pF.y, pC.y, frac),
        angle: lerp(pF.angle, pC.angle, frac),
        t: lerp(pF.t, pC.t, frac)
      };
    };
    
    // 3. Draw the leaflets (pinnae) branching out from the spine at precise mapped coordinates
    let subLeafSize = map(this.maxDepth, 2, 4, 4.0, 2.5) * (this.initThickness / 4.0);
    let altFrac = this.fernAlternateRate / 100.0;
    
    for (let k = 1; k <= countToDraw; k++) {
      let tL = k / N;
      let ptL = getSpinePointAtT(tL, spinePoints);
      let pColorL = lerpColor(colStart, colEnd, tL);
      pColorL.setAlpha(0.85);
      
      // Sweep angle: 90 degrees at base down to 8 degrees at tip (relative to main stem)
      let angleBase = 90.0;
      let angleTip = 8.0;
      let currentBranchAngleL = map(tL, 0, 1, radians(angleBase), radians(angleTip));
      
      // Left leaflet size and thickness
      let maxLen = h * (this.fernLeafletLength / 100.0);
      let leafletLenL = maxLen * Math.pow(tL, 0.45) * Math.pow(1.0 - tL, this.fernTaperProfile);
      let lenVarL = (noise(treeSeed + k * 14.3 + i * 7.2) - 0.5) * 0.22;
      leafletLenL *= (1.0 + lenVarL);
      
      // Calculate child pairs for left leaflet (25% tip reduction zone)
      let reduceCount = Math.max(1, Math.round(N * 0.25));
      let defaultChildPairs = Math.max(2, Math.round(this.fernBranchPoints * 0.65));
      let distFromTipL = N - k;
      let childPairsL = defaultChildPairs;
      if (distFromTipL < reduceCount) {
        let steps = reduceCount - distFromTipL;
        childPairsL = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
      }
      
      if (leafletLenL >= 2.0) {
        let stemThickL = max(0.5, this.initThickness * (1.3 - 1.05 * tL));
        let thetaL = ptL.angle - currentBranchAngleL;
        this.drawFernBranch(ptL.x, ptL.y, thetaL, leafletLenL, stemThickL, 1, this.maxDepth, pColorL, 1.0, childPairsL, i * 1000 + k * 2);
      }
      
      // Right leaflet position (shifted forward along the spine based on altFrac)
      let tR = (k + 0.5 * altFrac) / N;
      if (tR <= p) {
        let ptR = getSpinePointAtT(tR, spinePoints);
        let pColorR = lerpColor(colStart, colEnd, tR);
        pColorR.setAlpha(0.85);
        
        let currentBranchAngleR = map(tR, 0, 1, radians(angleBase), radians(angleTip));
        let leafletLenR = maxLen * Math.pow(tR, 0.45) * Math.pow(1.0 - tR, this.fernTaperProfile);
        let lenVarR = (noise(treeSeed + (k + 0.5 * altFrac) * 14.3 + i * 7.2) - 0.5) * 0.22;
        leafletLenR *= (1.0 + lenVarR);
        
        // Calculate child pairs for right leaflet (25% tip reduction zone)
        let reduceCountR = Math.max(1, Math.round(N * 0.25));
        let defaultChildPairsR = Math.max(2, Math.round(this.fernBranchPoints * 0.65));
        let distFromTipR = N - (k + 0.5 * altFrac);
        let childPairsR = defaultChildPairsR;
        if (distFromTipR < reduceCountR) {
          let steps = reduceCountR - distFromTipR;
          childPairsR = Math.max(2, Math.round(defaultChildPairsR * Math.pow(0.65, steps)));
        }
        
        if (leafletLenR >= 2.0) {
          let stemThickR = max(0.5, this.initThickness * (1.3 - 1.05 * tR));
          let thetaR = ptR.angle + currentBranchAngleR;
          this.drawFernBranch(ptR.x, ptR.y, thetaR, leafletLenR, stemThickR, 1, this.maxDepth, pColorR, 1.0, childPairsR, i * 1000 + k * 2 + 1);
        }
      }
    }
  }

  draw(time) {
    push();
    
    let count = this.fernFrondCount;
    let spread = this.fernSpreadAngle;
    let { staggerDelay, frondDuration } = this.getFrondTiming();
    
    let colStart, colEnd;
    switch(colorTheme) {
      case 'sakura':
        colStart = color(54, 38, 30);
        colEnd = color(244, 143, 177);
        break;
      case 'autumn':
        colStart = color(24, 20, 18);
        colEnd = color(245, 158, 11);
        break;
      case 'emerald':
        colStart = color(12, 38, 22);
        colEnd = color(16, 185, 129);
        break;
      case 'cyberpunk':
      default:
        colStart = color(24, 18, 59);
        colEnd = color(236, 72, 153);
        break;
    }
    
    // Draw a short organic trunk (thân ngắn) emerging from the ground with random height based on treeSeed
    let trunkHash = (Math.abs(Math.sin(treeSeed * 53.7 + 12.9)) * 1000) % 1;
    // 25% chance of no trunk (0 height), otherwise random height between 0 and 12% of main leaf length
    let trunkHeightFactor = trunkHash < 0.25 ? 0 : map(trunkHash, 0.25, 1.0, 0, 1.0);
    let trunkLength = this.initLength * 0.12 * trunkHeightFactor;
    
    // N segments for the trunk base (keep it small, e.g. 3 if short, 5 if long, no need for 60)
    let N = trunkLength < 30 ? 3 : 5;
    let step = trunkLength / N;
    let curX = 0;
    let curY = 0;
    let curAngle = 0;
    
    // Slight organic static bend and minor wind sway for the trunk itself
    let trunkCurvature = radians(8.0 / N) * (noise(treeSeed + 50.5) - 0.5) * this.treeVariation;
    let trunkSway = sin(time * 2.5) * (windStrength * 0.005) * this.treeVariation;
    
    let trunkPoints = [];
    for (let k = 0; k <= N; k++) {
      let t = k / N;
      let angle = curAngle + trunkSway * Math.pow(t, 2);
      trunkPoints.push({ x: curX, y: curY, angle: angle, t: t });
      
      curX += step * sin(angle);
      curY -= step * cos(angle);
      curAngle += trunkCurvature;
    }
    
    // Base scale of the leaf sheaths (bẹ lá) is initThickness * 1.3 * 6.5
    let sheathBaseScale = this.initThickness * 1.3 * 6.5;
    
    // Draw the trunk segments as beautifully curved filled quads (to ở gốc, thon ở đỉnh) if trunkLength > 0
    if (trunkLength > 0) {
      noStroke();
      for (let k = 0; k < N; k++) {
        let pt1 = trunkPoints[k];
        let pt2 = trunkPoints[k + 1];
        if (!pt2) break;
        
        let t1 = pt1.t;
        let t2 = pt2.t;
        
        // Trunk base starts at 1.45x the sheath scale (gốc to ra thêm), tapering smoothly to 1.05x at the top
        let w1 = sheathBaseScale * (1.45 - 0.40 * Math.pow(t1, 1.5)) / 2;
        let w2 = sheathBaseScale * (1.45 - 0.40 * Math.pow(t2, 1.5)) / 2;
        
        let nx1 = cos(pt1.angle), ny1 = sin(pt1.angle);
        let nx2 = cos(pt2.angle), ny2 = sin(pt2.angle);
        
        let x1_L = pt1.x - w1 * nx1, y1_L = pt1.y - w1 * ny1;
        let x1_R = pt1.x + w1 * nx1, y1_R = pt1.y + w1 * ny1;
        
        let x2_L = pt2.x - w2 * nx2, y2_L = pt2.y - w2 * ny2;
        let x2_R = pt2.x + w2 * nx2, y2_R = pt2.y + w2 * ny2;
        
        // Color is blended closer to the leaf color theme for better harmony (gần tương đồng với màu lá)
        let trunkCol = lerpColor(colStart, colEnd, 0.15);
        trunkCol.setAlpha(0.92);
        fill(trunkCol);
        
        // Extremely subtle, faint outline blended with the trunk color for minimal visibility (mờ nhạt hơn)
        let outlineCol = lerpColor(trunkCol, colEnd, 0.1);
        outlineCol.setAlpha(0.08); // Only 8% opacity
        stroke(outlineCol);
        strokeWeight(0.8);
        
        beginShape();
        vertex(x1_L, y1_L);
        vertex(x2_L, y2_L);
        vertex(x2_R, y2_R);
        vertex(x1_R, y1_R);
        endShape(CLOSE);
      }
    }
    
    // Draw a rounded cap at the top of the trunk (bo tròn chóp đỉnh)
    let topPt = trunkPoints[N];
    let topW = sheathBaseScale * (1.45 - 0.40 * Math.pow(1.0, 1.5)); // Diameter matching top segment width
    let capCol = lerpColor(colStart, colEnd, 0.15);
    capCol.setAlpha(0.92);
    fill(capCol);
    
    let capOutlineCol = lerpColor(capCol, colEnd, 0.1);
    capOutlineCol.setAlpha(0.08); // faint outline matching trunk
    stroke(capOutlineCol);
    strokeWeight(0.8);
    ellipse(topPt.x, topPt.y, topW, topW);
    
    // Translate and rotate to the top of the trunk before drawing fronds
    translate(topPt.x, topPt.y);
    rotate(topPt.angle);
    
    // Set leaflet angle based on treeVariation (swept angle)
    let leafletBranchAngle = radians(50 + this.treeVariation * 30);
    
    // Periodic random angle sway: every 3 seconds each frond moves to a new random angle offset (±21°)
    // then HOLDS that position until the next cycle (0.5s smooth transition, 2.5s hold)
    let cycleDuration = 3.0;
    let currentCycle = Math.floor(time / cycleDuration);
    let cycleProgress = (time % cycleDuration) / cycleDuration;
    // Only transition during first 2.5s of each cycle, then hold for 0.5s
    let transitionFrac = 2.5 / cycleDuration; // 2.5s as fraction of 3s
    let t = Math.min(1.0, cycleProgress / transitionFrac);
    // Smoothstep easing for natural feel during transition
    let easedProgress = t * t * (3.0 - 2.0 * t);
    
    for (let i = 0; i < count; i++) {
      // Static base angle: evenly distributed across spread + small seed-based variation
      let baseAngleVal = count > 1 ? map(i, 0, count - 1, -spread, spread) : 0;
      baseAngleVal += (noise(treeSeed + i * 15.3) - 0.5) * 8.0; // +-4° static variation
      
      // Sway magnitude always between 9° and 21° (never near zero), with random direction per cycle
      let prevMag  = map(noise(treeSeed + i * 27.4 + currentCycle * 5.7),        0, 1, 9, 21);
      let prevSign = noise(treeSeed + i * 83.1 + currentCycle * 7.3) > 0.5 ? 1 : -1;
      let prevOffset = prevSign * prevMag;
      
      let nextMag  = map(noise(treeSeed + i * 27.4 + (currentCycle + 1) * 5.7),  0, 1, 9, 21);
      let nextSign = noise(treeSeed + i * 83.1 + (currentCycle + 1) * 7.3) > 0.5 ? 1 : -1;
      let nextOffset = nextSign * nextMag;
      let swayOffset = lerp(prevOffset, nextOffset, easedProgress);
      
      let angleVal = constrain(baseAngleVal + swayOffset, -spread, spread);
      
      // Dynamic non-linear main frond length with high random deviation (wild natural look)
      let lengthNoise = noise(treeSeed + i * 43.1 + 12.3);
      let heightFactor = map(lengthNoise, 0, 1, 0.50, 1.15);
      
      let frondStartTime = i * staggerDelay;
      let localAnimTime = animationTime - frondStartTime;
      
      if (localAnimTime >= 0) {
        // 3D Depth shading: outer fronds are in shadow (darker), center is highlighted
        let shadeFactor = 1.0;
        if (count > 1) {
          let normalizedIdx = map(i, 0, count - 1, -1, 1);
          shadeFactor = 1.0 - 0.25 * Math.abs(normalizedIdx);
        }
        
        // Random color variation per frond using noise
        let variation = (noise(treeSeed + i * 31.4) - 0.5) * 20;
        
        let rStart = red(colStart), gStart = green(colStart), bStart = blue(colStart);
        let rEnd = red(colEnd), gEnd = green(colEnd), bEnd = blue(colEnd);
        
        let fColStart = color(
          constrain(rStart * shadeFactor + variation, 0, 255),
          constrain(gStart * shadeFactor + variation * 1.5, 0, 255),
          constrain(bStart * shadeFactor + variation, 0, 255)
        );
        let fColEnd = color(
          constrain(rEnd * shadeFactor + variation, 0, 255),
          constrain(gEnd * shadeFactor + variation * 1.5, 0, 255),
          constrain(bEnd * shadeFactor + variation, 0, 255)
        );
        
        let baseAngle = radians(angleVal);
        
        this.drawFrond(heightFactor, localAnimTime, frondDuration, leafletBranchAngle, fColStart, fColEnd, time, i, baseAngle);
      }
    }
    
    pop();
  }
}

// Set stroke color for branches using a smooth Canvas 2D linear gradient along the branch length
function setBranchGradient(depth, branchLen) {
  let progressStart = (maxDepth - depth) / maxDepth; // 0 at trunk base, 1 at leaves
  let progressEnd = (maxDepth - max(depth - 1, 0)) / maxDepth;
  
  let colStart, colEnd;
  
  switch(colorTheme) {
    case 'sakura':
      colStart = lerpColor(color(54, 38, 30), color(244, 143, 177), progressStart);
      colEnd = lerpColor(color(54, 38, 30), color(244, 143, 177), progressEnd);
      break;
    case 'autumn':
      colStart = lerpColor(color(24, 20, 18), color(245, 158, 11), progressStart);
      colEnd = lerpColor(color(24, 20, 18), color(245, 158, 11), progressEnd);
      break;
    case 'emerald':
      colStart = lerpColor(color(12, 38, 22), color(16, 185, 129), progressStart);
      colEnd = lerpColor(color(12, 38, 22), color(16, 185, 129), progressEnd);
      break;
    case 'cyberpunk':
    default:
      colStart = lerpColor(color(24, 18, 59), color(236, 72, 153), progressStart);
      colEnd = lerpColor(color(24, 18, 59), color(236, 72, 153), progressEnd);
      break;
  }

  // Draw smooth gradient using the native HTML5 Canvas 2D Rendering Context
  let ctx = drawingContext;
  let grad = ctx.createLinearGradient(0, 0, 0, -branchLen);
  
  // Convert p5.Color levels to standard CSS rgba color strings
  let startRGBA = `rgba(${colStart.levels[0]}, ${colStart.levels[1]}, ${colStart.levels[2]}, ${colStart.levels[3] / 255})`;
  let endRGBA = `rgba(${colEnd.levels[0]}, ${colEnd.levels[1]}, ${colEnd.levels[2]}, ${colEnd.levels[3] / 255})`;
  
  grad.addColorStop(0, startRGBA);
  grad.addColorStop(1, endRGBA);
  ctx.strokeStyle = grad;
  ctx.fillStyle = grad;
}

// Helper to calculate the branch color at a given depth based on the selected theme
function getBranchColorAtDepth(depth) {
  let progress = (maxDepth - depth) / maxDepth;
  if (colorTheme === 'sakura') {
    return lerpColor(color(54, 38, 30), color(244, 143, 177), progress);
  } else if (colorTheme === 'autumn') {
    return lerpColor(color(24, 20, 18), color(245, 158, 11), progress);
  } else if (colorTheme === 'emerald') {
    return lerpColor(color(12, 38, 22), color(16, 185, 129), progress);
  } else {
    // cyberpunk or default
    return lerpColor(color(24, 18, 59), color(236, 72, 153), progress);
  }
}

// Draw custom leaves at the tip of the branches, occasionally replacing them with a glowing fruit
function drawLeafAtTip(branchId, isTerminal = false, depth = 0) {
  noStroke();
  
  
  // Deterministic uniform hash for glowing fruit replacement (8% chance)
  let hashGlow = (Math.abs(Math.sin(branchId * 12.9898 + 78.233)) * 43758.5453) % 1;
  let isGlowOrb = (treeVariation > 0) && (hashGlow < 0.08);

  if (isGlowOrb && isTerminal) {
    // Floating glowing neon particles (magical fruit)
    let r, g, b;
    if (colorTheme === 'cyberpunk') {
      r = 6; g = 182; b = 212; // Neon cyan
    } else if (colorTheme === 'autumn') {
      r = 239; g = 68; b = 68; // Vibrant red
    } else {
      r = 255; g = 215; b = 0; // Glowing gold for sakura/emerald
    }
    
    // Draw glowing orb (outer glow, mid glow, center hotspot)
    fill(r, g, b, 0.15);
    ellipse(0, 0, 22, 22);
    fill(r, g, b, 0.4);
    ellipse(0, 0, 12, 12);
    fill(255, 255, 255, 0.95);
    ellipse(0, 0, 5, 5);
    return;
  }
  
  // Draw flower chain for sequential terminal branch tips (20% chance)
  let flowerHash = (Math.abs(Math.sin(branchId * 93.117 + 45.29)) * 43758.5453) % 1;
  let hasFlowers = (treeType === 'sequential') && isTerminal && (flowerHash < 0.20);
  
  if (hasFlowers) {
    // 2 to 4 separate flower clusters (chùm hoa)
    let clusterHash = (Math.abs(Math.sin(branchId * 61.7 + 12.9)) * 1000) % 1;
    let clusterCount = 2 + floor(clusterHash * 3); // 2, 3, or 4 clusters
    
    // Choose flower color: yellow, red, or purple based on global treeFlowerColor
    let r, g, b;
    if (colorTheme === 'cyberpunk') {
      if (treeFlowerColor === 'purple') {
        r = 168; g = 85; b = 247; // Neon Purple
      } else if (treeFlowerColor === 'red') {
        r = 244; g = 63; b = 94; // Neon Rose/Red
      } else {
        r = 253; g = 224; b = 71; // Neon Yellow
      }
    } else if (colorTheme === 'sakura') {
      if (treeFlowerColor === 'purple') {
        r = 186; g = 104; b = 200; // Lavender Purple
      } else if (treeFlowerColor === 'red') {
        r = 244; g = 143; b = 177; // Sakura Pink
      } else {
        r = 255; g = 235; b = 59; // Pale Yellow
      }
    } else {
      // Autumn/Emerald/Default
      if (treeFlowerColor === 'purple') {
        r = 124; g = 58; b = 237; // Indigo Purple
      } else if (treeFlowerColor === 'red') {
        r = 239; g = 68; b = 68; // Crimson Red
      } else {
        r = 245; g = 158; b = 11; // Gold Yellow
      }
    }
    
    // Cancel absolute branch rotation to hang straight down vertically
    let matrix = drawingContext.getTransform();
    let absoluteAngle = Math.atan2(matrix.b, matrix.a);
    
    for (let c = 0; c < clusterCount; c++) {
      let clusterAngleOffset = map(c, 0, clusterCount - 1, -radians(15), radians(15));
      clusterAngleOffset += (noise(branchId * 18.2 + c * 23.4) - 0.5) * radians(8) * treeVariation;
      
      // 3 to 5 blooms in a chain
      let bloomHash = (Math.abs(Math.sin(branchId * 41.2 + c * 91.8)) * 1000) % 1;
      let bloomCount = 3 + floor(bloomHash * 3); // 3 to 5 blooms in this cluster
      
      push();
      rotate(-absoluteAngle);
      rotate(clusterAngleOffset);
      
      let accumAngle = clusterAngleOffset;
      
      for (let i = 0; i < bloomCount; i++) {
        // Gravity pulls the segment towards absolute vertical (0 degrees), plus delayed wind sway
        let phaseLag = i * 0.4;
        let parentSway = sin(animationTime + depth * 0.4 - phaseLag);
        let sway = parentSway * radians(10) * (windStrength * 0.4 + 0.15);
        
        // Bending torque: pull accumAngle towards 0 (gravity)
        let gravityPull = -accumAngle * 0.35;
        rotate(gravityPull + sway);
        accumAngle = accumAngle * 0.65 + sway;
        
        // Draw stem segment
        stroke(16, 185, 129, 0.55);
        strokeWeight(1.2);
        line(0, 0, 0, 11);
        noStroke();
        
        // Move to the joint
        translate(0, 11);
        
        // Draw flower bloom
        let size = map(i, 0, bloomCount, 7, 4.5);
        push();
        fill(r, g, b, 0.9);
        for (let p = 0; p < 5; p++) {
          rotate(TWO_PI / 5);
          ellipse(size * 0.4, 0, size * 0.7, size * 0.4);
        }
        fill(251, 191, 36);
        ellipse(0, 0, size * 0.3, size * 0.3);
        pop();
      }
      pop();
    }
  }
  
  // Helper to draw a single leaf of the selected type
  let drawSingleLeafShape = (bId) => {
    // Generate deterministic hashes for variation based on bId
    let h1 = (Math.abs(Math.sin(bId * 43.123 + 93.71)) * 12345.6789) % 1;
    let h2 = (Math.abs(Math.sin(bId * 73.987 + 12.45)) * 98765.4321) % 1;
    let h3 = (Math.abs(Math.sin(bId * 19.345 + 56.78)) * 54321.0987) % 1;
    let h4 = (Math.abs(Math.sin(bId * 87.654 + 34.21)) * 67890.1234) % 1;

    // 1. Length scale variation: from 0.75 to 1.25
    let lengthScale = 0.75 + h1 * 0.5 * treeVariation; 
    if (treeVariation === 0) lengthScale = 1.0;
    // 2. Width scale variation: from 0.75 to 1.25
    let widthScale = 0.75 + h2 * 0.5 * treeVariation;
    if (treeVariation === 0) widthScale = 1.0;
    // 3. Rotation/tilt variation (angle offset): ±15 degrees * treeVariation
    let rotOffset = radians((h3 - 0.5) * 30 * treeVariation);
    // 4. Position offset (small deviation in X, Y): ±2px * treeVariation
    let posX = (h4 - 0.5) * 4 * treeVariation;
    let posY = (h1 - 0.5) * 4 * treeVariation;

    push();
    translate(posX, posY);
    rotate(rotOffset);
    scale(widthScale, lengthScale);

    setLeafFillColor(bId);
    switch(leafType) {
      case 'sakura':
        ellipse(0, 0, 9, 14);
        fill(244, 143, 177, 0.9);
        ellipse(2, -2, 5, 8);
        break;
        
      case 'emerald':
        beginShape();
        vertex(0, 0);
        quadraticVertex(-5, -6, 0, -14);
        quadraticVertex(5, -6, 0, 0);
        endShape(CLOSE);
        break;
        
      case 'autumn':
        push();
        rotate(radians(-15));
        ellipse(0, -4, 6, 12);
        pop();
        push();
        rotate(radians(15));
        ellipse(0, -4, 6, 12);
        pop();
        ellipse(0, -6, 7, 14);
        break;
    }
    pop();
  };

  // Determine leaf count at this tip: randomly 1 to 3 leaves
  let leafCountHash = (Math.abs(Math.sin(branchId * 82.553 + 19.871)) * 43758.5453) % 1;
  let leafCount = 1;
  if (leafCountHash < 0.35) leafCount = 1;
  else if (leafCountHash < 0.80) leafCount = 2;
  else leafCount = 3;

  if (leafCount === 1) {
    drawSingleLeafShape(branchId);
  } else if (leafCount === 2) {
    push();
    rotate(radians(-15));
    drawSingleLeafShape(branchId * 2);
    pop();
    push();
    rotate(radians(15));
    drawSingleLeafShape(branchId * 2 + 1);
    pop();
  } else {
    push();
    rotate(radians(-25));
    drawSingleLeafShape(branchId * 3);
    pop();
    push();
    drawSingleLeafShape(branchId * 3 + 1);
    pop();
    push();
    rotate(radians(25));
    drawSingleLeafShape(branchId * 3 + 2);
    pop();
  }
}

// Update the growth timeline HTML display elements
function updateGrowthUI() {
  const progressBar = document.getElementById('growthProgressBar');
  const ageVal = document.getElementById('growthAge-val');
  const speedVal = document.getElementById('growthSpeed-val');

  if (progressBar && treeRoot) {
    let stats = getTreeGrowthProgress(treeRoot);
    let progressPercent = stats.target > 0 ? constrain((stats.current / stats.target) * 100, 0, 100) : 0;
    progressBar.style.width = progressPercent.toFixed(1) + '%';
  }
  
  if (ageVal) {
    ageVal.textContent = animationTime.toFixed(1) + 's';
  }
  
  if (speedVal) {
    speedVal.textContent = simulationSpeed.toFixed(1) + 'x';
  }
}

// Recursive function to calculate total lengths of the tree for progress bar
function getTreeGrowthProgress(node) {
  if (treeType === 'barnsley-fern') {
    return node.getTreeGrowthProgress();
  }
  let current = node.currentLen;
  let target = node.maxLen;
  for (let child of node.children) {
    let stats = getTreeGrowthProgress(child);
    current += stats.current;
    target += stats.target;
  }
  return { current, target };
}

// Draw sprout leaves at the end of a growing branch (angled slightly wider than child branches)
function drawSproutLeaves(branchId, leftAngle, rightAngle, midAngle = 0) {
  noStroke();
  
  // Left leaf (pointed in direction of left child branch)
  push();
  let h_L = (Math.abs(Math.sin(branchId * 15.3 + 92.1)) * 1000) % 1;
  let w_L = (Math.abs(Math.sin(branchId * 24.5 + 11.4)) * 1000) % 1;
  let r_L = (Math.abs(Math.sin(branchId * 37.8 + 53.2)) * 1000) % 1;
  let rotateOffset_L = radians((r_L - 0.5) * 15 * treeVariation);
  let lenScale_L = 0.8 + h_L * 0.4 * treeVariation;
  let widthScale_L = 0.8 + w_L * 0.4 * treeVariation;
  if (treeVariation === 0) { lenScale_L = 1.0; widthScale_L = 1.0; }
  
  rotate(leftAngle + rotateOffset_L);
  scale(widthScale_L, lenScale_L);
  setLeafFillColor(branchId * 3 + 2);
  ellipse(0, -6, 6, 12);
  pop();
  
  // Middle leaf (pointed straight along the branch)
  push();
  let h_M = (Math.abs(Math.sin(branchId * 19.8 + 45.6)) * 1000) % 1;
  let w_M = (Math.abs(Math.sin(branchId * 31.2 + 88.9)) * 1000) % 1;
  let r_M = (Math.abs(Math.sin(branchId * 54.1 + 12.3)) * 1000) % 1;
  let rotateOffset_M = radians((r_M - 0.5) * 15 * treeVariation);
  let lenScale_M = 0.8 + h_M * 0.4 * treeVariation;
  let widthScale_M = 0.8 + w_M * 0.4 * treeVariation;
  if (treeVariation === 0) { lenScale_M = 1.0; widthScale_M = 1.0; }
  
  rotate(midAngle + rotateOffset_M);
  scale(widthScale_M, lenScale_M);
  setLeafFillColor(branchId * 3 + 1);
  ellipse(0, -6, 6, 12);
  pop();
  
  // Right leaf (pointed in direction of right child branch)
  push();
  let h_R = (Math.abs(Math.sin(branchId * 29.3 + 72.8)) * 1000) % 1;
  let w_R = (Math.abs(Math.sin(branchId * 41.6 + 5.7)) * 1000) % 1;
  let r_R = (Math.abs(Math.sin(branchId * 63.4 + 14.8)) * 1000) % 1;
  let rotateOffset_R = radians((r_R - 0.5) * 15 * treeVariation);
  let lenScale_R = 0.8 + h_R * 0.4 * treeVariation;
  let widthScale_R = 0.8 + w_R * 0.4 * treeVariation;
  if (treeVariation === 0) { lenScale_R = 1.0; widthScale_R = 1.0; }
  
  rotate(rightAngle + rotateOffset_R);
  scale(widthScale_R, lenScale_R);
  setLeafFillColor(branchId * 3);
  ellipse(0, -6, 6, 12);
  pop();
}

// Draw a single falling leaf
function drawSingleLeaf(branchId, scaleVal) {
  noStroke();
  
  let h = (Math.abs(Math.sin(branchId * 43.123 + 93.71)) * 1000) % 1;
  let w = (Math.abs(Math.sin(branchId * 73.987 + 12.45)) * 1000) % 1;
  let r = (Math.abs(Math.sin(branchId * 19.345 + 56.78)) * 1000) % 1;
  let rotateOffset = radians((r - 0.5) * 20 * treeVariation);
  let lenScale = (0.8 + h * 0.4 * treeVariation) * scaleVal;
  let widthScale = (0.8 + w * 0.4 * treeVariation) * scaleVal;
  if (treeVariation === 0) { lenScale = scaleVal; widthScale = scaleVal; }

  push();
  rotate(rotateOffset);
  scale(widthScale, lenScale);
  setLeafFillColor(branchId);
  ellipse(0, -4, 6, 12);
  pop();
}

// Helper to set leaf fill color based on type and branch ID
function setLeafFillColor(branchId) {
  switch(leafType) {
    case 'sakura':
      fill(253, 164, 186, 0.85); // Sakura pink
      break;
    case 'emerald':
      fill(52, 211, 153, 0.8); // Emerald green
      break;
    case 'autumn':
      // Stable hash for leaf color variation (33% Red, 33% Gold, 33% Orange-brown)
      let hashColor = (Math.abs(Math.sin(branchId * 37.719 + 104.233)) * 98765.4321) % 1;
      if (hashColor < 0.33) {
        fill(220, 38, 38, 0.85); // Autumn Red
      } else if (hashColor < 0.66) {
        fill(245, 158, 11, 0.85); // Amber Gold
      } else {
        fill(180, 83, 9, 0.85); // Deep Orange-brown
      }
      break;
  }
}

// Draw the application canvas background depending on theme
function drawThemeBackground() {
  switch(colorTheme) {
    case 'cyberpunk':
      background(6, 6, 12);
      // Subtle background grid or glow could be drawn here, but simple solid keeps it clean and fast
      break;
    case 'sakura':
      background(15, 12, 15);
      break;
    case 'emerald':
      background(5, 12, 8);
      break;
    case 'autumn':
      background(13, 10, 8);
      break;
    case 'monochrome':
      background(10, 10, 10);
      break;
    case 'rainbow':
    default:
      background(8, 8, 12);
      break;
  }
}

// Responsive layout update
function windowResized() {
  const container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// Initialize DOM control handlers
function initDOMControls() {
  const ids = [
    'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
    'thicknessDecay', 'maxDepth', 'treeVariation', 'growthSpeed',
    'leafType', 'windStrength', 'colorTheme', 'randomBtn', 'resetBtn', 'saveBtn',
    'treeTypeSelect', 'fernFrondCount', 'fernSpreadAngle', 'fernLeafletLength', 'fernLeafletWidth', 'fernTaperProfile', 'fernBranchPoints', 'fernAlternateRate'
  ];

  elements.treeVariation = document.getElementById('treeVariation');

  ids.forEach(id => {
    elements[id] = document.getElementById(id);
  });

  if (elements.treeTypeSelect) {
    elements.treeTypeSelect.addEventListener('change', () => {
      const newTreeType = elements.treeTypeSelect.value;
      loadParamsToUI(newTreeType);
      treeType = newTreeType;
      rebuildTree();
    });
  }

  // Track slider display updates
  const sliderConfig = [
    { id: 'initLength', valId: 'initLength-val', suffix: 'px' },
    { id: 'branchAngle', valId: 'branchAngle-val', suffix: '°' },
    { id: 'lengthDecay', valId: 'lengthDecay-val', suffix: '' },
    { id: 'initThickness', valId: 'initThickness-val', suffix: 'px' },
    { id: 'thicknessDecay', valId: 'thicknessDecay-val', suffix: '' },
    { id: 'maxDepth', valId: 'maxDepth-val', suffix: '' },
    { id: 'treeVariation', valId: 'treeVariation-val', suffix: '' },
    { id: 'growthSpeed', valId: 'growthSpeed-val', suffix: 'x' },
    { id: 'windStrength', valId: 'windStrength-val', suffix: '' },
    { id: 'fernFrondCount', valId: 'fernFrondCount-val', suffix: '' },
    { id: 'fernSpreadAngle', valId: 'fernSpreadAngle-val', suffix: '°' },
    { id: 'fernLeafletLength', valId: 'fernLeafletLength-val', suffix: '%' },
    { id: 'fernLeafletWidth', valId: 'fernLeafletWidth-val', suffix: '%' },
    { id: 'fernTaperProfile', valId: 'fernTaperProfile-val', suffix: '' },
    { id: 'fernBranchPoints', valId: 'fernBranchPoints-val', suffix: '' },
    { id: 'fernAlternateRate', valId: 'fernAlternateRate-val', suffix: '%' }
  ];

  sliderConfig.forEach(cfg => {
    const slider = elements[cfg.id];
    const valDisplay = document.getElementById(cfg.valId);
    
    if (slider && valDisplay) {
      // Set initial value
      valDisplay.textContent = slider.value + cfg.suffix;
      
      // Update value dynamically on slide
      slider.addEventListener('input', () => {
        valDisplay.textContent = slider.value + cfg.suffix;
        // Rebuild tree if slider affects tree structure
        const structural = [
          'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
          'thicknessDecay', 'maxDepth', 'treeVariation', 'fernFrondCount', 'fernSpreadAngle', 'fernLeafletLength', 'fernLeafletWidth', 'fernTaperProfile', 'fernBranchPoints', 'fernAlternateRate'
        ];
        if (structural.includes(cfg.id)) {
          rebuildTree();
        }
      });
    }
  });

  // Growth Play/Pause Button
  const playBtn = document.getElementById('playBtn');
  const playText = document.getElementById('playText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      // If growth reached completion, play again from start
      if (treeRoot && treeRoot.isSubtreeFinished()) {
        rebuildTree();
        isPlaying = true;
      } else {
        isPlaying = !isPlaying;
      }
      
      if (isPlaying) {
        playText.textContent = 'Tạm dừng';
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playText.textContent = 'Phát';
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    });
  }

  // Restart Button
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      rebuildTree();
      isPlaying = true;
      if (playText && playIcon && pauseIcon) {
        playText.textContent = 'Tạm dừng';
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      }
    });
  }

  // Button Actions
  elements.randomBtn.addEventListener('click', randomizeSettings);
  elements.resetBtn.addEventListener('click', resetSettings);
  elements.saveBtn.addEventListener('click', exportImage);

  // Save Tree and Garden buttons
  const saveTreeBtn = document.getElementById('saveTreeBtn');
  const gardenBtn = document.getElementById('gardenBtn');
  const closeDashboardBtn = document.getElementById('closeDashboardBtn');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  
  const newHybridBtn = document.getElementById('newHybridBtn');
  const newSequentialBtn = document.getElementById('newSequentialBtn');

  if (saveTreeBtn) {
    saveTreeBtn.addEventListener('click', () => {
      // Pause simulation while naming modal is open
      isPlaying = false;
      document.getElementById('saveModal').classList.remove('hidden');
      document.getElementById('treeNameInput').value = '';
      document.getElementById('treeNameInput').focus();
    });
  }

  if (gardenBtn) {
    gardenBtn.addEventListener('click', () => {
      showDashboard();
    });
  }

  if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
      hideDashboard();
    });
  }

  if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', () => {
      document.getElementById('saveModal').classList.add('hidden');
      isPlaying = true;
    });
  }

  if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', () => {
      saveTreeCurrent();
    });
  }

  if (newHybridBtn) {
    newHybridBtn.addEventListener('click', () => {
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'hybrid';
      treeType = 'hybrid';
      loadParamsToUI('hybrid');
      resetSettings();
      hideDashboard();
      isPlaying = true;
    });
  }

  if (newSequentialBtn) {
    newSequentialBtn.addEventListener('click', () => {
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'sequential';
      treeType = 'sequential';
      loadParamsToUI('sequential');
      resetSettings();
      hideDashboard();
      isPlaying = true;
    });
  }

  const newFernBtn = document.getElementById('newFernBtn');
  if (newFernBtn) {
    newFernBtn.addEventListener('click', () => {
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'barnsley-fern';
      treeType = 'barnsley-fern';
      loadParamsToUI('barnsley-fern');
      resetSettings();
      hideDashboard();
      isPlaying = true;
    });
  }
}

// Read current values of control widgets
function readUIValues() {
  initLength = parseFloat(elements.initLength.value);
  if (elements.branchAngle && elements.branchAngle.value) branchAngle = parseFloat(elements.branchAngle.value);
  if (elements.lengthDecay && elements.lengthDecay.value) lengthDecay = parseFloat(elements.lengthDecay.value);
  initThickness = parseFloat(elements.initThickness.value);
  if (elements.thicknessDecay && elements.thicknessDecay.value) thicknessDecay = parseFloat(elements.thicknessDecay.value);
  treeVariation = parseFloat(elements.treeVariation.value);
  simulationSpeed = parseFloat(elements.growthSpeed.value);
  drawLeaves = true; // Permanently active
  if (elements.leafType && elements.leafType.value) leafType = elements.leafType.value;
  windSway = true; // Permanently active
  windStrength = parseFloat(elements.windStrength.value);
  colorTheme = elements.colorTheme.value;
  if (elements.treeTypeSelect) {
    treeType = elements.treeTypeSelect.value;
  }
  
  maxDepth = parseInt(elements.maxDepth.value);
  
  if (elements.fernFrondCount && elements.fernFrondCount.value) {
    fernFrondCount = parseInt(elements.fernFrondCount.value);
  }
  if (elements.fernSpreadAngle && elements.fernSpreadAngle.value) {
    fernSpreadAngle = parseFloat(elements.fernSpreadAngle.value);
  }
  if (elements.fernLeafletLength && elements.fernLeafletLength.value) {
    fernLeafletLength = parseFloat(elements.fernLeafletLength.value);
  }
  if (elements.fernLeafletWidth && elements.fernLeafletWidth.value) {
    fernLeafletWidth = parseFloat(elements.fernLeafletWidth.value);
  }
  if (elements.fernTaperProfile && elements.fernTaperProfile.value) {
    fernTaperProfile = parseFloat(elements.fernTaperProfile.value);
  }
  if (elements.fernBranchPoints && elements.fernBranchPoints.value) {
    fernBranchPoints = parseInt(elements.fernBranchPoints.value);
  }
  if (elements.fernAlternateRate && elements.fernAlternateRate.value) {
    fernAlternateRate = parseInt(elements.fernAlternateRate.value);
  }

  // Save current values to the active group in paramState
  const activeGroup = getActiveParamGroup(treeType);
  if (activeGroup === 'barnsley-fern') {
    paramState[activeGroup] = {
      initLength: initLength,
      initThickness: initThickness,
      maxDepth: maxDepth,
      treeVariation: treeVariation,
      growthSpeed: simulationSpeed,
      windStrength: windStrength,
      colorTheme: colorTheme,
      fernFrondCount: fernFrondCount,
      fernSpreadAngle: fernSpreadAngle,
      fernLeafletLength: fernLeafletLength,
      fernLeafletWidth: fernLeafletWidth,
      fernTaperProfile: fernTaperProfile,
      fernBranchPoints: fernBranchPoints,
      fernAlternateRate: fernAlternateRate
    };
  } else {
    paramState[activeGroup] = {
      initLength: initLength,
      branchAngle: branchAngle,
      lengthDecay: lengthDecay,
      initThickness: initThickness,
      thicknessDecay: thicknessDecay,
      maxDepth: maxDepth,
      treeVariation: treeVariation,
      growthSpeed: simulationSpeed,
      leafType: leafType,
      windStrength: windStrength,
      colorTheme: colorTheme
    };
  }
}

// Generate cool random parameter values
function randomizeSettings() {
  treeSeed = floor(random(1, 1000000));
  
  if (treeType === 'barnsley-fern') {
    // Fern specific random bounds
    elements.initLength.value = round(random(540, 840));
    elements.initThickness.value = round(random(2, 6)); // thin stem/leaflet thickness
    elements.maxDepth.value = round(random(0, 4));
    elements.treeVariation.value = parseFloat(random(0.02, 0.25).toFixed(2));
    elements.windStrength.value = parseFloat(random(0.3, 1.7).toFixed(1));
    elements.fernFrondCount.value = round(random(3, 7));
    elements.fernSpreadAngle.value = round(random(30, 80) / 5) * 5;
    elements.fernLeafletLength.value = round(random(55, 135));
    elements.fernLeafletWidth.value = round(random(50, 160));
    elements.fernTaperProfile.value = parseFloat(random(0.6, 2.4).toFixed(1));
    elements.fernBranchPoints.value = round(random(5, 15));
    elements.fernAlternateRate.value = random([0, 0, 30, 50, 70, 100]); // 0 is symmetrical, higher is alternating
    
    // Forest Emerald or Cyberpunk or Sakura look cool with green leaves
    const themes = ['emerald', 'cyberpunk', 'sakura'];
    elements.colorTheme.value = random(themes);
  } else {
    elements.initLength.value = round(random(150, 300));
    elements.branchAngle.value = round(random(5, 30));
    elements.lengthDecay.value = parseFloat(random(0.68, 0.86).toFixed(2));
    elements.initThickness.value = round(random(20, 45));
    elements.thicknessDecay.value = parseFloat(random(0.65, 0.85).toFixed(2));
    elements.maxDepth.value = round(random(8, 11));
    elements.treeVariation.value = parseFloat(random(0.65, 1.2).toFixed(2));
    elements.windStrength.value = parseFloat(random(0.4, 1.8).toFixed(1));

    // Random theme selection
    const themes = ['cyberpunk', 'sakura', 'autumn', 'emerald'];
    elements.colorTheme.value = random(themes);

    // Random leaf selection
    const leaves = ['sakura', 'emerald', 'autumn'];
    elements.leafType.value = random(leaves);
  }
  
  elements.growthSpeed.value = 1.0;

  // Restart growth and automatically start playing
  animationTime = 0;
  isPlaying = true;

  // Update UI play button state
  const playText = document.getElementById('playText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  if (playText && playIcon && pauseIcon) {
    playText.textContent = 'Tạm dừng';
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  }

  // Trigger input events to update DOM displays
  triggerAllInputUpdates();
}

// Reset settings to initial defaults
function resetSettings() {
  treeSeed = 42; // Set standard deterministic seed for default tree
  
  if (treeType === 'barnsley-fern') {
    elements.initLength.value = 640;
    elements.initThickness.value = 4;
    elements.maxDepth.value = 3;
    elements.treeVariation.value = 0.15;
    elements.windStrength.value = 1.0;
    elements.colorTheme.value = 'emerald';
    
    elements.fernFrondCount.value = 5;
    elements.fernSpreadAngle.value = 45;
    elements.fernLeafletLength.value = 75;
    elements.fernLeafletWidth.value = 100;
    elements.fernTaperProfile.value = 1.2;
    elements.fernBranchPoints.value = 8;
    elements.fernAlternateRate.value = 0;
  } else {
    elements.initLength.value = 200;
    elements.branchAngle.value = 20;
    elements.lengthDecay.value = 0.75;
    elements.initThickness.value = 30;
    elements.thicknessDecay.value = 0.75;
    elements.maxDepth.value = 9;
    elements.treeVariation.value = 0.80;
    
    elements.leafType.value = 'emerald';
    elements.windStrength.value = 1.0;
    elements.colorTheme.value = 'cyberpunk';
  }
  elements.growthSpeed.value = 1.0;
  
  animationTime = 0;
  triggerAllInputUpdates();
}

// Save tree drawing as file
function exportImage() {
  // Prompt user for file name prefix or default to timestamp
  let filename = 'fractal-tree-' + year() + month() + day() + '-' + hour() + minute() + second();
  saveCanvas(filename, 'png');
}

// Trigger input events on all sliders/inputs to refresh text displays and toggle sections
function triggerAllInputUpdates() {
  const ids = [
    'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
    'thicknessDecay', 'maxDepth', 'treeVariation', 'growthSpeed', 'windStrength'
  ];
  
  ids.forEach(id => {
    const el = elements[id];
    if (el) {
      // Dispatch input event to refresh text display
      el.dispatchEvent(new Event('input'));
    }
  });
}

// Storage & Dashboard Logic

// Save the current tree parameters and screenshot to local storage
function saveTreeCurrent() {
  const nameInput = document.getElementById('treeNameInput');
  let name = nameInput.value.trim();
  if (!name) {
    name = "Cây Độc Bản (" + new Date().toLocaleDateString() + ")";
  }
  
  // Hide modal first
  document.getElementById('saveModal').classList.add('hidden');
  isPlaying = true;
  
  // Capture canvas data URL
  let dataUrl = canvasElement.elt.toDataURL('image/jpeg', 0.85);
  
  // Prepare tree object
  const treeData = {
    id: Date.now().toString(),
    name: name,
    date: new Date().toLocaleString(),
    screenshot: dataUrl,
    seed: treeSeed,
    treeType: treeType, // Save tree type configuration
    params: {
      initLength: elements.initLength.value,
      branchAngle: elements.branchAngle ? elements.branchAngle.value : undefined,
      lengthDecay: elements.lengthDecay ? elements.lengthDecay.value : undefined,
      initThickness: elements.initThickness.value,
      thicknessDecay: elements.thicknessDecay ? elements.thicknessDecay.value : undefined,
      maxDepth: elements.maxDepth.value,
      treeVariation: elements.treeVariation.value,
      windStrength: elements.windStrength.value,
      growthSpeed: elements.growthSpeed.value,
      leafType: elements.leafType ? elements.leafType.value : undefined,
      colorTheme: elements.colorTheme.value,
      fernFrondCount: elements.fernFrondCount ? elements.fernFrondCount.value : undefined,
      fernSpreadAngle: elements.fernSpreadAngle ? elements.fernSpreadAngle.value : undefined,
      fernLeafletLength: elements.fernLeafletLength ? elements.fernLeafletLength.value : undefined,
      fernLeafletWidth: elements.fernLeafletWidth ? elements.fernLeafletWidth.value : undefined,
      fernTaperProfile: elements.fernTaperProfile ? elements.fernTaperProfile.value : undefined,
      fernBranchPoints: elements.fernBranchPoints ? elements.fernBranchPoints.value : undefined,
      fernAlternateRate: elements.fernAlternateRate ? elements.fernAlternateRate.value : undefined
    }
  };
  
  // Save to localStorage
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  savedTrees.push(treeData);
  localStorage.setItem('saved_fractal_trees', JSON.stringify(savedTrees));
  
  // Open the dashboard to show the newly saved tree card
  showDashboard();
}

// Load a saved tree's parameters and seed
function loadSavedTree(id) {
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  const tree = savedTrees.find(t => t.id === id);
  if (!tree) return;
  
  // Load variables and seed
  treeSeed = tree.seed;
  treeType = tree.treeType || 'hybrid';
  if (elements.treeTypeSelect) {
    elements.treeTypeSelect.value = treeType;
  }
  
  // Load DOM elements values
  const params = tree.params;
  Object.keys(params).forEach(key => {
    if (elements[key]) {
      elements[key].value = params[key];
    }
  });
  
  // Save loaded parameters to correct active group in paramState
  const activeGroup = getActiveParamGroup(treeType);
  if (activeGroup === 'barnsley-fern') {
    paramState[activeGroup] = {
      initLength: parseFloat(params.initLength),
      initThickness: parseFloat(params.initThickness),
      maxDepth: parseInt(params.maxDepth),
      treeVariation: parseFloat(params.treeVariation),
      growthSpeed: parseFloat(params.growthSpeed || 1.0),
      windStrength: parseFloat(params.windStrength),
      colorTheme: params.colorTheme,
      fernFrondCount: parseInt(params.fernFrondCount || 5),
      fernSpreadAngle: parseFloat(params.fernSpreadAngle || 45),
      fernLeafletLength: parseFloat(params.fernLeafletLength || 75),
      fernLeafletWidth: parseFloat(params.fernLeafletWidth || 100),
      fernTaperProfile: parseFloat(params.fernTaperProfile || 1.2),
      fernBranchPoints: parseInt(params.fernBranchPoints || 8),
      fernAlternateRate: parseInt(params.fernAlternateRate || 0)
    };
  } else {
    paramState[activeGroup] = {
      initLength: parseFloat(params.initLength),
      branchAngle: parseFloat(params.branchAngle),
      lengthDecay: parseFloat(params.lengthDecay),
      initThickness: parseFloat(params.initThickness),
      thicknessDecay: parseFloat(params.thicknessDecay),
      maxDepth: parseInt(params.maxDepth),
      treeVariation: parseFloat(params.treeVariation),
      growthSpeed: parseFloat(params.growthSpeed || 1.0),
      leafType: params.leafType,
      windStrength: parseFloat(params.windStrength),
      colorTheme: params.colorTheme
    };
  }
  
  // Close dashboard and trigger rebuild
  hideDashboard();
  toggleUIContext(treeType);
  triggerAllInputUpdates();
  rebuildTree();
  isPlaying = true;
}

// Delete a saved tree from localStorage
function deleteSavedTree(id) {
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  savedTrees = savedTrees.filter(t => t.id !== id);
  localStorage.setItem('saved_fractal_trees', JSON.stringify(savedTrees));
  
  // Refresh the grid display
  renderDashboardGrid();
}

// Open the full-screen dashboard overlay
function showDashboard() {
  document.getElementById('dashboardOverlay').classList.remove('hidden');
  renderDashboardGrid();
}

// Close the dashboard overlay
function hideDashboard() {
  document.getElementById('dashboardOverlay').classList.add('hidden');
}

// Render dynamic saved tree card grid from localStorage
function renderDashboardGrid() {
  const grid = document.getElementById('gardenGrid');
  if (!grid) return;
  
  // Clean all items
  grid.innerHTML = '';
  
  // Load saved trees from storage
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  // Draw cards in reverse order (newest first)
  savedTrees.reverse().forEach(tree => {
    const card = document.createElement('div');
    card.className = 'tree-card';
    
    card.innerHTML = `
      <div class="tree-card-preview">
        <img src="${tree.screenshot}" alt="${tree.name}">
      </div>
      <div class="tree-card-info">
        <div class="tree-card-title">${tree.name}</div>
        <div class="tree-card-meta">${tree.date}</div>
        <div class="tree-card-actions">
          <button class="btn-card-load" onclick="loadSavedTree('${tree.id}')">Xem cây</button>
          <button class="btn-card-delete" onclick="deleteSavedTree('${tree.id}')">Xóa</button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// Bind to window for global inline onclick access
window.loadSavedTree = loadSavedTree;
window.deleteSavedTree = deleteSavedTree;
