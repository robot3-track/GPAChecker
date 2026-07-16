"use client";

import React, { useState, useEffect } from "react";
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
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  FolderOpen,
  BookOpen
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

interface Course {
  id: string;
  title: string;
  gradingMode: "weighted" | "points";
  desiredGrade: number;
  weightedCategories: WeightedCategory[];
  pointsAssignments: PointAssignment[];
  credits: number;
  courseLevel: "Regular" | "Honors" | "AP" | "IB";
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
  const [activeTab, setActiveTab] = useState<"class" | "gpa">("class");
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_darkMode");
      if (stored) return stored === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("gc_darkMode", String(darkMode));
  }, [darkMode]);

  // --- MULTI-COURSE DASHBOARD STATE ---
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_courses");
      if (stored) return JSON.parse(stored);
    }
    // Default fallback starter course
    return [{
      id: "default-course",
      title: "Introduction to Calculus",
      gradingMode: "weighted",
      desiredGrade: 90,
      weightedCategories: [
        { id: "1", name: "Exams", weight: 50, currentScore: 85, isExpanded: false, items: [] },
        { id: "2", name: "Homework", weight: 30, currentScore: 95, isExpanded: false, items: [] },
        { id: "3", name: "Final Exam", weight: 20, currentScore: null, isExpanded: false, items: [] }
      ],
      pointsAssignments: [],
      credits: 4,
      courseLevel: "Regular"
    }];
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gc_activeCourseId");
      if (stored) return stored;
    }
    return "default-course";
  });

  // Keep tracking active course reference
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || null;

  // Sync courses to localStorage
  useEffect(() => {
    localStorage.setItem("gc_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    if (activeCourseId) {
      localStorage.setItem("gc_activeCourseId", activeCourseId);
    }
  }, [activeCourseId]);

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

  // --- AI IMPORT DIALOG ---
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [currentGradesText, setCurrentGradesText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  // Graph Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; labelX: string; labelY: string } | null>(null);

  // Helper updates for Active Course sub-state
  const updateActiveCourse = (updater: (course: Course) => Course) => {
    setCourses(prev => prev.map(c => c.id === activeCourseId ? updater(c) : c));
  };

  // --- COURSE CRUD ACTION HANDLERS ---
  const handleAddNewCourse = () => {
    const newId = Date.now().toString();
    const newCourse: Course = {
      id: newId,
      title: `Course ${courses.length + 1}`,
      gradingMode: "weighted",
      desiredGrade: 90,
      weightedCategories: [],
      pointsAssignments: [],
      credits: 3,
      courseLevel: "Regular"
    };
    setCourses([...courses, newCourse]);
    setActiveCourseId(newId);
  };

  const handleDeleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (courses.length <= 1) {
      alert("You must keep at least one course active in your dashboard!");
      return;
    }
    if (confirm("Are you sure you want to delete this class? This cannot be undone.")) {
      const updated = courses.filter((c) => c.id !== id);
      setCourses(updated);
      if (activeCourseId === id) {
        setActiveCourseId(updated[0].id);
      }
    }
  };

  const resetClassData = () => {
    if (confirm("Are you sure you want to completely clear current course progress? This will reset assignments and categories.")) {
      updateActiveCourse((course) => ({
        ...course,
        weightedCategories: [],
        pointsAssignments: []
      }));
    }
  };

  // --- DETAILED CALCULATIONS ---
  const calculateWeightedGrade = (course: Course) => {
    let totalWeight = 0;
    let earnedWeightContribution = 0;
    let pendingWeight = 0;

    course.weightedCategories.forEach((cat) => {
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
      requiredScoreOnPending = ((course.desiredGrade - earnedWeightContribution) / pendingWeight) * 100;
    }

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

  const calculatePointsGrade = (course: Course) => {
    const completedAssignments = course.pointsAssignments.filter((a) => a.completed);
    const pendingAssignments = course.pointsAssignments.filter((a) => !a.completed);

    const earnedPoints = completedAssignments.reduce((sum, a) => sum + a.score, 0);
    const maxCompletedPoints = completedAssignments.reduce((sum, a) => sum + a.total, 0);
    const pendingPoints = pendingAssignments.reduce((sum, a) => sum + a.total, 0);

    const totalPossiblePoints = maxCompletedPoints + pendingPoints;
    const currentOverallGrade = maxCompletedPoints > 0 ? (earnedPoints / maxCompletedPoints) * 100 : 100;

    const totalPointsNeeded = (course.desiredGrade / 100) * totalPossiblePoints;
    const remainingPointsNeeded = totalPointsNeeded - earnedPoints;

    let requiredScoreOnPending = null;
    if (pendingPoints > 0) {
      requiredScoreOnPending = (remainingPointsNeeded / pendingPoints) * 100;
    }

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

  const currentGradeResults = activeCourse
    ? (activeCourse.gradingMode === "weighted" ? calculateWeightedGrade(activeCourse) : calculatePointsGrade(activeCourse))
    : { currentOverallGrade: 0, requiredScoreOnPending: null };

  // Sync dashboard active courses instantly into GPA Planner List
  const syncDashboardToGpa = () => {
    const synced: GPACourse[] = courses.map((c) => {
      const stats = c.gradingMode === "weighted" ? calculateWeightedGrade(c) : calculatePointsGrade(c);
      const percent = stats.currentOverallGrade;
      
      // Determine letter grade from percentage
      const matchingRule = gpaRules.find((rule) => percent >= rule.minPercent) || gpaRules[gpaRules.length - 1];
      
      return {
        id: c.id,
        name: c.title,
        credits: c.credits,
        grade: matchingRule ? matchingRule.grade : "A",
        level: c.courseLevel
      };
    });
    setGpaCourses(synced);
    localStorage.setItem("gc_gpaCourses", JSON.stringify(synced));
    alert("Successfully synced all dashboard courses with your GPA planner!");
  };

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

  // --- ASSIGNMENT & CATEGORY MODIFY HANDLERS ---
  const handleAddCategory = () => {
    if (!activeCourse) return;
    const newCat: WeightedCategory = {
      id: Date.now().toString(),
      name: "New Category",
      weight: 10,
      currentScore: null,
      isExpanded: false,
      items: [],
    };
    updateActiveCourse(c => ({ ...c, weightedCategories: [...c.weightedCategories, newCat] }));
  };

  const handleDeleteCategory = (id: string) => {
    updateActiveCourse(c => ({
      ...c,
      weightedCategories: c.weightedCategories.filter((cat) => cat.id !== id)
    }));
  };

  const handleUpdateCategory = (id: string, field: keyof WeightedCategory, value: any) => {
    updateActiveCourse(c => ({
      ...c,
      weightedCategories: c.weightedCategories.map((cat) => cat.id === id ? { ...cat, [field]: value } : cat)
    }));
  };

  const handleAddNestedItem = (catId: string) => {
    updateActiveCourse(c => ({
      ...c,
      weightedCategories: c.weightedCategories.map((cat) => {
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
      })
    }));
  };

  const handleUpdateNestedItem = (catId: string, itemId: string, field: string, value: any) => {
    updateActiveCourse(c => ({
      ...c,
      weightedCategories: c.weightedCategories.map((cat) => {
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
      })
    }));
  };

  const handleDeleteNestedItem = (catId: string, itemId: string) => {
    updateActiveCourse(c => ({
      ...c,
      weightedCategories: c.weightedCategories.map((cat) => {
        if (cat.id === catId) {
          return { ...cat, items: cat.items.filter((item) => item.id !== itemId) };
        }
        return cat;
      })
    }));
  };

  const handleAddPointAssignment = () => {
    const newAssign: PointAssignment = {
      id: Date.now().toString(),
      name: "New Assignment",
      score: 10,
      total: 10,
      completed: true,
    };
    updateActiveCourse(c => ({ ...c, pointsAssignments: [...c.pointsAssignments, newAssign] }));
  };

  const handleDeletePointAssignment = (id: string) => {
    updateActiveCourse(c => ({
      ...c,
      pointsAssignments: c.pointsAssignments.filter((a) => a.id !== id)
    }));
  };

  const handleUpdatePointAssignment = (id: string, field: keyof PointAssignment, value: any) => {
    updateActiveCourse(c => ({
      ...c,
      pointsAssignments: c.pointsAssignments.map((a) => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  // --- GPA ACTIONS ---
  const handleAddGPACourse = () => {
    const newCourse: GPACourse = {
      id: Date.now().toString(),
      name: "New Course",
      credits: 4,
      grade: "A",
      level: "Regular",
    };
    const updated = [...gpaCourses, newCourse];
    setGpaCourses(updated);
    localStorage.setItem("gc_gpaCourses", JSON.stringify(updated));
  };

  const handleDeleteGPACourse = (id: string) => {
    const updated = gpaCourses.filter((c) => c.id !== id);
    setGpaCourses(updated);
    localStorage.setItem("gc_gpaCourses", JSON.stringify(updated));
  };

  const handleUpdateGPACourse = (id: string, field: keyof GPACourse, value: any) => {
    const updated = gpaCourses.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setGpaCourses(updated);
    localStorage.setItem("gc_gpaCourses", JSON.stringify(updated));
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

  // --- AI API IMPORT HANDLERS ---
  const handleParseSyllabus = async () => {
    if (!syllabusText.trim()) return;
    setIsParsing(true);
    setParseError("");

    try {
      const res = await fetch("/api/parse-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: syllabusText,
          gradesText: currentGradesText
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse text");
      }

      const data = await res.json();

      if (data.gradingSystem) {
        const mode = data.gradingSystem.toLowerCase().includes("point") ? "points" : "weighted";
        
        updateActiveCourse(c => {
          const updated = { ...c, gradingMode: mode };

          if (mode === "weighted" && Array.isArray(data.categories) && data.categories.length > 0) {
            updated.weightedCategories = data.categories.map((cat: any, idx: number) => {
              const isFinal = cat.name.toLowerCase().includes("final");
              return {
                id: String(idx + 1),
                name: cat.name,
                weight: cat.weight || 10,
                currentScore: isFinal ? null : (cat.currentScore !== undefined ? cat.currentScore : 90),
                isExpanded: false,
                items: cat.items || [],
              };
            });
          } else if (mode === "points" && Array.isArray(data.categories)) {
            updated.pointsAssignments = data.categories.map((cat: any, idx: number) => {
              const isFinal = cat.name.toLowerCase().includes("final");
              return {
                id: String(idx + 1),
                name: cat.name,
                score: isFinal ? 0 : (cat.score !== undefined ? cat.score : Math.round((cat.totalPoints || 100) * 0.9)), 
                total: cat.totalPoints || 100,
                completed: !isFinal,
              };
            });
          }
          return updated;
        });

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
        setCurrentGradesText("");
      } else {
        throw new Error("Could not extract grading system cleanly. Please check the text inputs.");
      }
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Something went wrong while processing your imports.");
    } finally {
      setIsParsing(false);
    }
  };

  // --- GRAPH RENDERING MATH ---
  const graphPadding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = 460;
  const graphHeight = 220;

  const getSvgCoords = (xVal: number, yVal: number) => {
    const clampedY = Math.min(120, Math.max(0, yVal));
    const xRange = graphWidth - graphPadding.left - graphPadding.right;
    const svgX = graphPadding.left + (xVal / 100) * xRange;

    const yRange = graphHeight - graphPadding.top - graphPadding.bottom;
    const svgY = graphPadding.top + yRange - (clampedY / 120) * yRange;

    return { x: svgX, y: svgY };
  };

  const points: Array<{ xVal: number; yVal: number; svgX: number; svgY: number }> = [];

  if (activeCourse) {
    if (activeCourse.gradingMode === "weighted") {
      let totalCompletedWeight = 0;
      let earnedWeightContribution = 0;
      let pendingWeight = 0;

      activeCourse.weightedCategories.forEach((cat) => {
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
      const completedAssignments = activeCourse.pointsAssignments.filter((a) => a.completed);
      const pendingAssignments = activeCourse.pointsAssignments.filter((a) => !a.completed);

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
  const isTargetVisible = targetRequiredScore !== null && targetRequiredScore >= 0 && targetRequiredScore <= 120;
  const targetCoords = isTargetVisible ? getSvgCoords(targetRequiredScore, activeCourse?.desiredGrade || 90) : null;

  const scaleGridLines = [110, 90, 70, 50];

  return (
    <div className={`w-full min-h-screen font-sans transition-colors duration-200 p-4 sm:p-6 lg:p-8 ${
      darkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className={`mb-8 flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b gap-6 ${
          darkMode ? "border-zinc-850" : "border-zinc-200"
        }`}>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-zinc-900"}`}>
              Grade & GPA Checker
            </h1>
            <p className={`text-sm mt-2 ${darkMode ? "text-zinc-400" : "text-zinc-650"}`}>
              Built by a student, for students. Calculate required final scores and project semester outcomes.
            </p>
          </div>

          {/* Global Controls & Navigation */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                darkMode 
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800" 
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Navigation Tabs */}
            <div className={`flex gap-1.5 p-1.5 rounded-lg ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}>
              <button
                onClick={() => setActiveTab("class")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === "class"
                    ? (darkMode ? "bg-zinc-800 text-white shadow-none" : "bg-white text-zinc-900 shadow-none")
                    : (darkMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900")
                }`}
              >
                <Calculator size={16} />
                <span>Class Grade Calculator</span>
              </button>
              <button
                onClick={() => setActiveTab("gpa")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === "gpa"
                    ? (darkMode ? "bg-zinc-800 text-white shadow-none" : "bg-white text-zinc-900 shadow-none")
                    : (darkMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900")
                }`}
              >
                <GraduationCap size={16} />
                <span>Semester GPA Planner</span>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: CLASS GRADE CALCULATOR WITH DASHBOARD */}
          {activeTab === "class" && (
            <motion.div
              key="class-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              
              {/* SIDEBAR COURSE DASHBOARD SWITCHER */}
              <div className="lg:col-span-3 space-y-4">
                <div className={`p-4 rounded-xl border ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      darkMode ? "text-zinc-400" : "text-zinc-500"
                    }`}>
                      <FolderOpen size={14} /> Course Dashboard
                    </h3>
                    <button
                      onClick={handleAddNewCourse}
                      className={`p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-500 transition-colors cursor-pointer`}
                      title="Add new course to dashboard"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Course list stack */}
                  <div className="space-y-2">
                    {courses.map((course) => {
                      const isActive = course.id === activeCourseId;
                      const cGrade = course.gradingMode === "weighted" ? calculateWeightedGrade(course) : calculatePointsGrade(course);
                      return (
                        <div
                          key={course.id}
                          onClick={() => setActiveCourseId(course.id)}
                          className={`group w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer text-left ${
                            isActive
                              ? (darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-900")
                              : (darkMode ? "bg-zinc-950/40 border-zinc-900 hover:bg-zinc-900 text-zinc-400" : "bg-zinc-50 border-zinc-150 hover:bg-zinc-100/60 text-zinc-650")
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-sm font-semibold truncate leading-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                              {course.title || "Untitled Course"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                darkMode ? "bg-zinc-900 text-zinc-455" : "bg-white text-zinc-500 border border-zinc-200"
                              }`}>
                                {course.courseLevel}
                              </span>
                              <span className={`text-xs font-medium ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
                                {cGrade.currentOverallGrade}%
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteCourse(course.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 transition-all shrink-0"
                            title="Delete course"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={syncDashboardToGpa}
                    className={`mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                      darkMode
                        ? "bg-indigo-950/40 border-indigo-900/60 text-indigo-300 hover:bg-indigo-950"
                        : "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    <GraduationCap size={14} />
                    <span>Sync Classes to GPA Planner</span>
                  </button>
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              {activeCourse ? (
                <>
                  {/* Inputs Column */}
                  <div className="lg:col-span-5 space-y-8">
                    {/* Active Class Setup */}
                    <div className={`p-6 rounded-xl border space-y-6 ${
                      darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                    }`}>
                      <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-5 ${
                        darkMode ? "border-zinc-800" : "border-zinc-100"
                      }`}>
                        <input
                          type="text"
                          value={activeCourse.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveCourse(c => ({ ...c, title: val }));
                          }}
                          className={`text-xl font-semibold bg-transparent border-b hover:border-zinc-400 dark:hover:border-zinc-650 focus:border-indigo-500 focus:outline-none py-1 w-full max-w-sm transition-colors ${
                            darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                          }`}
                          placeholder="Enter Course Title..."
                        />
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setShowImportDialog(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors cursor-pointer ${
                              darkMode 
                                ? "text-indigo-400 bg-indigo-950/40 border-indigo-900/50 hover:bg-indigo-950" 
                                : "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            <Sparkles size={14} />
                            <span>Smart Import</span>
                          </button>
                          <button
                            onClick={resetClassData}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors cursor-pointer ${
                              darkMode 
                                ? "text-zinc-400 bg-zinc-800 border-zinc-700 hover:bg-zinc-700" 
                                : "text-zinc-600 bg-white border-zinc-300 hover:bg-zinc-50"
                            }`}
                            title="Reset all assignments"
                          >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${
                            darkMode ? "text-zinc-400" : "text-zinc-500"
                          }`}>
                            Grading Structure
                          </label>
                          <div className={`flex p-1 rounded-lg border ${
                            darkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                          }`}>
                            <button
                              onClick={() => updateActiveCourse(c => ({ ...c, gradingMode: "weighted" }))}
                              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                activeCourse.gradingMode === "weighted"
                                  ? (darkMode ? "bg-zinc-800 text-white border border-zinc-700" : "bg-white text-zinc-900 border border-zinc-200")
                                  : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700")
                              }`}
                            >
                              Weighted
                            </button>
                            <button
                              onClick={() => updateActiveCourse(c => ({ ...c, gradingMode: "points" }))}
                              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                activeCourse.gradingMode === "points"
                                  ? (darkMode ? "bg-zinc-800 text-white border border-zinc-700" : "bg-white text-zinc-900 border border-zinc-200")
                                  : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700")
                              }`}
                            >
                              Total Points
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className={`block text-xs font-semibold uppercase tracking-wider ${
                              darkMode ? "text-zinc-400" : "text-zinc-500"
                            }`}>
                              Desired Target Grade
                            </label>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="50"
                              max="120"
                              step="0.5"
                              value={activeCourse.desiredGrade}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                updateActiveCourse(c => ({ ...c, desiredGrade: val }));
                              }}
                              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                max="120"
                                value={activeCourse.desiredGrade}
                                onChange={(e) => {
                                  const val = Math.min(120, Math.max(0, Number(e.target.value)));
                                  updateActiveCourse(c => ({ ...c, desiredGrade: val }));
                                }}
                                className={`w-16 text-center text-sm font-semibold bg-transparent border rounded-md py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-none ${
                                  darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                }`}
                              />
                              <span className={`ml-1 font-medium ${darkMode ? "text-zinc-400" : "text-zinc-505"}`}>%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Level and Credit Info (GPA Synergy) */}
                      <div className={`grid grid-cols-2 gap-6 pt-4 border-t ${
                        darkMode ? "border-zinc-800" : "border-zinc-100"
                      }`}>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                            darkMode ? "text-zinc-405" : "text-zinc-500"
                          }`}>
                            Course weight Level
                          </label>
                          <select
                            value={activeCourse.courseLevel}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              updateActiveCourse(c => ({ ...c, courseLevel: val }));
                            }}
                            className={`w-full text-xs font-semibold border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                              darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            }`}
                          >
                            <option value="Regular">Regular</option>
                            <option value="Honors">Honors (+0.5 GPA)</option>
                            <option value="AP">AP (+1.0 GPA)</option>
                            <option value="IB">IB (+1.0 GPA)</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                            darkMode ? "text-zinc-400" : "text-zinc-500"
                          }`}>
                            Credits / Hours
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={activeCourse.credits}
                            onChange={(e) => {
                              const val = Math.max(0.5, Number(e.target.value));
                              updateActiveCourse(c => ({ ...c, credits: val }));
                            }}
                            className={`w-full text-xs font-semibold bg-transparent border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              darkMode ? "border-zinc-700 text-white" : "border-zinc-300 text-zinc-900"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Grading List */}
                    <div className={`rounded-xl border overflow-hidden ${
                      darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                    }`}>
                      <div className={`px-6 py-4 border-b flex justify-between items-center ${
                        darkMode ? "border-zinc-800 bg-zinc-900/60" : "bg-zinc-50"
                      }`}>
                        <h3 className={`font-semibold ${darkMode ? "text-zinc-200" : "text-zinc-800"}`}>
                          {activeCourse.gradingMode === "weighted" ? "Categories & Weights" : "Assignment List"}
                        </h3>
                        <button
                          onClick={activeCourse.gradingMode === "weighted" ? handleAddCategory : handleAddPointAssignment}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${
                            darkMode ? "bg-indigo-700 hover:bg-indigo-650" : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          <Plus size={16} />
                          <span>
                            {activeCourse.gradingMode === "weighted" ? "Add Grading Category" : "Add New Assignment"}
                          </span>
                        </button>
                      </div>

                      <div className={`divide-y ${darkMode ? "divide-zinc-800/80" : "divide-zinc-150"}`}>
                        {/* WEIGHTED MODE */}
                        {activeCourse.gradingMode === "weighted" && (
                          <>
                            {activeCourse.weightedCategories.length === 0 ? (
                              <div className="p-12 text-center text-zinc-500">
                                <p className={`font-medium ${darkMode ? "text-zinc-350" : "text-zinc-600"}`}>No grading categories defined.</p>
                                <p className="text-sm mt-1">Click "Add Grading Category" or use AI to import your syllabus & grades.</p>
                              </div>
                            ) : (
                              activeCourse.weightedCategories.map((cat) => (
                                <div key={cat.id} className={`p-4 sm:p-6 transition-colors ${
                                  darkMode ? "hover:bg-zinc-850/20" : "hover:bg-zinc-50/50"
                                }`}>
                                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                      <button
                                        onClick={() => handleUpdateCategory(cat.id, "isExpanded", !cat.isExpanded)}
                                        className={`p-1.5 border rounded-md transition-colors cursor-pointer ${
                                          darkMode 
                                            ? "text-zinc-400 border-zinc-850 bg-zinc-900 hover:bg-zinc-800" 
                                            : "text-zinc-405 border-zinc-200 bg-white hover:bg-zinc-50"
                                        }`}
                                      >
                                        {cat.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                      <input
                                        type="text"
                                        value={cat.name}
                                        onChange={(e) => handleUpdateCategory(cat.id, "name", e.target.value)}
                                        className={`font-medium bg-transparent border-b hover:border-zinc-450 focus:border-indigo-500 focus:outline-none py-1 w-full max-w-[220px] ${
                                          darkMode ? "text-white border-zinc-700 hover:border-zinc-600" : "text-zinc-900 border-zinc-300"
                                        }`}
                                        placeholder="Category Name"
                                      />
                                    </div>

                                    <div className="flex items-center gap-5">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${darkMode ? "text-zinc-400" : "text-zinc-550"}`}>Weight:</span>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={cat.weight}
                                            onChange={(e) => handleUpdateCategory(cat.id, "weight", Math.max(0, Number(e.target.value)))}
                                            className={`w-16 text-center text-sm font-medium bg-transparent border rounded-md py-1 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                              darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                            }`}
                                          />
                                          <span className="absolute right-2 top-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium">%</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${darkMode ? "text-zinc-400" : "text-zinc-550"}`}>Avg (Max=120%):</span>
                                        {cat.items && cat.items.length > 0 ? (
                                          <div className={`font-medium text-sm py-1 px-3 rounded-md border ${
                                            darkMode ? "bg-zinc-950 text-zinc-300 border-zinc-800" : "bg-zinc-100 text-zinc-750 border-zinc-200"
                                          }`}>
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
                                                handleUpdateCategory(cat.id, "currentScore", val === "" ? null : Math.min(120, Number(val)));
                                              }}
                                              className={`w-16 text-center text-sm font-medium bg-transparent border rounded-md py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                              }`}
                                              placeholder="TBD"
                                            />
                                            {cat.currentScore !== null && <span className="text-sm text-zinc-400">%</span>}
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                          darkMode ? "text-zinc-400 hover:text-red-400 hover:bg-red-950/20" : "text-zinc-400 hover:text-red-650 hover:bg-red-50"
                                        }`}
                                        title="Delete Category"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Nested Items details */}
                                  {cat.isExpanded && (
                                    <div className={`mt-4 ml-8 pl-4 border-l-2 space-y-3 p-4 rounded-lg ${
                                      darkMode ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50/50"
                                    }`}>
                                      <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                                          darkMode ? "text-zinc-400" : "text-zinc-505"
                                        }`}>Individual Assignments</span>
                                        <button
                                          onClick={() => handleAddNestedItem(cat.id)}
                                          className={`flex items-center gap-1.5 text-xs font-medium border px-2 py-1 rounded transition-colors cursor-pointer ${
                                            darkMode ? "text-zinc-300 bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-100"
                                          }`}
                                        >
                                          <PlusCircle size={12} />
                                          <span>Add Item</span>
                                        </button>
                                      </div>
                                      {cat.items.length === 0 ? (
                                        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No specific assignments logged. Average is manually set above.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {cat.items.map((item) => (
                                            <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                                              <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "name", e.target.value)}
                                                className={`text-sm border-b bg-transparent focus:border-indigo-500 focus:outline-none py-1 w-full sm:w-auto flex-1 ${
                                                  darkMode ? "text-zinc-300 border-zinc-700 hover:border-zinc-650" : "text-zinc-700 border-zinc-300 hover:border-zinc-400"
                                                }`}
                                                placeholder="Item Name"
                                              />
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="number"
                                                  value={item.score}
                                                  onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "score", Math.max(0, Number(e.target.value)))}
                                                  className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                    darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                                  }`}
                                                />
                                                <span className="text-sm font-medium text-zinc-405">/</span>
                                                <input
                                                  type="number"
                                                  value={item.maxScore}
                                                  onChange={(e) => handleUpdateNestedItem(cat.id, item.id, "maxScore", Math.max(1, Number(e.target.value)))}
                                                  className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                    darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                                  }`}
                                                />
                                              </div>
                                              <button
                                                onClick={() => handleDeleteNestedItem(cat.id, item.id)}
                                                className="text-zinc-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                            
                            {activeCourse.weightedCategories.length > 0 && (
                              <div className={`px-6 py-4 text-sm border-t flex items-center justify-between ${
                                darkMode ? "bg-zinc-950 border-zinc-805" : "bg-zinc-50 border-zinc-200"
                              }`}>
                                <span className={darkMode ? "text-zinc-400" : "text-zinc-600"}>Total Assigned Weight:</span>
                                <span className={`font-semibold ${
                                  activeCourse.weightedCategories.reduce((sum, cat) => sum + cat.weight, 0) === 100
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-amber-600 dark:text-amber-450"
                                }`}>
                                  {activeCourse.weightedCategories.reduce((sum, cat) => sum + cat.weight, 0)}% / 100%
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* POINTS MODE */}
                        {activeCourse.gradingMode === "points" && (
                          <div className="p-4 sm:p-6">
                            {activeCourse.pointsAssignments.length === 0 ? (
                              <div className="p-12 text-center text-zinc-500">
                                <p className={`font-medium ${darkMode ? "text-zinc-350" : "text-zinc-650"}`}>No assignments added yet.</p>
                                <p className="text-sm mt-1">Add assignments manually or use AI syllabus import.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className={`grid grid-cols-12 gap-3 pb-3 text-xs font-semibold uppercase tracking-wide border-b ${
                                  darkMode ? "text-zinc-455 border-zinc-800" : "text-zinc-500 border-zinc-200"
                                }`}>
                                  <div className="col-span-5">Assignment Title</div>
                                  <div className="col-span-3 text-center">Score / Max</div>
                                  <div className="col-span-2 text-center">Graded?</div>
                                  <div className="col-span-2 text-center">Remove</div>
                                </div>
                                {activeCourse.pointsAssignments.map((a) => (
                                  <div key={a.id} className="grid grid-cols-12 gap-3 items-center py-1">
                                    <div className="col-span-5">
                                      <input
                                        type="text"
                                        value={a.name}
                                        onChange={(e) => handleUpdatePointAssignment(a.id, "name", e.target.value)}
                                        className={`w-full text-sm font-medium bg-transparent border-b focus:border-indigo-500 focus:outline-none py-1 ${
                                          darkMode ? "text-zinc-200 border-zinc-700" : "text-zinc-805 border-zinc-300"
                                        }`}
                                      />
                                    </div>
                                    <div className="col-span-3 flex justify-center items-center gap-1.5">
                                      {a.completed ? (
                                        <>
                                          <input
                                            type="number"
                                            value={a.score}
                                            onChange={(e) => handleUpdatePointAssignment(a.id, "score", Math.max(0, Number(e.target.value)))}
                                            className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                              darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                            }`}
                                          />
                                          <span className="text-zinc-400 dark:text-zinc-505 font-medium">/</span>
                                        </>
                                      ) : (
                                        <span className={`text-xs font-medium px-2 py-1.5 rounded mr-1 border ${
                                          darkMode ? "bg-zinc-850 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                                        }`}>
                                          Pending
                                        </span>
                                      )}
                                      <input
                                        type="number"
                                        value={a.total}
                                        onChange={(e) => handleUpdatePointAssignment(a.id, "total", Math.max(1, Number(e.target.value)))}
                                        className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                          darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                        }`}
                                      />
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                      <button
                                        onClick={() => handleUpdatePointAssignment(a.id, "completed", !a.completed)}
                                        className={`w-6 h-6 flex items-center justify-center rounded border transition-colors cursor-pointer ${
                                          a.completed 
                                            ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-700 dark:border-indigo-705 text-white" 
                                            : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-transparent"
                                        }`}
                                      >
                                        <Check size={14} strokeWidth={3} />
                                      </button>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                      <button
                                        onClick={() => handleDeletePointAssignment(a.id)}
                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                          darkMode ? "text-zinc-405 hover:text-red-400 hover:bg-red-950/20" : "text-zinc-400 hover:text-red-650 hover:bg-red-50"
                                        }`}
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
                  <div className="lg:col-span-4 space-y-8">
                    {/* SUMMARY CARD */}
                    <div className={`p-6 rounded-xl border space-y-6 ${
                      darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold text-xs uppercase tracking-wide ${darkMode ? "text-zinc-450" : "text-zinc-505"}`}>Current Standing</h4>
                          <p className={`text-4xl font-bold mt-1 ${darkMode ? "text-white" : "text-zinc-900"}`}>
                            {((activeCourse.gradingMode === "weighted" ? activeCourse.weightedCategories.length : activeCourse.pointsAssignments.length) === 0)
                              ? "—"
                              : `${currentGradeResults.currentOverallGrade}%`}
                          </p>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${
                          darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-650"
                        }`}>
                          <TrendingUp size={20} />
                        </div>
                      </div>

                      <div className={`border-t pt-5 space-y-4 ${darkMode ? "border-zinc-800" : "border-zinc-100"}`}>
                        <div className="flex justify-between items-center text-sm">
                          <span className={`font-medium ${darkMode ? "text-zinc-350" : "text-zinc-650"}`}>Desired Target Grade:</span>
                          <span className={`font-semibold ${darkMode ? "text-white" : "text-zinc-900"}`}>{activeCourse.desiredGrade}%</span>
                        </div>

                        {((activeCourse.gradingMode === "weighted" ? activeCourse.weightedCategories.length : activeCourse.pointsAssignments.length) === 0) ? (
                          <div className={`p-4 rounded-lg border text-sm flex gap-2 ${
                            darkMode ? "bg-zinc-950/40 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-550"
                          }`}>
                            <Info size={18} className={`shrink-0 ${darkMode ? "text-zinc-500" : "text-zinc-400"}`} />
                            <span>Add assignments or categories to view your required score projections.</span>
                          </div>
                        ) : currentGradeResults.requiredScoreOnPending !== null ? (
                          <div className={`p-4 rounded-lg border space-y-2 ${
                            darkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50 border-indigo-105"
                          }`}>
                            <h4 className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-indigo-400" : "text-indigo-800"}`}>Required Target</h4>
                            <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-indigo-300" : "text-indigo-905"}`}>
                              To achieve an overall grade of <strong>{activeCourse.desiredGrade}%</strong>, you need to average at least{" "}
                              <strong className={`text-lg px-1.5 rounded ${
                                darkMode ? "bg-indigo-900 text-indigo-205" : "bg-indigo-200 text-indigo-900"
                              }`}>
                                {currentGradeResults.requiredScoreOnPending > 100 
                                  ? "Extra Credit needed (>100%)" 
                                  : `${currentGradeResults.requiredScoreOnPending}%`}
                              </strong> on your remaining{" "}
                              {activeCourse.gradingMode === "weighted"
                                ? `pending weight (${(currentGradeResults as any).pendingWeight}%)`
                                : `pending assignments (${(currentGradeResults as any).pendingPoints} pts)`}
                              .
                        </p>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg border text-sm font-medium flex gap-2 ${
                        darkMode ? "bg-green-950/20 border-green-900/40 text-green-300" : "bg-green-50 border-green-200 text-green-800"
                      }`}>
                        <Check size={18} className="shrink-0" />
                        <span>All coursework is set up! This is your final course grade!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* GRAPH CARD */}
                <div className={`p-6 rounded-xl border space-y-4 ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div className={`border-b pb-3 ${darkMode ? "border-zinc-800" : "border-zinc-105"}`}>
                    <h4 className={`font-semibold ${darkMode ? "text-zinc-205" : "text-zinc-800"}`}>Score Projection Curve</h4>
                    <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>Visualizes potential final grades based on remaining coursework.</p>
                  </div>
                  
                  <div className={`relative border rounded-lg p-2 ${
                    darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-205 bg-zinc-50"
                  }`}>
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
                              stroke={darkMode ? "#27272a" : "#cbd5e1"} strokeWidth="1" strokeDasharray="4 4"
                            />
                            <text
                              x={graphPadding.left - 8} y={y + 4} textAnchor="end" fontSize="10" className={`font-medium ${
                                darkMode ? "fill-zinc-400" : "fill-zinc-500"
                              }`}
                            >
                              {percent}%
                            </text>
                          </g>
                        );
                      })}

                      {activeCourse.desiredGrade > 0 && activeCourse.desiredGrade <= 120 && (
                        <g>
                          <line
                            x1={graphPadding.left} y1={getSvgCoords(0, activeCourse.desiredGrade).y}
                            x2={graphWidth - graphPadding.right} y2={getSvgCoords(100, activeCourse.desiredGrade).y}
                            stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3"
                          />
                          <text
                            x={graphWidth - graphPadding.right - 5} y={getSvgCoords(0, activeCourse.desiredGrade).y - 8}
                            textAnchor="end" fontSize="10" className={`font-semibold uppercase ${
                              darkMode ? "fill-red-400" : "fill-red-650"
                            }`}
                          >
                            Target: {activeCourse.desiredGrade}%
                          </text>
                        </g>
                      )}

                      <path d={fillD} fill={darkMode ? "#312e81" : "#e2e8f0"} opacity={darkMode ? "0.3" : "0.5"} />
                      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" />

                      {isTargetVisible && targetCoords && (
                        <g>
                          <line
                            x1={targetCoords.x} y1={targetCoords.y} x2={targetCoords.x} y2={getSvgCoords(0, 0).y}
                            stroke={darkMode ? "#52525b" : "#64748b"} strokeWidth="1.5" strokeDasharray="4 4"
                          />
                          <circle cx={targetCoords.x} cy={targetCoords.y} r="5" className="fill-white dark:fill-zinc-900 stroke-indigo-600 dark:stroke-indigo-400 stroke-2" />
                          <text
                            x={targetCoords.x} y={getSvgCoords(0, 0).y + 14} textAnchor="middle" fontSize="11" className={`font-bold ${
                              darkMode ? "fill-zinc-200" : "fill-zinc-800"
                            }`}
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
                        stroke={darkMode ? "#3f3f46" : "#94a3b8"} strokeWidth="1.5"
                      />
                      <line
                        x1={graphPadding.left} y1={graphPadding.top} x2={graphPadding.left} y2={getSvgCoords(0, 0).y}
                        stroke={darkMode ? "#3f3f46" : "#94a3b8"} strokeWidth="1.5"
                      />

                      {[0, 25, 50, 75, 100].map((val) => {
                        const { x } = getSvgCoords(val, 0);
                        const { y } = getSvgCoords(0, 0);
                        return (
                          <g key={val}>
                            <line x1={x} y1={y} x2={x} y2={y + 5} stroke={darkMode ? "#3f3f46" : "#94a3b8"} strokeWidth="1.5" />
                            <text x={x} y={y + 18} textAnchor="middle" fontSize="10" className={`font-medium ${
                              darkMode ? "fill-zinc-400" : "fill-zinc-605"
                            }`}>
                              {val}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {hoveredPoint && (
                      <div
                        className="absolute bg-zinc-900 dark:bg-zinc-800 text-white p-2.5 rounded-md text-xs font-semibold z-10 pointer-events-none"
                        style={{ left: `${hoveredPoint.x + 15}px`, top: `${hoveredPoint.y - 45}px` }}
                      >
                        <div className="font-bold mb-0.5">{hoveredPoint.labelY}</div>
                        <div className="text-zinc-300 dark:text-zinc-400 text-[11px] font-normal">{hoveredPoint.labelX}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                </>
              ) : (
                <div className="col-span-9 text-center p-12">
                  <BookOpen className="mx-auto mb-4 text-zinc-400" size={48} />
                  <p className="font-semibold text-lg">No Active Course Loaded</p>
                  <p className="text-sm text-zinc-500 mt-1">Select or create a course from the sidebar dashboard to get started.</p>
                </div>
              )}
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
            >
              {/* Scale Config Column */}
              <div className="lg:col-span-4 space-y-8">
                <div className={`p-6 rounded-xl border space-y-5 ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? "border-zinc-800" : "border-zinc-101"}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-zinc-200" : "text-zinc-850"}`}>
                      <Settings size={18} className={darkMode ? "text-zinc-400" : "text-zinc-500"} /> GPA Grading Rules
                    </h3>
                    <button
                      onClick={() => setShowScaleConfig(!showScaleConfig)}
                      className={`text-xs font-medium hover:underline cursor-pointer ${
                        darkMode ? "text-indigo-400" : "text-indigo-650"
                      }`}
                    >
                      {showScaleConfig ? "Hide Grading Scale" : "Edit Grading Scale"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className={`block text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? "text-zinc-400" : "text-zinc-505"
                    }`}>
                      Weighted Course Boosts
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs mb-1 ${darkMode ? "text-zinc-405" : "text-zinc-500"}`}>Honors</label>
                        <input
                          type="number" step="0.1" min="0"
                          value={weightingConfig.honorsBoost}
                          onChange={(e) => saveWeightingConfig({ ...weightingConfig, honorsBoost: Number(e.target.value) })}
                          className={`w-full text-center text-sm font-semibold bg-transparent border rounded-md py-1.5 focus:ring-1 focus:ring-indigo-500 ${
                            darkMode ? "border-zinc-700" : "border-zinc-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>AP</label>
                        <input
                          type="number" step="0.1" min="0"
                          value={weightingConfig.apBoost}
                          onChange={(e) => saveWeightingConfig({ ...weightingConfig, apBoost: Number(e.target.value) })}
                          className={`w-full text-center text-sm font-semibold bg-transparent border rounded-md py-1.5 focus:ring-1 focus:ring-indigo-500 ${
                            darkMode ? "border-zinc-700" : "border-zinc-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>IB</label>
                        <input
                          type="number" step="0.1" min="0"
                          value={weightingConfig.ibBoost}
                          onChange={(e) => saveWeightingConfig({ ...weightingConfig, ibBoost: Number(e.target.value) })}
                          className={`w-full text-center text-sm font-semibold bg-transparent border rounded-md py-1.5 focus:ring-1 focus:ring-indigo-500 ${
                            darkMode ? "border-zinc-700" : "border-zinc-300"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {showScaleConfig ? (
                    <div className={`pt-4 border-t ${darkMode ? "border-zinc-800" : "border-zinc-101"}`}>
                      <span className={`block text-xs font-semibold uppercase tracking-wide mb-3 ${
                        darkMode ? "text-zinc-400" : "text-zinc-500"
                      }`}>Scale Editor</span>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {gpaRules.map((r) => (
                          <div key={r.grade} className={`flex items-center justify-between gap-3 p-2 rounded border ${
                            darkMode ? "bg-zinc-950 border-zinc-850" : "bg-zinc-50 border-zinc-200"
                          }`}>
                            <span className={`w-8 font-bold text-sm ${darkMode ? "text-zinc-300" : "text-zinc-700"}`}>{r.grade}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-550">Pts:</span>
                              <input
                                type="number" step="0.05" min="0" max="5"
                                value={r.points}
                                onChange={(e) => handleUpdateGPAScaleRule(r.grade, "points", Number(e.target.value))}
                                className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 ${
                                  darkMode ? "border-zinc-700 text-white" : "border-zinc-300 text-zinc-900"
                                }`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-550">Min %:</span>
                              <input
                                type="number" min="0" max="100"
                                value={r.minPercent}
                                onChange={(e) => handleUpdateGPAScaleRule(r.grade, "minPercent", Number(e.target.value))}
                                className={`w-16 text-center text-sm font-medium bg-transparent border rounded py-1 ${
                                  darkMode ? "border-zinc-700 text-white" : "border-zinc-300 text-zinc-900"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`pt-4 border-t ${darkMode ? "border-zinc-800" : "border-zinc-101"}`}>
                      <span className={`block text-xs font-semibold uppercase tracking-wide mb-3 ${
                        darkMode ? "text-zinc-400" : "text-zinc-505"
                      }`}>Scale Preview</span>
                      <div className="grid grid-cols-4 gap-2">
                        {gpaRules.slice(0, 8).map((r) => (
                          <div key={r.grade} className={`p-2 rounded-lg border flex flex-col items-center ${
                            darkMode ? "bg-zinc-950 border-zinc-850" : "bg-zinc-50 border-zinc-200"
                          }`}>
                            <span className={`font-semibold text-sm ${darkMode ? "text-zinc-200" : "text-zinc-800"}`}>{r.grade}</span>
                            <span className={`text-xs mt-0.5 ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>{r.points} pt</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GPA Courses Column */}
              <div className="lg:col-span-8 space-y-8">
                {/* Stats Card */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 rounded-xl border ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div className={`flex flex-col items-center justify-center p-6 border rounded-xl ${
                    darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"
                  }`}>
                    <h4 className={`font-semibold text-xs uppercase tracking-wide ${darkMode ? "text-zinc-405" : "text-zinc-500"}`}>Unweighted GPA</h4>
                    <p className={`text-5xl font-bold mt-2 ${darkMode ? "text-white" : "text-zinc-900"}`}>{gpaResult.unweightedGPA.toFixed(2)}</p>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-6 border rounded-xl relative overflow-hidden ${
                    darkMode ? "border-indigo-900/50 bg-indigo-950/20" : "border-indigo-200 bg-indigo-50"
                  }`}>
                    <h4 className={`font-semibold text-xs uppercase tracking-wide ${darkMode ? "text-indigo-400" : "text-indigo-700"}`}>Weighted GPA</h4>
                    <p className={`text-5xl font-bold mt-2 ${darkMode ? "text-indigo-200" : "text-indigo-900"}`}>{gpaResult.weightedGPA.toFixed(2)}</p>
                    <span className={`text-xs font-semibold mt-3 border px-3 py-1 rounded-full ${
                      darkMode ? "bg-zinc-900 border-indigo-900 text-indigo-300" : "bg-white border-indigo-200 text-indigo-805"
                    }`}>
                      {gpaResult.totalCredits} Total Credits
                    </span>
                  </div>
                </div>

                {/* Course List Card */}
                <div className={`rounded-xl border overflow-hidden ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${
                    darkMode ? "border-zinc-800 bg-zinc-900/60" : "bg-zinc-50"
                  }`}>
                    <h3 className={`font-semibold ${darkMode ? "text-zinc-200" : "text-zinc-800"}`}>Semester Course List</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddGPACourse}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${
                          darkMode ? "bg-indigo-700 hover:bg-indigo-650" : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        <Plus size={16} /> <span>Add New Course</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {gpaCourses.length === 0 ? (
                      <div className="text-center p-12">
                        <p className={`font-medium ${darkMode ? "text-zinc-350" : "text-zinc-650"}`}>No courses mapped out yet.</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Click "Add New Course" to start planning or sync details straight from your main Course Dashboard!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`grid grid-cols-12 gap-3 pb-3 text-xs font-semibold uppercase tracking-wide border-b ${
                          darkMode ? "text-zinc-455 border-zinc-850" : "text-zinc-500 border-zinc-200"
                        }`}>
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
                                className={`p-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                                  darkMode ? "text-zinc-400 hover:text-red-400 hover:bg-red-950/20" : "text-zinc-400 hover:text-red-650 hover:bg-red-50"
                                }`}
                                title="Remove Course"
                              >
                                <Trash2 size={16} />
                              </button>
                              <input
                                type="text"
                                value={c.name}
                                onChange={(e) => handleUpdateGPACourse(c.id, "name", e.target.value)}
                                className={`w-full text-sm font-medium bg-transparent border-b focus:border-indigo-500 focus:outline-none py-1 ${
                                  darkMode ? "text-white border-zinc-700" : "text-zinc-900 border-zinc-300"
                                }`}
                                placeholder="Course Name"
                              />
                            </div>

                            <div className="col-span-3">
                              <select
                                value={c.level}
                                onChange={(e) => handleUpdateGPACourse(c.id, "level", e.target.value)}
                                className={`w-full text-sm font-medium border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                                  darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                }`}
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
                                className={`w-full text-center text-sm font-semibold bg-transparent border rounded-md py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  darkMode ? "border-zinc-700 text-white" : "border-zinc-300 text-zinc-900"
                                }`}
                              />
                            </div>

                            <div className="col-span-2">
                              <select
                                value={c.grade}
                                onChange={(e) => handleUpdateGPACourse(c.id, "grade", e.target.value)}
                                className={`w-full text-sm font-semibold border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center cursor-pointer ${
                                  darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                }`}
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

        {/* SMART IMPORT DIALOG MODAL */}
        <AnimatePresence>
          {showImportDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-colors duration-200"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className={`rounded-xl border max-w-xl w-full overflow-hidden shadow-none ${
                  darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}
              >
                <div className={`px-6 py-4 border-b flex justify-between items-center ${
                  darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-101 bg-zinc-50"
                }`}>
                  <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-zinc-900"}`}>
                    <Sparkles size={18} className={darkMode ? "text-indigo-400" : "text-indigo-600"} /> AI Syllabus & Grades Importer
                  </h3>
                  <button
                    onClick={() => setShowImportDialog(false)}
                    className={`p-1 rounded-md transition-colors ${
                      darkMode ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-zinc-350" : "text-zinc-650"}`}>
                    Avoid entering your grades manually! Paste both your syllabus rules (weightings, categories) and your current scores or transcripts below.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                        darkMode ? "text-zinc-400" : "text-zinc-500"
                      }`}>
                        Syllabus Rules & Categories
                      </label>
                      <textarea
                        rows={4}
                        value={syllabusText}
                        onChange={(e) => setSyllabusText(e.target.value)}
                        className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 ${
                          darkMode ? "border-zinc-750 bg-zinc-955 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-900"
                        }`}
                        placeholder="Example: Homework - 25%, Projects - 35%, Quizzes - 40%..."
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                        darkMode ? "text-zinc-400" : "text-zinc-500"
                      }`}>
                        Current Gradebook / Achieved Grades (Optional)
                      </label>
                      <textarea
                        rows={4}
                        value={currentGradesText}
                        onChange={(e) => setCurrentGradesText(e.target.value)}
                        className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 ${
                          darkMode ? "border-zinc-750 bg-zinc-955 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-900"
                        }`}
                        placeholder="Paste text from your grade portal or PDF list of scored assignments..."
                      />
                    </div>
                  </div>

                  {parseError && (
                    <div className={`p-3 border rounded-md text-sm flex gap-2 items-start ${
                      darkMode ? "bg-red-950/20 border-red-900/50 text-red-300" : "bg-red-50 border-red-250 text-red-700"
                    }`}>
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>

                <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
                  darkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-150"
                }`}>
                  <button
                    onClick={() => setShowImportDialog(false)}
                    className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                      darkMode ? "text-zinc-350 bg-zinc-800 border-zinc-700 hover:bg-zinc-750" : "text-zinc-705 bg-white border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleParseSyllabus}
                    disabled={isParsing || !syllabusText.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 disabled:bg-indigo-300 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {isParsing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Processing Imports...</span>
                      </>
                    ) : (
                      "Extract All Data"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}