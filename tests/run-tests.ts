#!/usr/bin/env npx ts-node

/**
 * Grouper MCP Regression Test Runner
 * 
 * Executes tests defined in test-suite.json against the Grouper MCP server.
 * 
 * Usage:
 *   npx ts-node run-tests.ts [options]
 * 
 * Options:
 *   --category <name>   Run only tests in specified category
 *   --test <id>         Run only the specified test
 *   --verbose           Show detailed output for each test
 *   --stop-on-fail      Stop execution on first failure
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM compatibility: __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestConfig {
  testStem: string;
  testGroupPrefix: string;
  testSubject: string;
}

interface TestExpectation {
  type: "contains_results" | "found" | "not_found" | "created" | "updated" | "deleted" | "success" | "error";
  hasFields?: string[];
}

interface TestDefinition {
  id: string;
  category: string;
  name: string;
  tool: string;
  params: Record<string, unknown>;
  expect: TestExpectation;
  saveAs?: Record<string, string>;
  dependsOn?: string[];
  runLast?: boolean;
}

interface TestSuite {
  name: string;
  version: string;
  description: string;
  config: TestConfig;
  tests: TestDefinition[];
}

interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  output?: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  category: args.includes("--category") ? args[args.indexOf("--category") + 1] : null,
  testId: args.includes("--test") ? args[args.indexOf("--test") + 1] : null,
  verbose: args.includes("--verbose"),
  stopOnFail: args.includes("--stop-on-fail"),
};

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};

function log(message: string, color?: keyof typeof colors) {
  const prefix = color ? colors[color] : "";
  const suffix = color ? colors.reset : "";
  console.log(`${prefix}${message}${suffix}`);
}

function substituteVariables(obj: unknown, variables: Record<string, string>): unknown {
  if (typeof obj === "string") {
    let result = obj;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => substituteVariables(item, variables));
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteVariables(value, variables);
    }
    return result;
  }
  return obj;
}

function validateResult(result: string, expect: TestExpectation): { passed: boolean; reason?: string } {
  const lowerResult = result.toLowerCase();

  switch (expect.type) {
    case "contains_results":
      if (lowerResult.includes("found 0") || lowerResult.includes("no results") || lowerResult.includes("not found")) {
        return { passed: false, reason: "Expected results but found none" };
      }
      return { passed: true };

    case "found":
      if (lowerResult.includes("not found") || lowerResult.includes("error")) {
        return { passed: false, reason: "Expected item to be found" };
      }
      if (expect.hasFields) {
        for (const field of expect.hasFields) {
          if (!lowerResult.includes(field.toLowerCase())) {
            return { passed: false, reason: `Missing expected field: ${field}` };
          }
        }
      }
      return { passed: true };

    case "not_found":
      if (lowerResult.includes("not found") || lowerResult.includes("no ")) {
        return { passed: true };
      }
      return { passed: false, reason: "Expected 'not found' response" };

    case "created":
    case "updated":
    case "deleted":
    case "success":
      if (lowerResult.includes("error")) {
        return { passed: false, reason: `Operation failed with error` };
      }
      return { passed: true };

    case "error":
      if (lowerResult.includes("error") || lowerResult.includes("not found") || lowerResult.includes("failed")) {
        return { passed: true };
      }
      return { passed: false, reason: "Expected an error response" };

    default:
      return { passed: true };
  }
}

function extractSavedValues(result: string, saveAs: Record<string, string>): Record<string, string> {
  const saved: Record<string, string> = {};

  for (const [field, varName] of Object.entries(saveAs)) {
    if (field === "uuid") {
      // Match "UUID: <value>" format from formatSingleGroupDetails
      // Grouper UUIDs can be 32 hex chars (no dashes) or 36 chars (with dashes)
      const uuidMatch = result.match(/UUID:\s*([a-fA-F0-9-]{32,36})/);
      if (uuidMatch) saved[varName] = uuidMatch[1];
    }
    if (field === "idIndex") {
      // Match "ID Index: <value>" format from formatSingleGroupDetails
      const idMatch = result.match(/ID Index:\s*(\d+)/i);
      if (idMatch) saved[varName] = idMatch[1];
    }
  }

  return saved;
}

async function runTests() {
  // Load test suite
  const suitePath = path.join(__dirname, "test-suite.json");
  if (!fs.existsSync(suitePath)) {
    log("Error: test-suite.json not found", "red");
    process.exit(1);
  }
  
  const suite: TestSuite = JSON.parse(fs.readFileSync(suitePath, "utf-8"));
  log(`\n${suite.name} v${suite.version}`, "blue");
  log(`${suite.description}\n`, "dim");

  // Debug: show whether required env vars are set (without revealing values)
  log(`\nEnvironment check:`, "dim");
  log(`  GROUPER_BASE_URL: ${process.env.GROUPER_BASE_URL ? "(set)" : "(not set - will use demo server)"}`, "dim");
  log(`  GROUPER_USERNAME: ${process.env.GROUPER_USERNAME ? "(set)" : "(not set)"}`, "dim");
  log(`  GROUPER_PASSWORD: ${process.env.GROUPER_PASSWORD ? "(set)" : "(not set)"}`, "dim");
  log(`  NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || "(not set)"}\n`, "dim");

  // Initialize MCP client
  // Explicitly pass environment variables to ensure child process inherits them
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    env: process.env as Record<string, string>,
  });
  
  const client = new Client({ name: "test-runner", version: "1.0.0" }, { capabilities: {} });
  
  try {
    await client.connect(transport);
    log("Connected to Grouper MCP server\n", "green");
  } catch (err) {
    log(`Failed to connect to MCP server: ${err}`, "red");
    process.exit(1);
  }

  // Initialize variables with config values
  const variables: Record<string, string> = { ...suite.config };
  const results: TestResult[] = [];
  const passed: Set<string> = new Set();
  const failed: Set<string> = new Set();

  // Filter and sort tests
  let tests = suite.tests;
  
  if (options.category) {
    tests = tests.filter((t) => t.category === options.category);
    log(`Running category: ${options.category}`, "blue");
  }
  
  if (options.testId) {
    tests = tests.filter((t) => t.id === options.testId);
    log(`Running test: ${options.testId}`, "blue");
  }

  // Sort: non-runLast first, then runLast
  tests = [...tests.filter((t) => !t.runLast), ...tests.filter((t) => t.runLast)];

  log(`Running ${tests.length} tests...\n`);

  for (const test of tests) {
    // Check dependencies
    if (test.dependsOn) {
      const unmet = test.dependsOn.filter((dep) => !passed.has(dep));
      if (unmet.length > 0) {
        results.push({
          id: test.id,
          name: test.name,
          status: "skipped",
          duration: 0,
          error: `Unmet dependencies: ${unmet.join(", ")}`,
        });
        log(`⊘ ${test.id}: ${test.name} (skipped - dependencies)`, "yellow");
        continue;
      }
    }

    // Substitute variables in params
    const params = substituteVariables(test.params, variables) as Record<string, unknown>;
    
    const startTime = Date.now();
    
    try {
      const response = await client.callTool({ name: test.tool, arguments: params });
      const duration = Date.now() - startTime;
      
      const resultText = typeof response.content === "string" 
        ? response.content 
        : JSON.stringify(response.content);
      
      const validation = validateResult(resultText, test.expect);
      
      if (validation.passed) {
        passed.add(test.id);
        results.push({ id: test.id, name: test.name, status: "passed", duration });
        log(`✓ ${test.id}: ${test.name} (${duration}ms)`, "green");
        
        // Save values if specified
        if (test.saveAs) {
          const saved = extractSavedValues(resultText, test.saveAs);
          Object.assign(variables, saved);
          if (options.verbose && Object.keys(saved).length > 0) {
            log(`  Saved: ${JSON.stringify(saved)}`, "dim");
          }
        }
      } else {
        failed.add(test.id);
        results.push({
          id: test.id,
          name: test.name,
          status: "failed",
          duration,
          error: validation.reason,
          output: options.verbose ? resultText : undefined,
        });
        log(`✗ ${test.id}: ${test.name} - ${validation.reason}`, "red");
        
        if (options.stopOnFail) {
          log("\nStopping on first failure", "yellow");
          break;
        }
      }
      
      if (options.verbose) {
        log(`  Response: ${resultText.substring(0, 200)}...`, "dim");
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      failed.add(test.id);
      results.push({
        id: test.id,
        name: test.name,
        status: "failed",
        duration,
        error: String(err),
      });
      log(`✗ ${test.id}: ${test.name} - ${err}`, "red");
      
      if (options.stopOnFail) break;
    }
  }

  // Summary
  const passedCount = results.filter((r) => r.status === "passed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  
  log("\n" + "=".repeat(50));
  log(`Results: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`, 
      failedCount > 0 ? "red" : "green");
  
  if (failedCount > 0) {
    log("\nFailed tests:", "red");
    for (const result of results.filter((r) => r.status === "failed")) {
      log(`  ${result.id}: ${result.error}`, "red");
    }
  }

  await client.close();
  process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((err) => {
  log(`Fatal error: ${err}`, "red");
  process.exit(1);
});
