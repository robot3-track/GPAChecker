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

    return {
      currentOverallGrade: Math.round(currentOverallGrade * 100) / 100,
      totalEarnedWeightPercent: Math.round(earnedWeightContribution * 100) / 100,
      totalWeightEvaluated: totalWeight,
      pendingWeight,
      requiredScoreOnPending: requiredScoreOnPending !== null ? Math.round(requiredScoreOnPending * 100) / 100 : null,
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
  const graphPadding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = 460;
  const graphHeight = 220;

  const getSvgCoords = (xVal: number, yVal: number) => {
    const xRange = graphWidth - graphPadding.left - graphPadding.right;
    const svgX = graphPadding.left + (xVal / 100) * xRange;

    const yRange = graphHeight - graphPadding.top - graphPadding.bottom;
    const svgY = graphPadding.top + yRange - (yVal / 100) * yRange;

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
      const coords = getSvgCoords(x, finalGrade);
      points.push({ xVal: x, yVal: finalGrade, svgX: coords.x, svgY: coords.y });
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
      const coords = getSvgCoords(x, finalGrade);
      points.push({ xVal: x, yVal: finalGrade, svgX: coords.x, svgY: coords.y });
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
  const isTargetVisible = targetRequiredScore !== null && targetRequiredScore >= 0 && targetRequiredScore <= 100;
  const targetCoords = isTargetVisible ? getSvgCoords(targetRequiredScore, desiredGrade) : null;

  const scaleGridLines = [90, 80, 70, 60];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      {/* HEADER section: Simplistic borders, square corners */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-black pb-4" id="app-header-container">
        <div>
          <h1 className="text-3xl font-bold text-black" id="app-title-main">
            Grade & GPA Checker
          </h1>
          <p className="text-sm text-gray-600 mt-1" id="app-subtitle">
            A basic workspace to compute required scores, project course grades, and map GPA.
          </p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 mt-4 md:mt-0" id="nav-tabs-wrapper">
          <button
            id="tab-btn-class"
            onClick={() => setActiveTab("class")}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold transition-all cursor-pointer ${
              activeTab === "class"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            <Calculator size={16} />
            <span>Class Grade</span>
          </button>
          <button
            id="tab-btn-gpa"
            onClick={() => setActiveTab("gpa")}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold transition-all cursor-pointer ${
              activeTab === "gpa"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            <GraduationCap size={16} />
            <span>Semester GPA</span>
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
            id="tab-class-container"
          >
            {/* Input Column */}
            <div className="lg:col-span-7 space-y-6" id="class-inputs-column">
              {/* Class Header Configuration */}
              <div className="bg-white p-6 border-2 border-gray-400 space-y-4" id="class-config-card">
                <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="text"
                      id="input-class-title"
                      value={classTitle}
                      onChange={(e) => saveClassTitle(e.target.value)}
                      className="text-lg font-bold text-black bg-transparent border-b-2 border-dashed border-gray-400 focus:border-black focus:outline-none py-1 px-1 w-full"
                      placeholder="Enter Class Title..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-import-syllabus"
                      onClick={() => setShowImportDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-100 border-2 border-blue-400 hover:bg-blue-200 transition-all cursor-pointer"
                      title="Analyze your course syllabus using AI"
                    >
                      <Sparkles size={13} />
                      <span>AI Import</span>
                    </button>
                    <button
                      id="btn-reset-class"
                      onClick={resetClassData}
                      className="p-1.5 border-2 border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                      title="Reset everything to defaults"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-bold text-black uppercase mb-2">
                      Grading Structure
                    </label>
                    <div className="flex border-2 border-gray-400" id="grading-mode-switch">
                      <button
                        id="btn-mode-weighted"
                        onClick={() => saveGradingMode("weighted")}
                        className={`flex-1 py-1 px-3 text-xs font-bold border-r-2 border-gray-400 transition-all cursor-pointer ${
                          gradingMode === "weighted"
                            ? "bg-gray-300 text-black"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Weighted
                      </button>
                      <button
                        id="btn-mode-points"
                        onClick={() => saveGradingMode("points")}
                        className={`flex-1 py-1 px-3 text-xs font-bold transition-all cursor-pointer ${
                          gradingMode === "points"
                            ? "bg-gray-300 text-black"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Points
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-black uppercase">
                        Desired Grade Target
                      </label>
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
                        className="w-full h-2 bg-gray-300 cursor-pointer"
                      />
                      <input
                        type="number"
                        id="desired-grade-number"
                        min="0"
                        max="100"
                        value={desiredGrade}
                        onChange={(e) => saveDesiredGrade(Math.min(150, Math.max(0, Number(e.target.value))))}
                        className="w-16 text-center text-sm font-bold text-black border-2 border-gray-400 py-1 focus:outline-black"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC LIST */}
              <div className="bg-white border-2 border-gray-400" id="grade-items-card">
                <div className="px-6 py-4 border-b-2 border-gray-400 flex justify-between items-center bg-gray-100">
                  <h3 className="font-bold text-black">
                    {gradingMode === "weighted" ? "Categories & Weights" : "Assignment List"}
                  </h3>
                  <button
                    id="btn-add-item"
                    onClick={gradingMode === "weighted" ? handleAddCategory : handleAddPointAssignment}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold border-2 border-black bg-white hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="divide-y-2 divide-gray-200">
                  {/* WEIGHTED */}
                  {gradingMode === "weighted" && (
                    <>
                      {weightedCategories.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                          <p className="font-bold">No categories added.</p>
                        </div>
                      ) : (
                        weightedCategories.map((cat) => (
                          <div key={cat.id} className="p-4 sm:p-6" id={`weighted-cat-${cat.id}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  id={`btn-toggle-expand-${cat.id}`}
                                  onClick={() => handleUpdateCategory(cat.id, "isExpanded", !cat.isExpanded)}
                                  className="p-1 border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                >
                                  {cat.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <input
                                  type="text"
                                  id={`input-cat-name-${cat.id}`}
                                  value={cat.name}
                                  onChange={(e) => handleUpdateCategory(cat.id, "name", e.target.value)}
                                  className="font-bold text-black border-b-2 border-transparent hover:border-gray-300 focus:border-black focus:outline-none py-1 w-full max-w-[200px]"
                                  placeholder="Category Name"
                                />
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-bold text-gray-600">Wgt:</span>
                                  <input
                                    type="number"
                                    id={`input-cat-weight-${cat.id}`}
                                    value={cat.weight}
                                    onChange={(e) => handleUpdateCategory(cat.id, "weight", Math.max(0, Number(e.target.value)))}
                                    className="w-14 text-center text-sm font-bold border-2 border-gray-400 py-1 focus:outline-black"
                                  />
                                  <span className="text-sm">%</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-600">Avg:</span>
                                  {cat.items && cat.items.length > 0 ? (
                                    <div className="bg-gray-200 text-black font-bold text-sm py-1 px-3 border-2 border-gray-400">
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
                                        className="w-16 text-center text-sm font-bold border-2 border-gray-400 py-1 focus:outline-black bg-white"
                                        placeholder="TBD"
                                      />
                                      {cat.currentScore !== null && <span>%</span>}
                                    </div>
                                  )}
                                </div>

                                <button
                                  id={`btn-delete-cat-${cat.id}`}
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {cat.isExpanded && (
                              <div className="mt-4 ml-8 pl-4 border-l-4 border-gray-300 space-y-3 bg-gray-50 p-3" id={`expanded-cat-items-${cat.id}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-gray-600 uppercase">Individual Items</span>
                                  <button
                                    id={`btn-add-nested-${cat.id}`}
                                    onClick={() => handleAddNestedItem(cat.id)}
                                    className="flex items-center gap-1 text-xs font-bold bg-gray-200 border border-gray-400 px-2 py-1 hover:bg-gray-300 cursor-pointer"
                                  >
                                    <PlusCircle size={12} /> Add
                                  </button>
                                </div>
                                {cat.items.length === 0 ? (
                                  <p className="text-sm text-gray-500">No items added.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {cat.items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-3">
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "name", e.target.value)}
                                          className="text-sm border-b border-gray-400 bg-transparent focus:outline-none py-1 flex-1"
                                          placeholder="Item"
                                        />
                                        <input
                                          type="number"
                                          value={item.score}
                                          onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "score", Math.max(0, Number(e.target.value)))}
                                          className="w-14 text-center text-sm font-bold border-2 border-gray-400 py-1 focus:outline-black"
                                        />
                                        <span className="font-bold text-gray-500">/</span>
                                        <input
                                          type="number"
                                          value={item.maxScore}
                                          onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "maxScore", Math.max(1, Number(e.target.value)))}
                                          className="w-14 text-center text-sm font-bold border-2 border-gray-400 py-1 focus:outline-black"
                                        />
                                        <button
                                          onClick={() => handleDeleteNestedItem(cat.id, item.id)}
                                          className="text-red-500 hover:bg-red-50 p-1 border border-transparent hover:border-red-200"
                                        >
                                          <X size={14} />
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
                        <div className="px-6 py-3 bg-gray-200 flex items-center justify-between text-sm font-bold border-t-2 border-gray-400">
                          <span>Total Assigned Weights:</span>
                          <span className={weightedCategories.reduce((sum, cat) => sum + cat.weight, 0) === 100 ? "text-green-700" : "text-red-600"}>
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
                        <div className="p-8 text-center text-gray-600 font-bold">No assignments added.</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-12 gap-3 pb-2 text-xs font-bold text-gray-500 uppercase border-b-2 border-gray-200">
                            <div className="col-span-5">Name</div>
                            <div className="col-span-3 text-center">Score</div>
                            <div className="col-span-2 text-center">Done?</div>
                            <div className="col-span-2 text-center">Del</div>
                          </div>
                          {pointsAssignments.map((a) => (
                            <div key={a.id} className="grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={a.name}
                                  onChange={(e) => handleUpdatePointAssignment(a.id, "name", e.target.value)}
                                  className="w-full text-sm font-bold border-b border-gray-400 bg-transparent focus:outline-none py-1"
                                />
                              </div>
                              <div className="col-span-3 flex justify-center items-center gap-1">
                                {a.completed ? (
                                  <>
                                    <input
                                      type="number"
                                      value={a.score}
                                      onChange={(e) => handleUpdatePointAssignment(a.id, "score", Math.max(0, Number(e.target.value)))}
                                      className="w-14 text-center text-sm font-bold border-2 border-gray-400 py-1"
                                    />
                                    <span className="font-bold">/</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold bg-gray-200 px-2 py-1 mr-1">TBD</span>
                                )}
                                <input
                                  type="number"
                                  value={a.total}
                                  onChange={(e) => handleUpdatePointAssignment(a.id, "total", Math.max(1, Number(e.target.value)))}
                                  className="w-14 text-center text-sm font-bold border-2 border-gray-400 py-1"
                                />
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <button
                                  onClick={() => handleUpdatePointAssignment(a.id, "completed", !a.completed)}
                                  className={`w-6 h-6 flex items-center justify-center border-2 transition-all cursor-pointer ${
                                    a.completed ? "bg-black border-black text-white" : "bg-white border-gray-400 text-transparent"
                                  }`}
                                >
                                  <Check size={14} strokeWidth={3} />
                                </button>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <button
                                  onClick={() => handleDeletePointAssignment(a.id)}
                                  className="p-1 border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
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
              {/* CURRENT GRADE SUMMARY */}
              <div className="bg-white p-6 border-2 border-gray-400 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-gray-500 uppercase">Current Standing</h4>
                    <p className="text-4xl font-bold text-black mt-2">
                      {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0)
                        ? "—"
                        : `${currentGradeResults.currentOverallGrade}%`}
                    </p>
                  </div>
                  <div className="bg-gray-200 p-2 border-2 border-gray-400">
                    <TrendingUp size={24} className="text-black" />
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-4 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Desired Class Grade:</span>
                    <span>{desiredGrade}%</span>
                  </div>

                  {((gradingMode === "weighted" ? weightedCategories.length : pointsAssignments.length) === 0) ? (
                    <div className="p-4 bg-gray-100 border-2 border-gray-300 text-sm font-bold">
                      Add assignments to calculate your standing.
                    </div>
                  ) : currentGradeResults.requiredScoreOnPending !== null ? (
                    <div className="p-4 bg-white border-2 border-black space-y-2">
                      <h4 className="text-xs font-bold uppercase bg-black text-white inline-block px-2 py-1">Verdict</h4>
                      <p className="text-sm font-bold mt-2">
                        To achieve <span className="bg-yellow-200 px-1">{desiredGrade}%</span>, you need an average of{" "}
                        <span className="bg-yellow-200 px-1">{currentGradeResults.requiredScoreOnPending}%</span> on the remaining{" "}
                        {gradingMode === "weighted"
                          ? `weight (${(currentGradeResults as any).pendingWeight}%)`
                          : `assignments (${(currentGradeResults as any).pendingPoints} pts)`}
                        .
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-100 border-2 border-green-400 font-bold text-green-800 text-sm flex gap-2">
                      <Check size={18} />
                      Course is fully evaluated. Final grade!
                    </div>
                  )}
                </div>
              </div>

              {/* GRAPH PROJECTION */}
              <div className="bg-white p-6 border-2 border-gray-400 space-y-4">
                <h4 className="font-bold text-black text-lg border-b-2 border-gray-200 pb-2">Projection Curve</h4>
                
                <div className="relative border-2 border-gray-400 p-2 bg-gray-50">
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    className="w-full h-auto overflow-visible"
                    style={{ maxHeight: "240px" }}
                  >
                    {scaleGridLines.map((percent) => {
                      const { y } = getSvgCoords(0, percent);
                      return (
                        <g key={percent}>
                          <line
                            x1={graphPadding.left} y1={y} x2={graphWidth - graphPadding.right} y2={y}
                            stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4"
                          />
                          <text
                            x={graphPadding.left - 5} y={y + 4} textAnchor="end" fontSize="10" className="font-bold fill-gray-500"
                          >
                            {percent}%
                          </text>
                        </g>
                      );
                    })}

                    {desiredGrade > 0 && desiredGrade <= 100 && (
                      <g>
                        <line
                          x1={graphPadding.left} y1={getSvgCoords(0, desiredGrade).y}
                          x2={graphWidth - graphPadding.right} y2={getSvgCoords(100, desiredGrade).y}
                          stroke="#000" strokeWidth="2" strokeDasharray="6 4"
                        />
                        <text
                          x={graphWidth - graphPadding.right - 5} y={getSvgCoords(0, desiredGrade).y - 8}
                          textAnchor="end" fontSize="10" className="font-bold fill-black uppercase bg-white"
                        >
                          Goal: {desiredGrade}%
                        </text>
                      </g>
                    )}

                    <path d={fillD} fill="#e5e7eb" />
                    <path d={pathD} fill="none" stroke="#000" strokeWidth="3" />

                    {isTargetVisible && targetCoords && (
                      <g>
                        <line
                          x1={targetCoords.x} y1={targetCoords.y} x2={targetCoords.x} y2={getSvgCoords(0, 0).y}
                          stroke="#000" strokeWidth="2" strokeDasharray="4 4"
                        />
                        <circle cx={targetCoords.x} cy={targetCoords.y} r="6" className="fill-white stroke-black stroke-2" />
                        <text
                          x={targetCoords.x} y={getSvgCoords(0, 0).y + 14} textAnchor="middle" fontSize="12" className="font-bold fill-black bg-white"
                        >
                          {targetRequiredScore}%
                        </text>
                      </g>
                    )}

                    {points.map((p, index) => (
                      <circle
                        key={index} cx={p.svgX} cy={p.svgY} r="10" fill="transparent" className="cursor-crosshair"
                        onMouseEnter={() =>
                          setHoveredPoint({ x: p.svgX, y: p.svgY, labelX: `Pending avg: ${p.xVal}%`, labelY: `Final: ${Math.round(p.yVal * 10) / 10}%` })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}

                    <line
                      x1={graphPadding.left} y1={getSvgCoords(0, 0).y} x2={graphWidth - graphPadding.right} y2={getSvgCoords(100, 0).y}
                      stroke="#000" strokeWidth="2"
                    />
                    <line
                      x1={graphPadding.left} y1={graphPadding.top} x2={graphPadding.left} y2={getSvgCoords(0, 0).y}
                      stroke="#000" strokeWidth="2"
                    />

                    {[0, 25, 50, 75, 100].map((val) => {
                      const { x } = getSvgCoords(val, 0);
                      const { y } = getSvgCoords(0, 0);
                      return (
                        <g key={val}>
                          <line x1={x} y1={y} x2={x} y2={y + 5} stroke="#000" strokeWidth="2" />
                          <text x={x} y={y + 16} textAnchor="middle" fontSize="10" className="font-bold fill-black">
                            {val}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {hoveredPoint && (
                    <div
                      className="absolute bg-white border-2 border-black p-2 text-xs font-bold z-10"
                      style={{ left: `${hoveredPoint.x + 10}px`, top: `${hoveredPoint.y - 45}px` }}
                    >
                      <div>{hoveredPoint.labelY}</div>
                      <div className="text-gray-600">{hoveredPoint.labelX}</div>
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
            {/* Scale Config */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 border-2 border-gray-400 space-y-4">
                <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
                  <h3 className="font-bold text-black flex items-center gap-2">
                    <Settings size={18} /> GPA Rules
                  </h3>
                  <button
                    onClick={() => setShowScaleConfig(!showScaleConfig)}
                    className="text-xs font-bold text-blue-700 underline"
                  >
                    {showScaleConfig ? "Hide" : "Edit"}
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="block text-sm font-bold text-black uppercase">Weight Boosts</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Honors</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.honorsBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, honorsBoost: Number(e.target.value) })}
                        className="w-full text-center font-bold border-2 border-gray-400 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">AP</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.apBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, apBoost: Number(e.target.value) })}
                        className="w-full text-center font-bold border-2 border-gray-400 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">IB</label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weightingConfig.ibBoost}
                        onChange={(e) => saveWeightingConfig({ ...weightingConfig, ibBoost: Number(e.target.value) })}
                        className="w-full text-center font-bold border-2 border-gray-400 py-1"
                      />
                    </div>
                  </div>
                </div>

                {showScaleConfig ? (
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="max-h-60 overflow-y-auto space-y-2 border-2 border-gray-400 p-2 bg-gray-50">
                      {gpaRules.map((r) => (
                        <div key={r.grade} className="flex items-center justify-between gap-2 border-b border-gray-300 pb-2">
                          <span className="w-10 font-bold text-black">{r.grade}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold">Pts:</span>
                            <input
                              type="number" step="0.05" min="0" max="5"
                              value={r.points}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "points", Number(e.target.value))}
                              className="w-16 text-center font-bold border-2 border-gray-400 py-1"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold">Min%:</span>
                            <input
                              type="number" min="0" max="100"
                              value={r.minPercent}
                              onChange={(e) => handleUpdateGPAScaleRule(r.grade, "minPercent", Number(e.target.value))}
                              className="w-14 text-center font-bold border-2 border-gray-400 py-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {gpaRules.slice(0, 8).map((r) => (
                        <div key={r.grade} className="bg-gray-100 p-2 border-2 border-gray-300">
                          <div className="font-bold text-black">{r.grade}</div>
                          <div className="text-xs font-bold text-gray-500">{r.points}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GPA Courses */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 border-2 border-gray-400">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-400 bg-gray-100">
                  <h4 className="font-bold text-sm uppercase">Unweighted</h4>
                  <p className="text-5xl font-bold text-black mt-2">{gpaResult.unweightedGPA.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 border-4 border-black bg-white">
                  <h4 className="font-bold text-sm uppercase text-black">Weighted</h4>
                  <p className="text-5xl font-bold text-black mt-2">{gpaResult.weightedGPA.toFixed(2)}</p>
                  <span className="text-xs font-bold mt-2 bg-black text-white px-2 py-1">Credits: {gpaResult.totalCredits}</span>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-400">
                <div className="px-6 py-4 border-b-2 border-gray-400 flex justify-between items-center bg-gray-100">
                  <h3 className="font-bold text-black text-lg">Semester Courses</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddGPACourse}
                      className="flex items-center gap-1 px-3 py-1 font-bold border-2 border-black bg-white hover:bg-gray-200"
                    >
                      <Plus size={14} /> Add
                    </button>
                    <button
                      onClick={resetGPAData}
                      className="p-1 border-2 border-gray-400 bg-white hover:bg-gray-200"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {gpaCourses.length === 0 ? (
                    <div className="text-center font-bold text-gray-600 p-8">No courses added.</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-3 pb-2 text-xs font-bold text-black uppercase border-b-2 border-black">
                        <div className="col-span-5">Course</div>
                        <div className="col-span-3">Level</div>
                        <div className="col-span-2 text-center">Creds</div>
                        <div className="col-span-2 text-center">Grade</div>
                      </div>

                      {gpaCourses.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5 flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteGPACourse(c.id)}
                              className="p-1 border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => handleUpdateGPACourse(c.id, "name", e.target.value)}
                              className="w-full font-bold border-b-2 border-gray-300 focus:border-black focus:outline-none py-1"
                            />
                          </div>

                          <div className="col-span-3">
                            <select
                              value={c.level}
                              onChange={(e) => handleUpdateGPACourse(c.id, "level", e.target.value)}
                              className="w-full font-bold border-2 border-gray-400 p-1 focus:outline-none bg-white"
                            >
                              <option value="Regular">Regular</option>
                              <option value="Honors">Honors</option>
                              <option value="AP">AP</option>
                              <option value="IB">IB</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number" min="1" max="10"
                              value={c.credits}
                              onChange={(e) => handleUpdateGPACourse(c.id, "credits", Math.max(1, Number(e.target.value)))}
                              className="w-full text-center font-bold border-2 border-gray-400 py-1"
                            />
                          </div>

                          <div className="col-span-2">
                            <select
                              value={c.grade}
                              onChange={(e) => handleUpdateGPACourse(c.id, "grade", e.target.value)}
                              className="w-full font-bold border-2 border-gray-400 p-1 focus:outline-none bg-white text-center"
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

      {/* AI DIALOG - Squared Off */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border-4 border-black max-w-lg w-full"
            >
              <div className="px-6 py-4 border-b-4 border-black flex justify-between items-center bg-gray-100">
                <h3 className="font-bold text-black flex items-center gap-2">
                  <Sparkles size={18} /> AI Import
                </h3>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="font-bold p-1 border-2 border-transparent hover:border-black"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm font-bold text-gray-700">
                  Paste course syllabus details. The AI will extract the weights and grading scales automatically.
                </p>

                <textarea
                  rows={6}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="w-full text-sm p-3 border-2 border-black focus:outline-none resize-none font-mono bg-yellow-50"
                  placeholder="Paste syllabus here..."
                />

                {parseError && (
                  <div className="p-3 bg-red-100 border-2 border-red-500 font-bold text-red-700 text-sm">
                    {parseError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-100 border-t-4 border-black flex justify-end gap-4">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParseSyllabus}
                  disabled={isParsing || !syllabusText.trim()}
                  className="flex items-center gap-2 px-4 py-2 font-bold bg-blue-600 text-white border-2 border-black hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isParsing ? "Extracting..." : "Process"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}