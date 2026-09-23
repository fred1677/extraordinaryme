// File: /frontend/engines/Tao-native-engine.js

/**
 * ============================================================================
 * MODULE: /frontend/engines/Tao-native-engine.js
 * 
 * NOTE: 
 * Edge AI libraries (Orama, Brain, Transformers) are temporarily bypassed 
 * to clear the +esm CDN fetch error and allow the OS to boot. 
 * The system will fall back to hardcoded command routing.
 * ============================================================================
 */

import { HELP_DICTIONARY } from '../config/help-dictionary.js';

// 🚨 TEMPORARILY BYPASSED TO CLEAR THE +esm ERROR 🚨
// import * as Orama from '../libs/ai/orama.js';
// import brain from '../libs/ai/brain.js';
// import { pipeline, env } from '../libs/ai/transformers.js';

class ParadoxError extends Error {
  constructor(message) { super(`[PARADOX] ${message}`); this.name = "ParadoxError"; }
}
class SchemaError extends Error {
  constructor(message) { super(`[SCHEMA] ${message}`); this.name = "SchemaError"; }
}

export class TaoNativeEngine {
  #registry;
  #edgeAI; 

  constructor() {
    this.#registry = new Map();
    this.#edgeAI = {
        isReady: false,
        searchIndex: null, 
        habitNet: null, 
        chatLLM: null 
    };
  }

  async bootEdgeAI() {
      console.log("%c[Edge AI] Boot bypassed. Using hardcoded fallback routing.", "color: #f59e0b; font-weight: bold;");
      this.#edgeAI.isReady = false; 
  }

  createObject(creatorName, { objName, isFinished = false, description = '', detailExplanation = '', dependencies = [], func = null, outputs = {} }) {
    if (creatorName === objName) throw new ParadoxError(`Self-Instantiation forbidden.`);
    if (!objName || typeof objName !== 'string') throw new SchemaError('Creation failed: "objName" must be a valid string.');
    if (this.#registry.has(objName)) throw new SchemaError(`Collision: Object "${objName}" already exists.`);

    const { isStable, warnings } = this.#auditDependencies(objName, dependencies);

    const node = {
      'obj-name': objName,
      'Finish flag': isFinished ? 'finished' : 'editing',
      'Description': description,
      'detail explanation': detailExplanation,
      'dependencies': Array.isArray(dependencies) ? dependencies : [],
      'function': func,
      'output(s)': outputs,
      '_meta': { creator: creatorName, createdAt: Date.now(), isStable: isStable }
    };

    this.#registry.set(objName, node);
    return { success: true, status: isStable ? 'READY' : 'CAUTION', node: node, warnings: warnings };
  }

  getObject(objName) {
    return this.#registry.get(objName) || null;
  }

  async evaluatePrompt(prompt) {
    if (!prompt) return null;
    const lowerPrompt = prompt.toLowerCase().trim();

    // Hardcoded fallback logic while AI is bypassed
    if (lowerPrompt === 'show desktop' || lowerPrompt === 'clear screen' || lowerPrompt === 'hide everything') {
        window.dispatchEvent(new CustomEvent('tao-show-desktop'));
        return { handledLocally: true, reply: "Sweeping all windows to the dock." };
    }
    
    // Return null to allow the chatbox to ping the backend API
    return null;
  }

  #auditDependencies(targetObjName, dependencies) {
    const warnings = [];
    let isStable = true;
    for (const depName of dependencies) {
      if (depName === targetObjName) { warnings.push(`[Self-Reference]`); continue; }
      const depNode = this.#registry.get(depName);
      if (!depNode) { isStable = false; warnings.push(`[Missing Node]`); }
      else if (depNode['Finish flag'] !== 'finished') { isStable = false; warnings.push(`[Unfinished Node]`); }
    }
    return { isStable, warnings };
  }
}