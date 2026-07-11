"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  GraduationCap,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  X,
  Check,
  RotateCcw,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  Percent,
  PlusCircle,
  HelpCircle
} from "lucide-react";

// Types
interface WeightedCategory {
  id: string;
  name: string;
  weight: number; // percentage (e.g., 20 for 20%)
  currentScore: number | null; // percentage grade (e.g., 90), or null if pending
  isExpanded?: boolean;
  items: Array<{ id: string; name: string; score: number; maxScore: number }>;
}

interface PointAssignment {
  id: string;
  name: string;
  score: number;
  total: number;
  completed: boolean;
}

interface GPACourse {
  id: string;
  name: string;
  credits: number;
  grade: string; // e.g. "A", "B+"
  level: "Regular" | "Honors" | "AP" | "IB";
}

interface GPAScaleRule {
  grade: string;
  points: number;
  minPercent: number;
}

const DEFAULT_GPA_SCALE: GPAScaleRule[] = [
  { grade: "A+", points: 4.0, minPercent: 98},
  { grade: "A", points: 4.0, minPercent: 93 },
  { grade: "A-", points: 3.7, minPercent: 90 },
  { grade: "B+", points: 3.3, minPercent: 87 },
  { grade: "B", points: 3.0, minPercent: 83 },
  { grade: "B-", points: 2.7, minPercent: 80 },
  { grade: "C+", points: 2.3, minPercent: 77 },
  { grade: "C", points: 2.0, minPercent: 73 },
  { grade: "C-", points: 1.7, minPercent: 70 },
  { grade: "D+", points: 1.3, minPercent: 67 },
  { grade: "D", points: 1.0, minPercent: 60 },
  { grade: "F", points: 0.0, minPercent: 0 },
];

