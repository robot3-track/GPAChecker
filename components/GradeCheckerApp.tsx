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
  weight: number; 
  currentScore: number | null; 
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
  grade: string; 
  level: "Regular" | "Honors" | "AP" | "IB";
}

interface GPAScaleRule {
  grade: string;
  points: number;
  minPercent: number;
}

// STUDENT COMMENT: Standard scale, but honestly check your teacher's syllabus because 
// some of them do not believe in A+ and it completely ruins your semester goals.
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
    // STUDENT COMMENT: AP and IB get full 1.0 boost at our school. Honors gets 0.5. 
    // If your school uses a weird 5.0 scale change these settings immediately.
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

  const resetClassData = () => {
    if (confirm("Are you sure you want to reset class data? This action cannot be undone.")) {
      localStorage.removeItem("gc_classTitle");
      localStorage.removeItem("gc_desiredGrade");
      localStorage.removeItem("gc_gradingMode");
      localStorage.removeItem("gc_weightedCategories");
      localStorage.removeItem("gc_pointsAssignments");
      window.location.reload();
    }
  };

  const resetGPAData = () => {
    if (confirm("Are you sure you want to reset your GPA planner? This action cannot be undone.")) {
      localStorage.removeItem("gc_gpaCourses");
      localStorage.removeItem("gc_gpaRules");
      localStorage.removeItem("gc_weightingConfig");
      window.location.reload();
    }
  };

  // --- MATH CALCULATIONS ---
  const calculateWeightedGrade = () => {
    let totalWeight = 0;
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
        totalWeight += cat.weight;
      } else {
        pendingWeight += cat.weight;
      }
    });

    const currentOverallGrade = totalWeight > 0 ? (earnedWeightContribution / (totalWeight / 100)) : 100;

    let requiredScoreOnPending = null;
    if (pendingWeight > 0) {
      requiredScoreOnPending = ((desiredGrade - earnedWeightContribution) / pendingWeight) * 100;
    }

    // STUDENT COMMENT: Added a strict 120% cap here. Otherwise, if you are failing a class 
    // and set your target to a 98%, the required score goes to like 450% and breaks the SVG bounding box.
    const finalRequired = requiredScoreOnPending !== null ? Math.min(120, Math.round(requiredScoreOnPending * 100) / 100) : null;

    return {
      currentOverallGrade: Math.min(120, Math.round(currentOverallGrade * 100) / 100),
      totalEarnedWeightPercent: Math.round(earnedWeightContribution * 100) / 100,
      totalWeightEvaluated: totalWeight,
      pendingWeight,
      requiredScoreOnPending: finalRequired,
      earnedWeightContribution,
    };
  };

  const calculatePointsGrade = () => {
    const completedAssignments = pointsAssignments.filter((a) => a.completed);
    const pendingAssignments = pointsAssignments.filter((a) => !a.completed);

    const earnedPoints = completedAssignments.reduce((sum, a) => sum + a.score, 0);
    const maxCompletedPoints = completedAssignments.reduce((sum, a) => sum + a.total, 0);
    const pendingPoints = pendingAssignments.reduce((sum, a) => sum + a.total, 0);

    const totalPossiblePoints = maxCompletedPoints + pendingPoints;
    const currentOverallGrade = maxCompletedPoints > 0 ? (earnedPoints / maxCompletedPoints) * 100 : 100;

    const totalPointsNeeded = (desiredGrade / 100) * totalPossiblePoints;
    const remainingPointsNeeded = totalPointsNeeded - earnedPoints;

    let requiredScoreOnPending = null;
    if (pendingPoints > 0) {
      requiredScoreOnPending = (remainingPointsNeeded / pendingPoints) * 100;
    }

    // STUDENT COMMENT: Extra credit happens, so we allow up to 120% projection max, 
    // but absolutely nothing higher so people don't break the layout with joke inputs.
    const finalRequired = requiredScoreOnPending !== null ? Math.min(120, Math.round(requiredScoreOnPending * 100) / 100) : null;

    return {
      currentOverallGrade: Math.min(120, Math.round(currentOverallGrade * 100) / 100),
      earnedPoints,
      maxCompletedPoints,
      pendingPoints,
      totalPossiblePoints,
      remainingPointsNeeded: Math.max(0, Math.round(remainingPointsNeeded * 100) / 100),
      requiredScoreOnPending: finalRequired,
    };
  };

  const currentGradeResults = gradingMode === "weighted" ? calculateWeightedGrade() : calculatePointsGrade();

  const calculateGPA = () => {
    let totalCredits = 0;
    let totalUnweightedGpaPoints = 0;
    let totalWeightedGpaPoints = 0;

    gpaCourses.forEach((course) => {
      const scaleRule = gpaRules.find((r) => r.grade === course.grade);
      const gradePoints = scaleRule ? scaleRule.points : 0;

      totalUnweightedGpaPoints += gradePoints * course.credits;

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

  const handleUpdateGPAScaleRule = (grade: string, field: "points" | "minPercent", value: number) => {
    const updated = gpaRules.map((rule) => {
      if (rule.grade === grade) {
        return { ...rule, [field]: value };
      }
      return rule;
    });
    saveGpaRules(updated);
  };

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

      if (data.gradingSystem) {
        const mode = data.gradingSystem.toLowerCase().includes("point") ? "points" : "weighted";
        saveGradingMode(mode);

        if (mode === "weighted" && Array.isArray(data.categories) && data.categories.length > 0) {
          const formattedCategories: WeightedCategory[] = data.categories.map((cat: any, idx: number) => {
            const isFinal = cat.name.toLowerCase().includes("final");
            return {
              id: String(idx + 1),
              name: cat.name,
              weight: cat.weight || 10,
              currentScore: isFinal ? null : 90,
              isExpanded: false,
              items: [],
            };
          });
          saveWeightedCategories(formattedCategories);
        } else if (mode === "points" && Array.isArray(data.categories)) {
          const formattedAssignments: PointAssignment[] = data.categories.map((cat: any, idx: number) => {
            const isFinal = cat.name.toLowerCase().includes("final");
            return {
              id: String(idx + 1),
              name: cat.name,
              score: isFinal ? 0 : Math.round((cat.totalPoints || 100) * 0.9), 
              total: cat.totalPoints || 100,
              completed: !isFinal,
            };
          });
          savePointsAssignments(formattedAssignments);
        }

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
        throw new Error("Could not extract grading system cleanly. Please check the text and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Something went wrong while processing your syllabus.");
    } finally {
      setIsParsing(false);
    }
  };

  // --- GRAPH RENDERING MATH ---
  const graphPadding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = 460;
  const graphHeight = 220;

  // STUDENT COMMENT: The Y-axis maxes out elegantly at 120 so the curve doesn't clip out 
  // into space if you have a massive extra credit score.
  const getSvgCoords = (xVal: number, yVal: number) => {
    const clampedY = Math.min(120, Math.max(0, yVal));
    const xRange = graphWidth - graphPadding.left - graphPadding.right;
    const svgX = graphPadding.left + (xVal / 100) * xRange;

    const yRange = graphHeight - graphPadding.top - graphPadding.bottom;
    const svgY = graphPadding.top + yRange - (clampedY / 120) * yRange;

    return { x: svgX, y: svgY };
  };

  const points: Array<{ xVal: number; yVal: number; svgX: number; svgY: number }> = [];

  if (gradingMode === "weighted") {
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

    for (let x = 0; x <= 100; x += 5) {
      const sumSyllabusWeight = totalCompletedWeight + pendingWeight;
      const finalGrade = sumSyllabusWeight > 0 
        ? ((earnedWeightContribution + (pendingWeight * (x / 100))) / sumSyllabusWeight) * 100 
        : 100;
      const cappedFinalGrade = Math.min(120, finalGrade);
      const coords = getSvgCoords(x, cappedFinalGrade);
      points.push({ xVal: x, yVal: cappedFinalGrade, svgX: coords.x, svgY: coords.y });
    }
  } else {
    const completedAssignments = pointsAssignments.filter((a) => a.completed);
    const pendingAssignments = pointsAssignments.filter((a) => !a.completed);

    const earnedPoints = completedAssignments.reduce((sum, a) => sum + a.score, 0);
    const maxCompletedPoints = completedAssignments.reduce((sum, a) => sum + a.total, 0);
    const pendingPoints = pendingAssignments.reduce((sum, a) => sum + a.total, 0);
    const totalPossiblePoints = maxCompletedPoints + pendingPoints;

    for (let x = 0; x <= 100; x += 5) {
      const finalGrade = totalPossiblePoints > 0 
        ? ((earnedPoints + (pendingPoints * (x / 100))) / totalPossiblePoints) * 100 
        : 100;
      const cappedFinalGrade = Math.min(120, finalGrade);
      const coords = getSvgCoords(x, cappedFinalGrade);
      points.push({ xVal: x, yVal: cappedFinalGrade, svgX: coords.x, svgY: coords.y });
    }
  }

  const pathD = points.length > 0 
    ? `M ${points[0].svgX} ${points[0].svgY} ` + points.slice(1).map(p => `L ${p.svgX} ${p.svgY}`).join(" ")
    : "";

  const floorCoords = getSvgCoords(0, 0);
  const endFloorCoords = getSvgCoords(100, 0);
  const fillD = points.length > 0
    ? `${pathD} L ${endFloorCoords.x} ${floorCoords.y} L ${floorCoords.x} ${floorCoords.y} Z`
    : "";

  const targetRequiredScore = currentGradeResults.requiredScoreOnPending;
  // STUDENT COMMENT: The horizontal/vertical line helper stays hidden if you need higher than 120% 
  // because that means it's physically impossible anyway.
  const isTargetVisible = targetRequiredScore !== null && targetRequiredScore >= 0 && targetRequiredScore <= 120;
  const targetCoords = isTargetVisible ? getSvgCoords(targetRequiredScore, desiredGrade) : null;

  const scaleGridLines = [110, 90, 70, 50];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans text-gray-900 bg-gray-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Grade & GPA Checker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Built by students, for students. Calculate required finals scores and project semester outcomes.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 md:mt-0 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("class")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "class"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Calculator size={16} />
            <span>Class Grade Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab("gpa")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "gpa"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Input Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Class Configuration Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-5">
                  <input
                    type="text"
                    value={classTitle}
                    onChange={(e) => saveClassTitle(e.target.value)}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:outline-none py-1 w-full max-w-sm transition-colors"
                    placeholder="Enter Course Title..."
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowImportDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors cursor-pointer shadow-sm"
                    >
                      <Sparkles size={14} />
                      <span>Import Syllabus with AI</span>
                    </button>
                    <button
                      onClick={resetClassData}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer shadow-sm"
                      title="Clear all class data"
                    >
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Grading Structure
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
                      <button
                        onClick={() => saveGradingMode("weighted")}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          gradingMode === "weighted"
                            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Weighted
                      </button>
                      <button
                        onClick={() => saveGradingMode("points")}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          gradingMode === "points"
                            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Total Points
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Desired Target Grade
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="120"
                        step="0.5"
                        value={desiredGrade}
                        onChange={(e) => saveDesiredGrade(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={desiredGrade}
                          onChange={(e) => saveDesiredGrade(Math.min(120, Math.max(0, Number(e.target.value))))}
                          className="w-16 text-center text-sm font-medium text-gray-900 border border-gray-300 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                        <span className="ml-1 text-gray-500 font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Grading List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-800">
                    {gradingMode === "weighted" ? "Categories & Weights" : "Assignment List"}
                  </h3>
                  <button
                    onClick={gradingMode === "weighted" ? handleAddCategory : handleAddPointAssignment}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>
                      {gradingMode === "weighted" ? "Add Grading Category" : "Add New Assignment"}
                    </span>
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* WEIGHTED MODE */}
                  {gradingMode === "weighted" && (
                    <>
                      {weightedCategories.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                          <p className="font-medium text-gray-600">No grading categories defined.</p>
                          <p className="text-sm mt-1">Click "Add Grading Category" or use AI to import your syllabus.</p>
                        </div>
                      ) : (
                        weightedCategories.map((cat) => (
                          <div key={cat.id} className="p-4 sm:p-6 transition-colors hover:bg-gray-50/50">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => handleUpdateCategory(cat.id, "isExpanded", !cat.isExpanded)}
                                  className="p-1.5 text-gray-400 border border-gray-200 bg-white rounded-md hover:bg-gray-50 hover:text-gray-600 transition-colors shadow-sm cursor-pointer"
                                >
                                  {cat.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <input
                                  type="text"
                                  value={cat.name}
                                  onChange={(e) => handleUpdateCategory(cat.id, "name", e.target.value)}
                                  className="font-medium text-gray-900 border-b border-gray-300 bg-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none py-1 w-full max-w-[220px]"
                                  placeholder="Category Name"
                                />
                              </div>

                              <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500">Weight:</span>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={cat.weight}
                                      onChange={(e) => handleUpdateCategory(cat.id, "weight", Math.max(0, Number(e.target.value)))}
                                      className="w-16 text-center text-sm font-medium text-gray-900 border border-gray-300 rounded-md py-1 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    />
                                    <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-medium">%</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500">Avg (Max=120%):</span>
                                  {cat.items && cat.items.length > 0 ? (
                                    <div className="bg-gray-100 text-gray-700 font-medium text-sm py-1 px-3 rounded-md border border-gray-200">
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
                                        value={cat.currentScore === null ? "" : cat.currentScore}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          // STUDENT COMMENT: Max out single manual scores at 120% too so they don't break the individual item average layout rows.
                                          handleUpdateCategory(cat.id, "currentScore", val === "" ? null : Math.min(120, Number(val)));
                                        }}
                                        className="w-16 text-center text-sm font-medium text-gray-900 border border-gray-300 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder:text-gray-400"
                                        placeholder="TBD"
                                      />
                                      {cat.currentScore !== null && <span className="text-sm text-gray-400">%</span>}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            {/* Nested Items details */}
                            {cat.isExpanded && (
                              <div className="mt-4 ml-8 pl-4 border-l-2 border-gray-200 space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Individual Assignments</span>
                                  <button
                                    onClick={() => handleAddNestedItem(cat.id)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer shadow-sm"
                                  >
                                    <PlusCircle size={12} />
                                    <span>Add Item</span>
                                  </button>
                                </div>
                                {cat.items.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic">No specific assignments logged. Average is manually set above.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {cat.items.map((item) => (
                                      <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "name", e.target.value)}
                                          className="text-sm text-gray-700 border-b border-gray-300 bg-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none py-1 w-full sm:w-auto flex-1"
                                          placeholder="Item Name"
                                        />
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            value={item.score}
                                            onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "score", Math.max(0, Number(e.target.value)))}
                                            className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                          />
                                          <span className="text-sm font-medium text-gray-400">/</span>
                                          <input
                                            type="number"
                                            value={item.maxScore}
                                            onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "maxScore", Math.max(1, Number(e.target.value)))}
                                            className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                          />
                                        </div>
                                        <button
                                          onClick={() => handleDeleteNestedItem(cat.id, item.id)}
                                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                          title="Remove Item"
                                        >
                                          <X size={16} />
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
                      
                      {weightedCategories.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between text-sm border-t border-gray-200">
                          <span className="text-gray-600 font-medium">Total Assigned Weight:</span>
                          <span className={`font-semibold ${
                            weightedCategories.reduce((sum, cat) => sum + cat.weight, 0) === 100
                              ? "text-green-700"
                              : "text-amber-600"
                          }`}>
                            {weightedCategories.reduce((sum, cat) => sum + cat.weight, 0)}% / 100%
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* POINTS MODE */}
                  {gradingMode === "points" && (
                    <div className="p-4 sm:p-6">
                      {pointsAssignments.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                          <p className="font-medium text-gray-600">No assignments added yet.</p>
                          <p className="text-sm mt-1">Add assignments manually or use AI syllabus import.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                            <div className="col-span-5">Assignment Title</div>
                            <div className="col-span-3 text-center">Score / Max</div>
                            <div className="col-span-2 text-center">Graded?</div>
                            <div className="col-span-2 text-center">Remove</div>
                          </div>
                          {pointsAssignments.map((a) => (
                            <div key={a.id} className="grid grid-cols-12 gap-3 items-center py-1">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={a.name}
                                  onChange={(e) => handleUpdatePointAssignment(a.id, "name", e.target.value)}
                                  className="w-full text-sm font-medium text-gray-800 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none py-1"
                                />
                              </div>
                              <div className="col-span-3 flex justify-center items-center gap-1.5">
                                {a.completed ? (
                                  <>
                                    <input
                                      type="number"
                                      value={a.score}
                                      onChange={(e) => handleUpdatePointAssignment(a.id, "score", Math.max(0, Number(e.target.value)))}
                                      className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                    <span className="text-gray-400 font-medium">/</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1.5 rounded mr-1 border border-gray-200">
                                    Pending
                                  </span>
                                )}
                                <input
                                  type="number"
                                  value={a.total}
                                  onChange={(e) => handleUpdatePointAssignment(a.id, "total", Math.max(1, Number(e.target.value)))}
                                  className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                />
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <button
                                  onClick={() => handleUpdatePointAssignment(a.id, "completed", !a.completed)}
                                  className={`w-6 h-6 flex items-center justify-center rounded border shadow-sm transition-colors cursor-pointer ${
                                    a.completed 
                                      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" 
                                      : "bg-white border-gray-300 text-transparent hover:bg-gray-50"
                                  }`}
                                >
                                  <Check size={14} strokeWidth={3} />
                                </button>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <button
                                  onClick={() => handleDeletePointAssignment(a.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calculations Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* SUMMARY CARD */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Current Standing</h4>
                    <p className="text-4xl font-bold text-gray-900 mt-1">
                      {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0)
                        ? "—"
                        : `${currentGradeResults.currentOverallGrade}%`}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-600">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Desired Target Grade:</span>
                    <span className="font-semibold text-gray-900">{desiredGrade}%</span>
                  </div>

                  {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0) ? (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-sm flex gap-2">
                      <Info size={18} className="shrink-0 text-gray-400" />
                      <span>Add assignments or categories to view your required score projections.</span>
                    </div>
                  ) : currentGradeResults.requiredScoreOnPending !== null ? (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-blue-800 tracking-wide">Required Target</h4>
                      <p className="text-sm font-medium text-blue-900 leading-relaxed">
                        To achieve an overall grade of <strong>{desiredGrade}%</strong>, you need to average at least{" "}
                        <strong className="text-lg bg-blue-200 px-1.5 rounded">
                          {currentGradeResults.requiredScoreOnPending > 100 
                            ? "Extra Credit needed (>100%)" 
                            : `${currentGradeResults.requiredScoreOnPending}%`}
                        </strong> on your remaining{" "}
                        {gradingMode === "weighted"
                          ? `pending weight (${(currentGradeResults as any).pendingWeight}%)`
                          : `pending assignments (${(currentGradeResults as any).pendingPoints} pts)`}
                        .
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium flex gap-2">
                      <Check size={18} className="shrink-0" />
                      <span>All coursework is graded. This is your final course grade!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* GRAPH CARD */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-gray-800">Score Projection Curve</h4>
                  <p className="text-xs text-gray-500 mt-1">Visualizes potential final grades based on remaining coursework.</p>
                </div>
                
                <div className="relative border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    className="w-full h-auto overflow-visible"
                    style={{ maxHeight: "240px" }}
                  >
                    {/* STUDENT COMMENT: Modified grid lines to include 110% because extra credit is real life */}
                    {scaleGridLines.map((percent) => {
                      const { y } = getSvgCoords(0, percent);
                      return (
                        <g key={percent}>
                          <line
                            x1={graphPadding.left} y1={y} x2={graphWidth - graphPadding.right} y2={y}
                            stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4"
                          />
                          <text
                            x={graphPadding.left - 8} y={y + 4} textAnchor="end" fontSize="10" className="font-medium fill-gray-500"
                          >
                            {percent}%
                          </text>
                        </g>
                      );
                    })}

                    {desiredGrade > 0 && desiredGrade <= 120 && (
                      <g>
                        <line
                          x1={graphPadding.left} y1={getSvgCoords(0, desiredGrade).y}
                          x2={graphWidth - graphPadding.right} y2={getSvgCoords(100, desiredGrade).y}
                          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3"
                        />
                        <text
                          x={graphWidth - graphPadding.right - 5} y={getSvgCoords(0, desiredGrade).y - 8}
                          textAnchor="end" fontSize="10" className="font-semibold fill-red-600 uppercase"
                        >
                          Target: {desiredGrade}%
                        </text>
                      </g>
                    )}

                    <path d={fillD} fill="#e2e8f0" opacity="0.5" />
                    <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" />

                    {isTargetVisible && targetCoords && (
                      <g>
                        <line
                          x1={targetCoords.x} y1={targetCoords.y} x2={targetCoords.x} y2={getSvgCoords(0, 0).y}
                          stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4"
                        />
                        <circle cx={targetCoords.x} cy={targetCoords.y} r="5" className="fill-white stroke-blue-600 stroke-2" />
                        <text
                          x={targetCoords.x} y={getSvgCoords(0, 0).y + 14} textAnchor="middle" fontSize="11" className="font-bold fill-gray-800"
                        >
                          {targetRequiredScore}%
                        </text>
                      </g>
                    )}

                    {points.map((p, index) => (
                      <circle
                        key={index} cx={p.svgX} cy={p.svgY} r="12" fill="transparent" className="cursor-crosshair"
                        onMouseEnter={() =>
                          setHoveredPoint({ x: p.svgX, y: p.svgY, labelX: `Avg on remaining: ${p.xVal}%`, labelY: `Final Grade: ${Math.round(p.yVal * 10) / 10}%` })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}

                    <line
                      x1={graphPadding.left} y1={getSvgCoords(0, 0).y} x2={graphWidth - graphPadding.right} y2={getSvgCoords(100, 0).y}
                      stroke="#94a3b8" strokeWidth="1.5"
                    />
                    <line
                      x1={graphPadding.left} y1={graphPadding.top} x2={graphPadding.left} y2={getSvgCoords(0, 0).y}
                      stroke="#94a3b8" strokeWidth="1.5"
                    />

                    {[0, 25, 50, 75, 100].map((val) => {
                      const { x } = getSvgCoords(val, 0);
                      const { y } = getSvgCoords(0, 0);
                      return (
                        <g key={val}>
                          <line x1={x} y1={y} x2={x} y2={y + 5} stroke="#94a3b8" strokeWidth="1.5" />
                          <text x={x} y={y + 18} textAnchor="middle" fontSize="10" className="font-medium fill-gray-600">
                            {val}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {hoveredPoint && (
                    <div
                      className="absolute bg-gray-900 text-white p-2 rounded-md shadow-md text-xs font-medium z-10 pointer-events-none"
                      style={{ left: `${hoveredPoint.x + 15}px`, top: `${hoveredPoint.y - 45}px` }}
                    >
                      <div className="font-bold mb-0.5">{hoveredPoint.labelY}</div>
                      <div className="text-gray-300 text-[11px]">{hoveredPoint.labelX}</div>
                    </div>
                  )}
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Scale Config Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Settings size={18} className="text-gray-500" /> GPA Grading Rules
                  </h3>
                  <button
                    onClick={() => setShowScaleConfig(!showScaleConfig)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {showScaleConfig ? "Hide Grading Scale" : "Edit Grading Scale"}
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Weighted Course Boosts
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Honors</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.honorsBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, honorsBoost: Number(e.target.value) })}
                        className="w-full text-center text-sm font-medium border border-gray-300 rounded-md py-1.5 focus:ring-1 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">AP</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.apBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, apBoost: Number(e.target.value) })}
                        className="w-full text-center text-sm font-medium border border-gray-300 rounded-md py-1.5 focus:ring-1 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">IB</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.ibBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, ibBoost: Number(e.target.value) })}
                        className="w-full text-center text-sm font-medium border border-gray-300 rounded-md py-1.5 focus:ring-1 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {showScaleConfig ? (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scale Editor</span>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {gpaRules.map((r) => (
                        <div key={r.grade} className="flex items-center justify-between gap-3 bg-gray-50 p-2 rounded border border-gray-200">
                          <span className="w-8 font-bold text-gray-700 text-sm">{r.grade}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Pts:</span>
                            <input
                              type="number" step="0.05" min="0" max="5"
                              value={r.points}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "points", Number(e.target.value))}
                              className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 shadow-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Min %:</span>
                            <input
                              type="number" min="0" max="100"
                              value={r.minPercent}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "minPercent", Number(e.target.value))}
                              className="w-16 text-center text-sm font-medium border border-gray-300 rounded py-1 shadow-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scale Preview</span>
                    <div className="grid grid-cols-4 gap-2">
                      {gpaRules.slice(0, 8).map((r) => (
                        <div key={r.grade} className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex flex-col items-center">
                          <span className="font-semibold text-gray-800 text-sm">{r.grade}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{r.points} pt</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GPA Courses Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center justify-center p-6 border border-gray-200 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Unweighted GPA</h4>
                  <p className="text-5xl font-bold text-gray-900 mt-2">{gpaResult.unweightedGPA.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 border border-blue-200 bg-blue-50 rounded-xl relative overflow-hidden shadow-inner">
                  <h4 className="font-semibold text-xs text-blue-700 uppercase tracking-wide">Weighted GPA</h4>
                  <p className="text-5xl font-bold text-blue-900 mt-2">{gpaResult.weightedGPA.toFixed(2)}</p>
                  <span className="text-xs font-medium mt-3 bg-white border border-blue-200 text-blue-800 px-3 py-1 rounded-full shadow-sm">
                    {gpaResult.totalCredits} Total Credits
                  </span>
                </div>
              </div>

              {/* Course List Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Semester Course List</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddGPACourse}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus size={16} /> <span>Add New Course</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {gpaCourses.length === 0 ? (
                    <div className="text-center p-10">
                      <p className="font-medium text-gray-600">No courses mapped out yet.</p>
                      <p className="text-sm text-gray-500 mt-1">Click "Add New Course" to start planning your GPA.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                        <div className="col-span-5">Course Title</div>
                        <div className="col-span-3">Level</div>
                        <div className="col-span-2 text-center">Credits</div>
                        <div className="col-span-2 text-center">Grade</div>
                      </div>

                      {gpaCourses.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 gap-3 items-center py-1">
                          <div className="col-span-5 flex items-center gap-3">
                            <button
                              onClick={() => handleDeleteGPACourse(c.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                              title="Remove Course"
                            >
                              <Trash2 size={16} />
                            </button>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => handleUpdateGPACourse(c.id, "name", e.target.value)}
                              className="w-full text-sm font-medium text-gray-900 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none py-1"
                              placeholder="Course Name"
                            />
                          </div>

                          <div className="col-span-3">
                            <select
                              value={c.level}
                              onChange={(e) => handleUpdateGPACourse(c.id, "level", e.target.value)}
                              className="w-full text-sm font-medium border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm"
                            >
                              <option value="Regular">Regular</option>
                              <option value="Honors">Honors</option>
                              <option value="AP">AP</option>
                              <option value="IB">IB</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number" min="1" max="10" step="0.5"
                              value={c.credits}
                              onChange={(e) => handleUpdateGPACourse(c.id, "credits", Math.max(0.5, Number(e.target.value)))}
                              className="w-full text-center text-sm font-medium border border-gray-300 rounded-md py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                            />
                          </div>

                          <div className="col-span-2">
                            <select
                              value={c.grade}
                              onChange={(e) => handleUpdateGPACourse(c.id, "grade", e.target.value)}
                              className="w-full text-sm font-semibold border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-center shadow-sm"
                            >
                              {gpaRules.map((rule) => (
                                <option key={rule.grade} value={rule.grade}>{rule.grade}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI IMPORT DIALOG MODAL */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600" /> Syllabus AI Importer
                </h3>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Paste sections from your course syllabus. The AI will automatically extract the grading framework, weights, categories, and scale.
                </p>

                <textarea
                  rows={6}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 placeholder:text-gray-400"
                  placeholder="Example: Tests are 40%, Homework is 30%, Final is 30%. Grading: A > 92, B > 84..."
                />

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex gap-2 items-start">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParseSyllabus}
                  disabled={isParsing || !syllabusText.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent hover:bg-blue-700 disabled:bg-blue-300 rounded-md shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  {isParsing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Extracting Data...</span>
                    </>
                  ) : (
                    "Extract Syllabus Data"
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