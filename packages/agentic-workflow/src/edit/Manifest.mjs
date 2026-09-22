/**
 * Manifest — skill add/remove across .claude-plugin/plugin.json and skills.sh.json.
 *
 * Both files are JSON with a "skills" array.  skillAdd/skillRemove keep the
 * array alphabetically sorted.  skills.sh.json groups skills into sections
 * (e.g., "User-facing", "Internal").
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function shaPrefix(hex) {
  return hex.slice(0, 8);
}

function makeReceipt(service, op, path, schema, before, after, ok) {
  return { service, op, path, schema, before, after, ok };
}

function atomicWrite(targetPath, content) {
  writeFileSync(targetPath, content, "utf8");
  return targetPath;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * skillAdd(pluginJson, skillName, { group, description, userInvocable })
 *
 * pluginJson is the absolute path to .claude-plugin/plugin.json.
 * skillName is the name to add.
 * group, description, userInvocable are optional metadata.
 *
 * Adds the skill to the skills array in alphabetical order.
 * Also updates skills.sh.json if it exists (same alphabetical placement).
 *
 * Returns a receipt.
 */
export function skillAdd(pluginJson, skillName, { group, description, userInvocable } = {}) {
  const content = readFileSync(pluginJson, "utf8");
  const beforeHashValue = sha256(content);

  const data = JSON.parse(content);
  const skills = data.skills || [];

  // Check if already present
  if (skills.some((s) => s.name === skillName)) {
    throw new Error(`Skill "${skillName}" already exists`);
  }

  // Build the skill entry
  const entry = { name: skillName };
  if (description) entry.description = description;
  if (group) entry.group = group;
  if (userInvocable !== undefined) entry["user-invocable"] = userInvocable;

  // Insert in alphabetical order by name
  let inserted = false;
  const newSkills = [];
  for (const s of skills) {
    if (!inserted && s.name > skillName) {
      newSkills.push(entry);
      inserted = true;
    }
    newSkills.push(s);
  }
  if (!inserted) {
    newSkills.push(entry);
  }

  data.skills = newSkills;
  const newContent = JSON.stringify(data, null, 2);
  atomicWrite(pluginJson, newContent);
  const afterHashValue = sha256(newContent);

  // Also update skills.sh.json if it exists
  const shDir = join(dirname(pluginJson), "..");
  const shJsonPath = join(shDir, "skills.sh.json");
  if (existsSync(shJsonPath)) {
    const shContent = readFileSync(shJsonPath, "utf8");
    const shData = JSON.parse(shContent);
    if (shData.skills) {
      // Insert alphabetically in skills.sh.json as well
      const shSkills = shData.skills;
      let shInserted = false;
      const newShSkills = [];
      for (const s of shSkills) {
        if (!shInserted && s > skillName) {
          newShSkills.push(skillName);
          shInserted = true;
        }
        newShSkills.push(s);
      }
      if (!shInserted) {
        newShSkills.push(skillName);
      }
      shData.skills = newShSkills;
      atomicWrite(shJsonPath, JSON.stringify(shData, null, 2));
    }
  }

  return makeReceipt(
    "manifest",
    "skillAdd",
    pluginJson,
    "manifest-table@1",
    shaPrefix(beforeHashValue),
    shaPrefix(afterHashValue),
    true,
  );
}

/**
 * skillRemove(pluginJson, skillName)
 *
 * Removes the skill from the skills array in plugin.json (and skills.sh.json).
 * Keeps the array alphabetically sorted.
 *
 * Returns a receipt.  Throws if the skill is not found.
 */
export function skillRemove(pluginJson, skillName) {
  const content = readFileSync(pluginJson, "utf8");
  const beforeHashValue = sha256(content);

  const data = JSON.parse(content);
  const skills = data.skills || [];
  const beforeCount = skills.length;

  const newSkills = skills.filter((s) => s.name !== skillName);
  if (newSkills.length === beforeCount) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  data.skills = newSkills;
  const newContent = JSON.stringify(data, null, 2);
  atomicWrite(pluginJson, newContent);
  const afterHashValue = sha256(newContent);

  // Also update skills.sh.json if it exists
  const shDir = join(dirname(pluginJson), "..");
  const shJsonPath = join(shDir, "skills.sh.json");
  if (existsSync(shJsonPath)) {
    const shContent = readFileSync(shJsonPath, "utf8");
    const shData = JSON.parse(shContent);
    if (shData.skills) {
      shData.skills = shData.skills.filter((s) => s !== skillName);
      atomicWrite(shJsonPath, JSON.stringify(shData, null, 2));
    }
  }

  return makeReceipt(
    "manifest",
    "skillRemove",
    pluginJson,
    "manifest-table@1",
    shaPrefix(beforeHashValue),
    shaPrefix(afterHashValue),
    true,
  );
}