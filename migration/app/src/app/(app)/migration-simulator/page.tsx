"use client";

import { useState, useEffect, useCallback } from "react";
import { MigrationDashboard } from "@/components/migration/MigrationDashboard";
import type { MigrationResult } from "@/types/migration";

export default function MigrationSimulatorPage() {
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // After fetching result, animate steps one by one
  useEffect(() => {
    if (!result) return;
    const totalSteps = result.phases.reduce(
      (sum, p) => sum + p.steps.length,
      0
    );
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= totalSteps) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [result]);

  const handleRunMigration = useCallback(async () => {
    setError(null);
    setResult(null);
    setCurrentStep(0);
    setIsRunning(true);

    try {
      const res = await fetch("/api/migration/simulate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? `Simulation failed with status ${res.status}`
        );
      }

      setResult(data as MigrationResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setIsRunning(false);
    setCurrentStep(0);
    setError(null);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="py-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
          V1 &rarr; V2 Migration Simulator
        </h1>
        <p className="text-base text-[var(--text-secondary)] max-w-lg">
          로컬 환경에서 DAO 거버넌스 마이그레이션을 시뮬레이션합니다.
        </p>
      </section>

      {/* Action Buttons */}
      <section className="flex items-center gap-3">
        <button
          onClick={handleRunMigration}
          disabled={isRunning}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isRunning ? "Running..." : "Run Migration"}
        </button>
        <button
          onClick={handleReset}
          disabled={isRunning}
          className={`bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors ${
            isRunning ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Reset
        </button>
      </section>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Migration failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Dashboard */}
      <MigrationDashboard
        result={result}
        isRunning={isRunning}
        currentStep={currentStep}
      />
    </div>
  );
}