export default function GradeCheckerApp() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"class" | "gpa">("class");

  // --- CLASS GRADE CHECKER STATE ---
  const [classTitle, setClassTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_classTitle");
      if (stored) return stored;
    }
    return "";
  });

  const [desiredGrade, setDesiredGrade] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_desiredGrade");
      if (stored) return Number(stored);
    }
    return 90;
  });

  const [gradingMode, setGradingMode] = useState<"weighted" | "points">((() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_gradingMode");
      if (stored) return stored as "weighted" | "points";
    }
    return "weighted";
  })());

  const [weightedCategories, setWeightedCategories] = useState<WeightedCategory[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_weightedCategories");
      if (stored) return JSON.parse(stored);
    }
    return [];
  });

  const [pointsAssignments, setPointsAssignments] = useState<PointAssignment[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_pointsAssignments");
      if (stored) return JSON.parse(stored);
    }
    return [];
  });

  // --- GPA CHECKER STATE ---
  const [gpaRules, setGpaRules] = useState<GPAScaleRule[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_gpaRules");
      if (stored) return JSON.parse(stored);
    }
    return DEFAULT_GPA_SCALE;
  });

  const [weightingConfig, setWeightingConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_weightingConfig");
      if (stored) return JSON.parse(stored);
    }
    return {
      regularBoost: 0,
      honorsBoost: 0.5,
      apBoost: 1.0,
      ibBoost: 1.0,
    };
  });

  const [showScaleConfig, setShowScaleConfig] = useState(false);

  const [gpaCourses, setGpaCourses] = useState<GPACourse[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_gpaCourses");
      if (stored) return JSON.parse(stored);
    }
    return [];
  });

  // --- AI SYLLABUS IMPORT DIALOG ---
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  // Graph Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; labelX: string; labelY: string } | null>(null);

  // Save State Helpers
  const saveClassTitle = (val: string) => {
    setClassTitle(val);
    localStorage.setItem("gc_classTitle", val);
  };

  const saveDesiredGrade = (val: number) => {
    setDesiredGrade(val);
    localStorage.setItem("gc_desiredGrade", String(val));
  };

  const saveGradingMode = (val: "weighted" | "points") => {
    setGradingMode(val);
    localStorage.setItem("gc_gradingMode", val);
  };

  const saveWeightedCategories = (val: WeightedCategory[]) => {
    setWeightedCategories(val);
    localStorage.setItem("gc_weightedCategories", JSON.stringify(val));
  };

  const savePointsAssignments = (val: PointAssignment[]) => {
    setPointsAssignments(val);
    localStorage.setItem("gc_pointsAssignments", JSON.stringify(val));
  };

  const saveGpaCourses = (val: GPACourse[]) => {
    setGpaCourses(val);
    localStorage.setItem("gc_gpaCourses", JSON.stringify(val));
  };

  const saveGpaRules = (val: GPAScaleRule[]) => {
    setGpaRules(val);
    localStorage.setItem("gc_gpaRules", JSON.stringify(val));
  };

  const saveWeightingConfig = (val: typeof weightingConfig) => {
    setWeightingConfig(val);
    localStorage.setItem("gc_weightingConfig", JSON.stringify(val));
  };

  // Reset helper
  const resetClassData = () => {
    if (confirm("Are you sure you want to reset class data?")) {
      localStorage.removeItem("gc_classTitle");
      localStorage.removeItem("gc_desiredGrade");
      localStorage.removeItem("gc_gradingMode");
      localStorage.removeItem("gc_weightedCategories");
      localStorage.removeItem("gc_pointsAssignments");
      window.location.reload();
    }
  };

  const resetGPAData = () => {
    if (confirm("Are you sure you want to reset GPA planner?")) {
      localStorage.removeItem("gc_gpaCourses");
      localStorage.removeItem("gc_gpaRules");
      localStorage.removeItem("gc_weightingConfig");
      window.location.reload();
    }
  };

  // --- MATH CALCULATIONS ---

  // Weighted Mode Grade Calculations
  const calculateWeightedGrade = () => {
    let totalWeight = 0;
    let earnedWeightContribution = 0;
    let pendingWeight = 0;

    weightedCategories.forEach((cat) => {
      // Determine final average percentage for category
      let catScore = cat.currentScore;

      // If category has child items, compute average percentage from them
      if (cat.items && cat.items.length > 0) {
        const sumEarned = cat.items.reduce((sum, item) => sum + item.score, 0);
        const sumMax = cat.items.reduce((sum, item) => sum + item.maxScore, 0);
        catScore = sumMax > 0 ? (sumEarned / sumMax) * 100 : 100;
      }

      if (catScore !== null) {
        earnedWeightContribution += (catScore * cat.weight) / 100;
        totalWeight += cat.weight;
      } else {
        pendingWeight += cat.weight;
      }
    });

    const currentOverallGrade = totalWeight > 0 ? (earnedWeightContribution / (totalWeight / 100)) : 100;

    // What percentage on remaining pending weight do we need to hit Desired Score?
    // Formula: (DesiredScore - CurrentEarnedContribution) / PendingWeight * 100
    let requiredScoreOnPending = null;
    if (pendingWeight > 0) {
      requiredScoreOnPending = ((desiredGrade - earnedWeightContribution) / pendingWeight) * 100;
    }

    return {
      currentOverallGrade: Math.round(currentOverallGrade * 100) / 100,
      totalEarnedWeightPercent: Math.round(earnedWeightContribution * 100) / 100,
      totalWeightEvaluated: totalWeight,
      pendingWeight,
      requiredScoreOnPending: requiredScoreOnPending !== null ? Math.round(requiredScoreOnPending * 100) / 100 : null,
      earnedWeightContribution,
    };
  };

  // Points Mode Grade Calculations
  const calculatePointsGrade = () => {
    const completedAssignments = pointsAssignments.filter((a) => a.completed);
    const pendingAssignments = pointsAssignments.filter((a) => !a.completed);

    const earnedPoints = completedAssignments.reduce((sum, a) => sum + a.score, 0);
    const maxCompletedPoints = completedAssignments.reduce((sum, a) => sum + a.total, 0);
    const pendingPoints = pendingAssignments.reduce((sum, a) => sum + a.total, 0);

    const totalPossiblePoints = maxCompletedPoints + pendingPoints;
    const currentOverallGrade = maxCompletedPoints > 0 ? (earnedPoints / maxCompletedPoints) * 100 : 100;

    // Points needed to achieve desired grade over the entire course:
    // (Desired Grade % / 100) * totalPossiblePoints - earnedPoints
    const totalPointsNeeded = (desiredGrade / 100) * totalPossiblePoints;
    const remainingPointsNeeded = totalPointsNeeded - earnedPoints;

    let requiredScoreOnPending = null;
    if (pendingPoints > 0) {
      requiredScoreOnPending = (remainingPointsNeeded / pendingPoints) * 100;
    }

    return {
      currentOverallGrade: Math.round(currentOverallGrade * 100) / 100,
      earnedPoints,
      maxCompletedPoints,
      pendingPoints,
      totalPossiblePoints,
      remainingPointsNeeded: Math.max(0, Math.round(remainingPointsNeeded * 100) / 100),
      requiredScoreOnPending: requiredScoreOnPending !== null ? Math.round(requiredScoreOnPending * 100) / 100 : null,
    };
  };

  // Combined variables
  const currentGradeResults = gradingMode === "weighted" ? calculateWeightedGrade() : calculatePointsGrade();

  // GPA calculation helper
  const calculateGPA = () => {
    let totalCredits = 0;
    let totalUnweightedGpaPoints = 0;
    let totalWeightedGpaPoints = 0;

    gpaCourses.forEach((course) => {
      // Look up grade in scale
      const scaleRule = gpaRules.find((r) => r.grade === course.grade);
      const gradePoints = scaleRule ? scaleRule.points : 0;

      // Unweighted
      totalUnweightedGpaPoints += gradePoints * course.credits;

      // Weighted boost
      let boost = 0;
      if (course.level === "Honors") boost = weightingConfig.honorsBoost;
      else if (course.level === "AP") boost = weightingConfig.apBoost;
      else if (course.level === "IB") boost = weightingConfig.ibBoost;

      totalWeightedGpaPoints += (gradePoints + boost) * course.credits;
      totalCredits += course.credits;
    });

    return {
      unweightedGPA: totalCredits > 0 ? Math.round((totalUnweightedGpaPoints / totalCredits) * 100) / 100 : 0,
      weightedGPA: totalCredits > 0 ? Math.round((totalWeightedGpaPoints / totalCredits) * 100) / 100 : 0,
      totalCredits,
    };
  };

  const gpaResult = calculateGPA();

  // --- HANDLERS ---

  // Weighted Mode updates
  const handleAddCategory = () => {
    const newCat: WeightedCategory = {
      id: Date.now().toString(),
      name: "New Category",
      weight: 10,
      currentScore: null,
      isExpanded: false,
      items: [],
    };
    saveWeightedCategories([...weightedCategories, newCat]);
  };

  const handleDeleteCategory = (id: string) => {
    saveWeightedCategories(weightedCategories.filter((cat) => cat.id !== id));
  };

  const handleUpdateCategory = (id: string, field: keyof WeightedCategory, value: any) => {
    const updated = weightedCategories.map((cat) => {
      if (cat.id === id) {
        return { ...cat, [field]: value };
      }
      return cat;
    });
    saveWeightedCategories(updated);
  };

  // Category Item Updates (nested calculation helper)
  const handleAddNestedItem = (catId: string) => {
    const updated = weightedCategories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: [
            ...cat.items,
            { id: Date.now().toString(), name: `Assignment ${cat.items.length + 1}`, score: 10, maxScore: 10 },
          ],
        };
      }
      return cat;
    });
    saveWeightedCategories(updated);
  };

  const handleUpdateNestedItem = (catId: string, itemId: string, field: string, value: any) => {
    const updated = weightedCategories.map((cat) => {
      if (cat.id === catId) {
        const updatedItems = cat.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...cat, items: updatedItems };
      }
      return cat;
    });
    saveWeightedCategories(updated);
  };

  const handleDeleteNestedItem = (catId: string, itemId: string) => {
    const updated = weightedCategories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      }
      return cat;
    });
    saveWeightedCategories(updated);
  };

  // Points Mode updates
  const handleAddPointAssignment = () => {
    const newAssign: PointAssignment = {
      id: Date.now().toString(),
      name: "New Assignment",
      score: 10,
      total: 10,
      completed: true,
    };
    savePointsAssignments([...pointsAssignments, newAssign]);
  };

  const handleDeletePointAssignment = (id: string) => {
    savePointsAssignments(pointsAssignments.filter((a) => a.id !== id));
  };

  const handleUpdatePointAssignment = (id: string, field: keyof PointAssignment, value: any) => {
    const updated = pointsAssignments.map((a) => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    });
    savePointsAssignments(updated);
  };

  // GPA Course handlers
  const handleAddGPACourse = () => {
    const newCourse: GPACourse = {
      id: Date.now().toString(),
      name: "New Course",
      credits: 4,
      grade: "A",
      level: "Regular",
    };
    saveGpaCourses([...gpaCourses, newCourse]);
  };

  const handleDeleteGPACourse = (id: string) => {
    saveGpaCourses(gpaCourses.filter((c) => c.id !== id));
  };

  const handleUpdateGPACourse = (id: string, field: keyof GPACourse, value: any) => {
    const updated = gpaCourses.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    saveGpaCourses(updated);
  };

  // Scale handler
  const handleUpdateGPAScaleRule = (grade: string, field: "points" | "minPercent", value: number) => {
    const updated = gpaRules.map((rule) => {
      if (rule.grade === grade) {
        return { ...rule, [field]: value };
      }
      return rule;
    });
    saveGpaRules(updated);
  };

  // AI syllabus parsing action
  const handleParseSyllabus = async () => {
    if (!syllabusText.trim()) return;
    setIsParsing(true);
    setParseError("");

    try {
      const res = await fetch("/api/parse-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: syllabusText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse text");
      }

      const data = await res.json();

      // Successfully parsed! Pre-populate the forms based on extraction
      if (data.gradingSystem) {
        const mode = data.gradingSystem.toLowerCase().includes("point") ? "points" : "weighted";
        saveGradingMode(mode);

        if (mode === "weighted" && Array.isArray(data.categories) && data.categories.length > 0) {
          const formattedCategories: WeightedCategory[] = data.categories.map((cat: any, idx: number) => {
            // Is it final exam?
            const isFinal = cat.name.toLowerCase().includes("final");
            return {
              id: String(idx + 1),
              name: cat.name,
              weight: cat.weight || 10,
              currentScore: isFinal ? null : 90, // default placeholder grade for past, or null for final
              isExpanded: false,
              items: [],
            };
          });
          saveWeightedCategories(formattedCategories);
        } else if (mode === "points" && Array.isArray(data.categories)) {
          // Point assignments
          const formattedAssignments: PointAssignment[] = data.categories.map((cat: any, idx: number) => {
            const isFinal = cat.name.toLowerCase().includes("final");
            return {
              id: String(idx + 1),
              name: cat.name,
              score: isFinal ? 0 : Math.round((cat.totalPoints || 100) * 0.9), // assume 90% for past tasks
              total: cat.totalPoints || 100,
              completed: !isFinal,
            };
          });
          savePointsAssignments(formattedAssignments);
        }

        // Apply scale rules if extracted
        if (Array.isArray(data.gradingScale) && data.gradingScale.length > 0) {
          const mergedRules = gpaRules.map((r) => {
            const parsed = data.gradingScale.find((ps: any) => ps.grade.toUpperCase() === r.grade.toUpperCase());
            if (parsed) {
              return { ...r, minPercent: Number(parsed.minPercentage) };
            }
            return r;
          });
          saveGpaRules(mergedRules);
        }

        setShowImportDialog(false);
        setSyllabusText("");
      } else {
        throw new Error("Could not extract grading system cleanly. Please paste more section details.");
      }
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Something went wrong while communicating with Gemini API.");
    } finally {
      setIsParsing(false);
    }
  };

  // --- GRAPH RENDERING MATH ---
  // Coordinates mapper
  const graphPadding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = 460;
  const graphHeight = 220;

  const getSvgCoords = (xVal: number, yVal: number) => {
    // Map X (0 to 100) to Svg width range
    const xRange = graphWidth - graphPadding.left - graphPadding.right;
    const svgX = graphPadding.left + (xVal / 100) * xRange;

    // Map Y (0 to 100) to Svg height range (inverted for screen coordinates)
    const yRange = graphHeight - graphPadding.top - graphPadding.bottom;
    const svgY = graphPadding.top + yRange - (yVal / 100) * yRange;

    return { x: svgX, y: svgY };
  };

  // Generate path points
  const points: Array<{ xVal: number; yVal: number; svgX: number; svgY: number }> = [];

  if (gradingMode === "weighted") {
    // We calculate current earned weight contribution, and pending weight
    let totalCompletedWeight = 0;
    let earnedWeightContribution = 0;
    let pendingWeight = 0;

    weightedCategories.forEach((cat) => {
      let catScore = cat.currentScore;
      if (cat.items && cat.items.length > 0) {
        const sumEarned = cat.items.reduce((sum, item) => sum + item.score, 0);
        const sumMax = cat.items.reduce((sum, item) => sum + item.maxScore, 0);
        catScore = sumMax > 0 ? (sumEarned / sumMax) * 100 : 100;
      }

      if (catScore !== null) {
        earnedWeightContribution += (catScore * cat.weight) / 100;
        totalCompletedWeight += cat.weight;
      } else {
        pendingWeight += cat.weight;
      }
    });

    // Draw line from X=0% on remaining to X=100% on remaining
    for (let x = 0; x <= 100; x += 5) {
      // Final grade = current earned contribution + (pending weight * (x / 100))
      // Normalized to total percentage basis (usually 100% total syllabus weight)
      // If syllabus weights don't sum to 100, we scale it
      const sumSyllabusWeight = totalCompletedWeight + pendingWeight;
      const finalGrade = sumSyllabusWeight > 0 
        ? ((earnedWeightContribution + (pendingWeight * (x / 100))) / sumSyllabusWeight) * 100 
        : 100;
      const coords = getSvgCoords(x, finalGrade);
      points.push({ xVal: x, yVal: finalGrade, svgX: coords.x, svgY: coords.y });
    }
  } else {
    // Points Mode
    const completedAssignments = pointsAssignments.filter((a) => a.completed);
    const pendingAssignments = pointsAssignments.filter((a) => !a.completed);

    const earnedPoints = completedAssignments.reduce((sum, a) => sum + a.score, 0);
    const maxCompletedPoints = completedAssignments.reduce((sum, a) => sum + a.total, 0);
    const pendingPoints = pendingAssignments.reduce((sum, a) => sum + a.total, 0);
    const totalPossiblePoints = maxCompletedPoints + pendingPoints;

    for (let x = 0; x <= 100; x += 5) {
      // Final grade = (earned points + (pending points * (x / 100))) / totalPossiblePoints * 100
      const finalGrade = totalPossiblePoints > 0 
        ? ((earnedPoints + (pendingPoints * (x / 100))) / totalPossiblePoints) * 100 
        : 100;
      const coords = getSvgCoords(x, finalGrade);
      points.push({ xVal: x, yVal: finalGrade, svgX: coords.x, svgY: coords.y });
    }
  }

  // Create SVG path string
  const pathD = points.length > 0 
    ? `M ${points[0].svgX} ${points[0].svgY} ` + points.slice(1).map(p => `L ${p.svgX} ${p.svgY}`).join(" ")
    : "";

  // Fill area under path
  const floorCoords = getSvgCoords(0, 0);
  const endFloorCoords = getSvgCoords(100, 0);
  const fillD = points.length > 0
    ? `${pathD} L ${endFloorCoords.x} ${floorCoords.y} L ${floorCoords.x} ${floorCoords.y} Z`
    : "";

  // Get intersection coordinates for requiredScoreOnPending
  const targetRequiredScore = currentGradeResults.requiredScoreOnPending;
  const isTargetVisible = targetRequiredScore !== null && targetRequiredScore >= 0 && targetRequiredScore <= 100;
  const targetCoords = isTargetVisible ? getSvgCoords(targetRequiredScore, desiredGrade) : null;

  // Render scale threshold lines (A, B, C...)
  const scaleGridLines = [90, 80, 70, 60];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* HEADER section: pristine, minimalist style, with soft shadows and rich colors */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6" id="app-header-container">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900" id="app-title-main">
            Grade & GPA Checker
          </h1>
          <p className="text-sm text-slate-500 mt-1" id="app-subtitle">
            A minimalist workspace to compute required scores, project course grades, and map GPA pathways.
          </p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mt-4 md:mt-0 max-w-fit" id="nav-tabs-wrapper">
          <button
            id="tab-btn-class"
            onClick={() => setActiveTab("class")}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "class"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Calculator size={16} />
            <span>Class Grade Checker</span>
          </button>
          <button
            id="tab-btn-gpa"
            onClick={() => setActiveTab("gpa")}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "gpa"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <GraduationCap size={16} />
            <span>Semester GPA Planner</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: CLASS GRADE CHECKER */}
        {activeTab === "class" && (
          <motion.div
            key="class-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            id="tab-class-container"
          >
            {/* Input Column - Left 7 columns */}
            <div className="lg:col-span-7 space-y-6" id="class-inputs-column">
              {/* Class Header Configuration */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="class-config-card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="text"
                      id="input-class-title"
                      value={classTitle}
                      onChange={(e) => saveClassTitle(e.target.value)}
                      className="text-lg font-display font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none py-0.5 px-1 w-full"
                      placeholder="Class Title"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-import-syllabus"
                      onClick={() => setShowImportDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                      title="Analyze your course syllabus using AI to populate grades and categories automatically"
                    >
                      <Sparkles size={13} className="text-indigo-600 animate-pulse" />
                      <span>Import Syllabus with AI</span>
                    </button>
                    <button
                      id="btn-reset-class"
                      onClick={resetClassData}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                      title="Reset everything to defaults"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                </div>

                {/* Grading mode toggle and Desired Target Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Grading Structure
                    </label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="grading-mode-switch">
                      <button
                        id="btn-mode-weighted"
                        onClick={() => saveGradingMode("weighted")}
                        className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          gradingMode === "weighted"
                            ? "bg-white text-slate-800 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Weighted Assignments
                      </button>
                      <button
                        id="btn-mode-points"
                        onClick={() => saveGradingMode("points")}
                        className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          gradingMode === "points"
                            ? "bg-white text-slate-800 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Non-Weighted Assignments
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Desired Overall Grade
                      </label>
                      <span className="text-xs font-bold text-slate-700">{desiredGrade}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        id="desired-grade-slider"
                        min="50"
                        max="100"
                        step="0.5"
                        value={desiredGrade}
                        onChange={(e) => saveDesiredGrade(Number(e.target.value))}
                        className="w-full accent-slate-800 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        id="desired-grade-number"
                        min="0"
                        max="100"
                        value={desiredGrade}
                        onChange={(e) => saveDesiredGrade(Math.min(150, Math.max(0, Number(e.target.value))))}
                        className="w-14 text-center text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg py-1 focus:outline-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC LIST BASED ON GRADING FRAMEWORK */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="grade-items-card">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800">
                      {gradingMode === "weighted" ? "Grading Weights & Categories" : "Assignments & Deliverables"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {gradingMode === "weighted"
                        ? "Define categories and weights. Expand to track individual items within each."
                        : "List individual items with their total available and earned points."}
                    </p>
                  </div>
                  <button
                    id="btn-add-item"
                    onClick={gradingMode === "weighted" ? handleAddCategory : handleAddPointAssignment}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{gradingMode === "weighted" ? "Add Category" : "Add Assignment"}</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* WEIGHTED CATEGORIES RENDER */}
                  {gradingMode === "weighted" && (
                    <>
                      {weightedCategories.length === 0 ? (
                        <div className="p-8 text-center" id="empty-weighted-categories">
                          <p className="text-sm text-slate-500 font-medium">No grading categories defined yet.</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Click <strong>Add Category</strong> above to add one manually, or use the <strong>Syllabus AI Import</strong> button to parse your syllabus!
                          </p>
                        </div>
                      ) : (
                        weightedCategories.map((cat, idx) => (
                          <div key={cat.id} className="p-4 sm:p-6 space-y-4" id={`weighted-cat-${cat.id}`}>
                            {/* Category main bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  id={`btn-toggle-expand-${cat.id}`}
                                  onClick={() => handleUpdateCategory(cat.id, "isExpanded", !cat.isExpanded)}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                >
                                  {cat.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <input
                                  type="text"
                                  id={`input-cat-name-${cat.id}`}
                                  value={cat.name}
                                  onChange={(e) => handleUpdateCategory(cat.id, "name", e.target.value)}
                                  className="font-semibold text-sm text-slate-700 bg-transparent hover:border-slate-300 focus:border-slate-500 border-b border-transparent focus:outline-none py-0.5 w-full max-w-[200px]"
                                  placeholder="Category Name"
                                />
                              </div>

                              {/* Weight & current score */}
                              <div className="flex items-center gap-4 self-end sm:self-auto">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400">Weight:</span>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      id={`input-cat-weight-${cat.id}`}
                                      value={cat.weight}
                                      onChange={(e) => handleUpdateCategory(cat.id, "weight", Math.max(0, Number(e.target.value)))}
                                      className="w-14 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-md py-0.5 px-1 pr-3 focus:outline-slate-400"
                                    />
                                    <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-semibold">%</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">Average:</span>
                                  {cat.items && cat.items.length > 0 ? (
                                    <div className="bg-slate-100 text-slate-600 font-semibold text-xs py-1 px-2.5 rounded-lg border border-slate-200">
                                      {(
                                        Math.round(
                                          (cat.items.reduce((sum, i) => sum + i.score, 0) /
                                            cat.items.reduce((sum, i) => sum + i.maxScore, 0)) *
                                            10000
                                        ) / 100
                                      ).toFixed(1)}
                                      %
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        id={`input-cat-score-${cat.id}`}
                                        value={cat.currentScore === null ? "" : cat.currentScore}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          handleUpdateCategory(cat.id, "currentScore", val === "" ? null : Number(val));
                                        }}
                                        className="w-16 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-md py-0.5 focus:outline-slate-400 bg-slate-50"
                                        placeholder="Pending"
                                      />
                                      {cat.currentScore !== null && <span className="text-xs font-semibold text-slate-400">%</span>}
                                    </div>
                                  )}
                                </div>

                                <button
                                  id={`btn-delete-cat-${cat.id}`}
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Nested Items details */}
                            {cat.isExpanded && (
                              <div className="ml-8 pl-4 border-l-2 border-slate-100 space-y-3 bg-slate-50/50 p-3 rounded-lg" id={`expanded-cat-items-${cat.id}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-semibold text-slate-500">Individual Assignment Scores</span>
                                  <button
                                    id={`btn-add-nested-${cat.id}`}
                                    onClick={() => handleAddNestedItem(cat.id)}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
                                  >
                                    <PlusCircle size={12} />
                                    <span>Add Item</span>
                                  </button>
                                </div>

                                {cat.items.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No individual items. Category average is set manually above.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {cat.items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-3" id={`nested-item-${item.id}`}>
                                        <input
                                          type="text"
                                          id={`input-nested-item-name-${item.id}`}
                                          value={item.name}
                                          onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "name", e.target.value)}
                                          className="text-xs text-slate-600 bg-transparent hover:border-slate-300 focus:border-slate-400 border-b border-transparent focus:outline-none py-0.5 flex-1"
                                          placeholder="Item Name"
                                        />
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            id={`input-nested-item-score-${item.id}`}
                                            value={item.score}
                                            onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "score", Math.max(0, Number(e.target.value)))}
                                            className="w-12 text-center text-xs font-semibold text-slate-600 border border-slate-200 rounded py-0.5 bg-white focus:outline-slate-400"
                                          />
                                          <span className="text-xs text-slate-400">/</span>
                                          <input
                                            type="number"
                                            id={`input-nested-item-max-${item.id}`}
                                            value={item.maxScore}
                                            onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "maxScore", Math.max(1, Number(e.target.value)))}
                                            className="w-12 text-center text-xs font-semibold text-slate-600 border border-slate-200 rounded py-0.5 bg-white focus:outline-slate-400"
                                          />
                                        </div>
                                        <button
                                          id={`btn-delete-nested-${item.id}`}
                                          onClick={() => handleDeleteNestedItem(cat.id, item.id)}
                                          className="text-slate-300 hover:text-slate-500 p-1 cursor-pointer"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Cumulative Weight Validator Warning */}
                      {weightedCategories.length > 0 && (
                        <div className="px-6 py-3 bg-slate-50 flex items-center justify-between text-xs" id="weight-validator-banner">
                          <span className="text-slate-500 font-medium">Total weights allocated:</span>
                          <span
                            id="total-allocated-weights"
                            className={`font-bold ${
                              weightedCategories.reduce((sum, cat) => sum + cat.weight, 0) === 100
                                ? "text-green-600"
                                : "text-amber-600"
                            }`}
                          >
                            {weightedCategories.reduce((sum, cat) => sum + cat.weight, 0)}% / 100%
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* POINTS MODE RENDER */}
                  {gradingMode === "points" && (
                    <div className="p-4 sm:p-6" id="points-assignments-wrapper">
                      <div className="space-y-3">
                        {pointsAssignments.length === 0 ? (
                          <div className="p-8 text-center" id="empty-points-assignments">
                            <p className="text-sm text-slate-500 font-medium">No assignments added yet.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Click <strong>Add Assignment</strong> above to build your points breakdown, or use the <strong>Syllabus AI Import</strong> button to let AI parse your syllabus.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-12 gap-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider" id="points-assignments-header">
                              <div className="col-span-5">Assignment Name</div>
                              <div className="col-span-3 text-center">Score</div>
                              <div className="col-span-2 text-center">Completed</div>
                              <div className="col-span-2 text-center">Remove</div>
                            </div>

                            {pointsAssignments.map((a) => (
                              <div key={a.id} className="grid grid-cols-12 gap-3 items-center" id={`points-row-${a.id}`}>
                                <div className="col-span-5">
                                  <input
                                    type="text"
                                    id={`input-points-name-${a.id}`}
                                    value={a.name}
                                    onChange={(e) => handleUpdatePointAssignment(a.id, "name", e.target.value)}
                                    className="w-full text-sm font-medium text-slate-700 bg-transparent hover:border-slate-300 focus:border-slate-500 border-b border-transparent focus:outline-none py-1"
                                  />
                                </div>

                                <div className="col-span-3 flex justify-center items-center gap-1">
                                  {a.completed ? (
                                    <>
                                      <input
                                        type="number"
                                        id={`input-points-score-${a.id}`}
                                        value={a.score}
                                        onChange={(e) => handleUpdatePointAssignment(a.id, "score", Math.max(0, Number(e.target.value)))}
                                        className="w-12 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-md py-0.5 focus:outline-slate-400"
                                      />
                                      <span className="text-slate-400 text-xs">/</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium bg-slate-100 py-1 px-1.5 rounded-sm mr-1">
                                      Pending
                                    </span>
                                  )}
                                  <input
                                    type="number"
                                    id={`input-points-total-${a.id}`}
                                    value={a.total}
                                    onChange={(e) => handleUpdatePointAssignment(a.id, "total", Math.max(1, Number(e.target.value)))}
                                    className="w-12 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-md py-0.5 focus:outline-slate-400"
                                  />
                                </div>

                                <div className="col-span-2 flex justify-center">
                                  <button
                                    id={`btn-toggle-completed-${a.id}`}
                                    onClick={() => handleUpdatePointAssignment(a.id, "completed", !a.completed)}
                                    className={`w-5 h-5 flex items-center justify-center rounded border transition-all cursor-pointer ${
                                      a.completed
                                        ? "bg-slate-800 border-slate-800 text-white"
                                        : "border-slate-300 text-transparent hover:border-slate-400"
                                    }`}
                                  >
                                    <Check size={12} strokeWidth={3} />
                                  </button>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                  <button
                                    id={`btn-delete-point-${a.id}`}
                                    onClick={() => handleDeletePointAssignment(a.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calculations & Graph Column - Right 5 columns */}
            <div className="lg:col-span-5 space-y-6" id="class-results-column">
              {/* CURRENT GRADE SUMMARY CARD */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="grade-summary-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Current Standing</h4>
                    <p className="text-4xl font-display font-extrabold text-slate-900 mt-1">
                      {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0)
                        ? "—"
                        : `${currentGradeResults.currentOverallGrade}%`}
                    </p>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                    <TrendingUp size={20} className="text-slate-700" />
                  </div>
                </div>

                {/* TARGET ANALYTICS */}
                <div className="border-t border-slate-100 pt-5 space-y-4" id="target-analytics-section">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Desired Class Grade:</span>
                    <span className="font-bold text-slate-800">{desiredGrade}%</span>
                  </div>

                  {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0) ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs flex items-center gap-2" id="empty-standing-alert">
                      <Info size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-medium">Add assignments or categories to see your standing and required scores.</span>
                    </div>
                  ) : currentGradeResults.requiredScoreOnPending !== null ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2" id="verdict-card">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-slate-800" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Required Target Verdict</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        To finish with an overall class score of <strong className="text-slate-900">{desiredGrade}%</strong>, you need to average at least{" "}
                        <strong className="text-slate-900 text-base">{currentGradeResults.requiredScoreOnPending}%</strong> on your remaining{" "}
                        {gradingMode === "weighted"
                          ? `pending category weights (${(currentGradeResults as any).pendingWeight}%)`
                          : `pending assignments (${(currentGradeResults as any).pendingPoints} pts)`}
                        .
                      </p>

                      {currentGradeResults.requiredScoreOnPending !== null && currentGradeResults.requiredScoreOnPending > 100 && (
                        <div className="mt-2 text-xs text-amber-600 flex items-start gap-1 bg-amber-50 p-2 rounded border border-amber-100">
                          <Info size={12} className="mt-0.5 flex-shrink-0" />
                          <span>Warning: The required score exceeds 100%. You may need extra credit to reach this goal.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-800 text-xs flex items-center gap-2">
                      <Check size={14} className="text-green-600" />
                      <span className="font-medium">All categories/assignments are fully evaluated! That is your final grade.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* GRAPH PROJECTION CARD */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="projection-graph-card">
                <div>
                  <h4 className="font-display font-semibold text-slate-800">Grade Projection Curve</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Projects how your final course score responds to remaining test or category scores (0% to 100%).
                  </p>
                </div>

                <div className="relative border border-slate-100 rounded-lg p-2 bg-slate-50/50" id="svg-graph-container">
                  {/* Custom beautiful interactive SVG graph */}
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    className="w-full h-auto overflow-visible"
                    style={{ maxHeight: "240px" }}
                    id="projection-svg"
                  >
                    {/* SVG Filters for slick shadows */}
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal gridlines */}
                    {scaleGridLines.map((percent) => {
                      const { y } = getSvgCoords(0, percent);
                      return (
                        <g key={percent} opacity="0.3">
                          <line
                            x1={graphPadding.left}
                            y1={y}
                            x2={graphWidth - graphPadding.right}
                            y2={y}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                            strokeDasharray="2 3"
                          />
                          <text
                            x={graphPadding.left - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            className="font-mono fill-slate-400 font-semibold"
                          >
                            {percent}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Desired overall grade target line (Horizontal) */}
                    {desiredGrade > 0 && desiredGrade <= 100 && (
                      <g>
                        <line
                          x1={graphPadding.left}
                          y1={getSvgCoords(0, desiredGrade).y}
                          x2={graphWidth - graphPadding.right}
                          y2={getSvgCoords(100, desiredGrade).y}
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />
                        <text
                          x={graphWidth - graphPadding.right - 5}
                          y={getSvgCoords(0, desiredGrade).y - 6}
                          textAnchor="end"
                          fontSize="9"
                          className="font-bold fill-red-600 uppercase tracking-wider"
                        >
                          Goal: {desiredGrade}%
                        </text>
                      </g>
                    )}

                    {/* Area fill under curve */}
                    <path d={fillD} fill="url(#areaGrad)" />

                    {/* Main projection curve */}
                    <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Intersect / Target marker */}
                    {isTargetVisible && targetCoords && (
                      <g>
                        {/* Vertical line from intersection to floor */}
                        <line
                          x1={targetCoords.x}
                          y1={targetCoords.y}
                          x2={targetCoords.x}
                          y2={getSvgCoords(0, 0).y}
                          stroke="#475569"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                          opacity="0.7"
                        />
                        {/* Intersect point circle */}
                        <circle
                          cx={targetCoords.x}
                          cy={targetCoords.y}
                          r="6"
                          className="fill-slate-900 stroke-white stroke-2 shadow-sm animate-pulse"
                        />
                        {/* Text label coordinate */}
                        <text
                          x={targetCoords.x}
                          y={getSvgCoords(0, 0).y + 14}
                          textAnchor="middle"
                          fontSize="10"
                          className="font-mono font-bold fill-slate-700"
                        >
                          {targetRequiredScore}%
                        </text>
                      </g>
                    )}

                    {/* Interactive overlay points for hover coordinates */}
                    {points.map((p, index) => (
                      <circle
                        key={index}
                        cx={p.svgX}
                        cy={p.svgY}
                        r="12"
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            x: p.svgX,
                            y: p.svgY,
                            labelX: `Pending average: ${p.xVal}%`,
                            labelY: `Final grade: ${Math.round(p.yVal * 10) / 10}%`,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}

                    {/* Axes lines */}
                    <line
                      x1={graphPadding.left}
                      y1={getSvgCoords(0, 0).y}
                      x2={graphWidth - graphPadding.right}
                      y2={getSvgCoords(100, 0).y}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={graphPadding.left}
                      y1={graphPadding.top}
                      x2={graphPadding.left}
                      y2={getSvgCoords(0, 0).y}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />

                    {/* X-axis ticks (0%, 25%, 50%, 75%, 100%) */}
                    {[0, 25, 50, 75, 100].map((val) => {
                      const { x } = getSvgCoords(val, 0);
                      const { y } = getSvgCoords(0, 0);
                      return (
                        <g key={val}>
                          <line x1={x} y1={y} x2={x} y2={y + 4} stroke="#94a3b8" strokeWidth="1.5" />
                          <text
                            x={x}
                            y={y + 15}
                            textAnchor="middle"
                            fontSize="9"
                            className="font-mono fill-slate-400 font-semibold"
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Axis Labels */}
                    <text
                      x={graphPadding.left + (graphWidth - graphPadding.left - graphPadding.right) / 2}
                      y={graphHeight - 6}
                      textAnchor="middle"
                      fontSize="9"
                      className="font-semibold fill-slate-500 uppercase tracking-wider"
                    >
                      Score on Pending Remaining Assignments / Final Score
                    </text>
                  </svg>

                  {/* HTML Hover Tooltip overlay on Graph */}
                  {hoveredPoint && (
                    <div
                      className="absolute bg-slate-900 text-white p-2 rounded shadow-lg text-xs font-medium space-y-0.5 pointer-events-none z-10 border border-slate-800"
                      style={{
                        left: `${hoveredPoint.x + 10}px`,
                        top: `${hoveredPoint.y - 45}px`,
                      }}
                      id="graph-hover-tooltip"
                    >
                      <div className="font-bold">{hoveredPoint.labelY}</div>
                      <div className="text-[10px] text-slate-300">{hoveredPoint.labelX}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xs text-slate-400 italic pt-1" id="graph-tip-box">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    <span>Red: Goal Target</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900" />
                    <span>Marker: Intersection required score</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GPA CHECKER */}
        {activeTab === "gpa" && (
          <motion.div
            key="gpa-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            id="tab-gpa-container"
          >
            {/* Left side column: Scale Config / Rules - 4 columns */}
            <div className="lg:col-span-4 space-y-6" id="gpa-config-column">
              {/* Scale header */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="gpa-settings-card">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                    <Settings size={16} className="text-slate-500" />
                    <span>Your School's GPA Rules</span>
                  </h3>
                  <button
                    id="btn-toggle-scale-config"
                    onClick={() => setShowScaleConfig(!showScaleConfig)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    {showScaleConfig ? "Hide scale editor" : "Edit scale rules"}
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Different high schools and universities assign customized quality points to letter grades. Adjust them below to match your school handbook.
                </p>

                {/* Extra Boost Setup */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Weighted Course boosts
                  </span>
                  <div className="grid grid-cols-3 gap-2" id="gpa-weight-boosts">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Honors</label>
                      <input
                        type="number"
                        id="boost-honors"
                        step="0.1"
                        min="0"
                        value={weightingConfig.honorsBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, honorsBoost: Number(e.target.value) })}
                        className="w-full text-sm font-semibold text-center text-slate-700 border border-slate-200 rounded-md py-1 bg-slate-50 focus:outline-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">AP Courses</label>
                      <input
                        type="number"
                        id="boost-ap"
                        step="0.1"
                        min="0"
                        value={weightingConfig.apBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, apBoost: Number(e.target.value) })}
                        className="w-full text-sm font-semibold text-center text-slate-700 border border-slate-200 rounded-md py-1 bg-slate-50 focus:outline-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">IB Courses</label>
                      <input
                        type="number"
                        id="boost-ib"
                        step="0.1"
                        min="0"
                        value={weightingConfig.ibBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, ibBoost: Number(e.target.value) })}
                        className="w-full text-sm font-semibold text-center text-slate-700 border border-slate-200 rounded-md py-1 bg-slate-50 focus:outline-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Editable / Viewable grading scale table */}
                {showScaleConfig ? (
                  <div className="pt-2 border-t border-slate-100" id="scale-rules-editor-wrapper">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Points value table
                    </span>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 p-2 rounded-lg bg-slate-50/50" id="scale-editor-scroll">
                      {gpaRules.map((r) => (
                        <div key={r.grade} className="flex items-center justify-between gap-2" id={`scale-row-${r.grade}`}>
                          <span className="w-10 font-bold text-xs text-slate-600">{r.grade}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Points:</span>
                            <input
                              type="number"
                              id={`input-scale-points-${r.grade}`}
                              step="0.05"
                              min="0"
                              max="5"
                              value={r.points}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "points", Number(e.target.value))}
                              className="w-14 text-center text-xs font-semibold border border-slate-200 rounded bg-white py-0.5 focus:outline-slate-400"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Min %:</span>
                            <input
                              type="number"
                              id={`input-scale-min-${r.grade}`}
                              min="0"
                              max="100"
                              value={r.minPercent}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "minPercent", Number(e.target.value))}
                              className="w-12 text-center text-xs font-semibold border border-slate-200 rounded bg-white py-0.5 focus:outline-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100" id="scale-rules-preview-wrapper">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Standard Quality Reference
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center" id="scale-rules-grid">
                      {gpaRules.slice(0, 8).map((r) => (
                        <div key={r.grade} className="bg-slate-50 p-1.5 rounded border border-slate-100 flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-700">{r.grade}</span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{r.points} pt</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side column: GPA Courses + Dials - 8 columns */}
            <div className="lg:col-span-8 space-y-6" id="gpa-courses-column">
              {/* DIALS SUMMARY BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="gpa-stats-card">
                <div className="sm:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100" id="unweighted-gpa-stat">
                  <h4 className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Unweighted GPA</h4>
                  <p className="text-4xl font-display font-black text-slate-800" id="gpa-unweighted-val">
                    {gpaResult.unweightedGPA.toFixed(2)}
                  </p>
                  <span className="text-xs font-semibold text-slate-400 mt-1">out of 4.0 scale</span>
                </div>

                <div className="sm:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-900 rounded-xl text-white shadow-md relative overflow-hidden" id="weighted-gpa-stat">
                  <div className="absolute right-[-15px] top-[-15px] w-12 h-12 bg-white/5 rounded-full" />
                  <h4 className="font-semibold text-[10px] text-slate-300 uppercase tracking-wider mb-1">Weighted GPA</h4>
                  <p className="text-5xl font-display font-black text-white" id="gpa-weighted-val">
                    {gpaResult.weightedGPA.toFixed(2)}
                  </p>
                  <span className="text-xs font-semibold text-slate-300 mt-1">Honors/AP weighted</span>
                </div>

                <div className="sm:col-span-4 flex flex-col justify-center space-y-2.5" id="gpa-brief-card">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Load</h4>
                    <p className="text-base font-bold text-slate-800 mt-0.5" id="gpa-total-credits">
                      {gpaResult.totalCredits} Total Credits
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Summary</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                      Taking Honors or AP/IB classes boosts your Weighted GPA beyond the standard unweighted ceiling.
                    </p>
                  </div>
                </div>
              </div>

              {/* COURSE ROW EDITOR TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="gpa-course-editor-card">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800">Your Current Semester Courses</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Add, remove, or modify classes, credits, and grade outcomes.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-add-gpa-course"
                      onClick={handleAddGPACourse}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Class</span>
                    </button>
                    <button
                      id="btn-reset-gpa"
                      onClick={resetGPAData}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                      title="Reset GPA Planner to default"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6" id="gpa-courses-table-container">
                  <div className="space-y-3">
                    {gpaCourses.length === 0 ? (
                      <div className="p-8 text-center" id="empty-gpa-courses">
                        <p className="text-sm text-slate-500 font-medium">No courses added to this semester yet.</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Click <strong>Add Class</strong> above to start adding courses and mapping your GPA goals.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 gap-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50" id="gpa-courses-header">
                          <div className="col-span-5">Course / Subject</div>
                          <div className="col-span-3 text-center">Level Weight</div>
                          <div className="col-span-2 text-center">Credits</div>
                          <div className="col-span-2 text-center">Grade</div>
                        </div>

                        {gpaCourses.map((c) => (
                          <div key={c.id} className="grid grid-cols-12 gap-3 items-center group" id={`gpa-course-row-${c.id}`}>
                            <div className="col-span-5 flex items-center gap-2">
                              <button
                                id={`btn-delete-course-${c.id}`}
                                onClick={() => handleDeleteGPACourse(c.id)}
                                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Remove course"
                              >
                                <Trash2 size={13} />
                              </button>
                              <input
                                type="text"
                                id={`input-course-name-${c.id}`}
                                value={c.name}
                                onChange={(e) => handleUpdateGPACourse(c.id, "name", e.target.value)}
                                className="w-full text-sm font-medium text-slate-700 bg-transparent hover:border-slate-300 focus:border-slate-500 border-b border-transparent focus:outline-none py-1"
                              />
                            </div>

                            <div className="col-span-3">
                              <select
                                id={`select-course-level-${c.id}`}
                                value={c.level}
                                onChange={(e) => handleUpdateGPACourse(c.id, "level", e.target.value)}
                                className="w-full text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg p-1 focus:outline-none"
                              >
                                <option value="Regular">Regular (4.0 max)</option>
                                <option value="Honors">Honors (+0.5)</option>
                                <option value="AP">AP (+1.0)</option>
                                <option value="IB">IB (+1.0)</option>
                              </select>
                            </div>

                            <div className="col-span-2 text-center">
                              <input
                                type="number"
                                id={`input-course-credits-${c.id}`}
                                min="1"
                                max="10"
                                value={c.credits}
                                onChange={(e) => handleUpdateGPACourse(c.id, "credits", Math.max(1, Number(e.target.value)))}
                                className="w-12 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-md py-0.5 focus:outline-slate-400"
                              />
                            </div>

                            <div className="col-span-2 text-center">
                              <select
                                id={`select-course-grade-${c.id}`}
                                value={c.grade}
                                onChange={(e) => handleUpdateGPACourse(c.id, "grade", e.target.value)}
                                className="w-full text-sm font-bold text-slate-700 border border-slate-200 rounded-lg p-1 focus:outline-none"
                              >
                                {gpaRules.map((rule) => (
                                  <option key={rule.grade} value={rule.grade}>
                                    {rule.grade}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL / DIALOGS */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            id="syllabus-modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
              id="syllabus-modal-content"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" />
                  <h3 className="font-display font-semibold text-slate-800">AI Syllabus Analyzer</h3>
                </div>
                <button
                  id="btn-close-modal"
                  onClick={() => setShowImportDialog(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste course description, syllabus parts, or grading guidelines (e.g., &quot;Homework: 20%, Tests: 50%, Final: 30%&quot;) below. Gemini will automatically configure the correct grading framework, weights, categories, and scale for you!
                </p>

                <textarea
                  id="textarea-syllabus"
                  rows={6}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Example:
The grades are calculated as follows:
- Weekly problem sets: 20%
- Midterm examinations (three of them): 45%
- Lab reports: 15%
- Comprehensive final exam: 20%
Grade thresholds: A (93%), A- (90%), B+ (87%)..."
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-slate-400 resize-none"
                />

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg font-medium leading-normal" id="parse-error-box">
                    Error: {parseError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  id="btn-cancel-import"
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-import"
                  onClick={handleParseSyllabus}
                  disabled={isParsing || !syllabusText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-all cursor-pointer"
                >
                  {isParsing ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Parsing with Artificial Intellegence...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Extract & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
