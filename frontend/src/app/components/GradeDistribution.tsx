'use client';

import { useState, useMemo } from 'react';

// Define types based on the ones used in the course page
interface Review {
  comment?: string;
  date: string;
  difficultyRating: number;
  clarityRating?: number;
  helpfulRating?: number;
  grade: string;
  textbookUse?: string | number;
  wouldTakeAgain?: boolean;
  attendanceMandatory?: string;
  isForCredit?: boolean;
  isForOnlineClass?: boolean;
  ratingTags?: string[];
  thumbsDownTotal?: number;
  thumbsUpTotal?: number;
}

interface Professor {
  firstName: string;
  lastName: string;
  department: string;
  avgRating: number;
  avgDifficulty: number;
  wouldTakeAgainPercent: number;
  clarityRating?: number;
  helpfulRating?: number;
  averageGrade?: string;
  reviews: Review[];
  url?: string;
}

type GradeKey = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';

const GRADE_ORDER: GradeKey[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const GRADE_VALUES: Record<GradeKey, number> = {
  'A+': 4.33,
  'A': 4.0,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3.0,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2.0,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1.0,
  'D-': 0.67,
  'F': 0,
};

interface GradeDistributionProps {
  professors: Professor[];
}

const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-green-500';
  if (grade.startsWith('B')) return 'bg-blue-500';
  if (grade.startsWith('C')) return 'bg-yellow-500';
  if (grade.startsWith('D')) return 'bg-orange-500';
  return 'bg-red-500';
};

// Function to extract semester from date string
// Maps review dates to the most likely semester the student actually took the course
const extractSemesterFromDate = (dateStr: string): string => {
  try {
    if (!dateStr || dateStr.trim() === '') {
      return "Unknown";
    }
    
    // Handle the specific format: "2018-06-29 02:47:28 +0000 UTC"
    // Convert to a format JavaScript can parse
    let cleanDateStr = dateStr.trim();
    
    // Remove the "+0000 UTC" suffix and replace with "Z" for UTC
    if (cleanDateStr.includes('+0000 UTC')) {
      cleanDateStr = cleanDateStr.replace(' +0000 UTC', 'Z');
      // Also need to add "T" between date and time for ISO format
      cleanDateStr = cleanDateStr.replace(' ', 'T');
    }
    
    const date = new Date(cleanDateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date after cleanup:', cleanDateStr, 'from original:', dateStr);
      return "Unknown";
    }
    
    const month = date.getMonth(); // 0-based: Jan=0, Dec=11
    const year = date.getFullYear();
    
    // Check if year is valid
    if (isNaN(year) || year < 2000 || year > 2030) {
      console.warn('Invalid year:', year, 'from date:', dateStr);
      return "Unknown";
    }
    
    let semester;
    let semesterYear;
    
    // Map review timing to most likely course semester
    if (month >= 0 && month <= 3) {      // Jan-Apr
      // Reviews written in early year likely about previous Fall semester
      semester = "Fall";
      semesterYear = year - 1;
    } else if (month >= 4 && month <= 7) { // May-Aug
      // Reviews written in late spring/summer likely about current Spring semester
      semester = "Spring";
      semesterYear = year;
    } else {                             // Sep-Dec
      // Reviews written in fall likely about previous Spring semester
      // (students often review when planning for next semester)
      semester = "Spring";
      semesterYear = year;
    }
    
    return `${semester} ${semesterYear}`;
  } catch (e) {
    console.warn('Error parsing date:', dateStr, e);
    return "Unknown";
  }
};

const calculateAverage = (gradeDistribution: Record<string, { count: number; percentage: number }>) => {
  let totalValue = 0;
  let totalCount = 0;
  
  Object.entries(gradeDistribution).forEach(([grade, data]) => {
    if (grade in GRADE_VALUES) {
      totalValue += GRADE_VALUES[grade as GradeKey] * data.count;
      totalCount += data.count;
    }
  });
  
  if (totalCount === 0) return 'N/A';
  
  const average = totalValue / totalCount;
  
  // Convert numeric average to letter grade
  if (average > 4.0) return 'A+';
  if (average > 3.67) return 'A';
  if (average > 3.33) return 'A-';
  if (average > 3.0) return 'B+';
  if (average > 2.67) return 'B';
  if (average > 2.33) return 'B-';
  if (average > 2.0) return 'C+';
  if (average > 1.67) return 'C';
  if (average > 1.33) return 'C-';
  if (average > 1.0) return 'D+';
  if (average > 0.67) return 'D';
  if (average > 0.33) return 'D-';
  return 'F';
};

const findMedian = (gradeDistribution: Record<string, { count: number; percentage: number }>) => {
  const totalGrades = Object.values(gradeDistribution).reduce((sum, data) => sum + data.count, 0);
  if (totalGrades === 0) return 'N/A';
  
  const midpoint = totalGrades / 2;
  let currentSum = 0;
  
  for (const grade of GRADE_ORDER) {
    if (gradeDistribution[grade]) {
      currentSum += gradeDistribution[grade].count;
      if (currentSum >= midpoint) {
        return grade;
      }
    }
  }
  
  return 'N/A';
};

export default function GradeDistribution({ professors }: GradeDistributionProps) {
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAllSemesters, setShowAllSemesters] = useState<boolean>(false);
  const [showAllProfessors, setShowAllProfessors] = useState<boolean>(false);
  
  // Extract all available semesters from reviews
  const availableSemesters = useMemo(() => {
    const semesters = new Set<string>();
    
    professors.forEach(professor => {
      professor.reviews.forEach(review => {
        if (review.date) {
          const semester = extractSemesterFromDate(review.date);
          semesters.add(semester);
        }
      });
    });
    
          // Sort semesters from newest to oldest
      return Array.from(semesters).sort((a, b) => {
        // Handle "Unknown" semesters - push them to the end
        if (a === "Unknown" && b === "Unknown") return 0;
        if (a === "Unknown") return 1;
        if (b === "Unknown") return -1;
        
        // Extract year and semester for comparison
        const [aSemester, aYear] = a.split(' ');
        const [bSemester, bYear] = b.split(' ');
        
        // Parse years safely
        const aYearNum = parseInt(aYear);
        const bYearNum = parseInt(bYear);
        
        // Handle invalid years
        if (isNaN(aYearNum) || isNaN(bYearNum)) {
          return a.localeCompare(b);
        }
        
        // Compare years first (newest first)
        const yearDiff = bYearNum - aYearNum;
        if (yearDiff !== 0) return yearDiff;
        
        // If same year, compare semester
        const semesterRank = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
        return (semesterRank[bSemester as keyof typeof semesterRank] || 999) - 
               (semesterRank[aSemester as keyof typeof semesterRank] || 999);
      });
  }, [professors]);
  
  // Filter and limit semesters based on search and show more toggle
  const displayedSemesters = useMemo(() => {
    // Filter semesters by search term
    const searchLower = searchTerm.toLowerCase();
    const filteredSemesters = availableSemesters.filter(sem => 
      sem.toLowerCase().includes(searchLower)
    );
    
    // If not showing all and not searching, limit to recent semesters
    if (!showAllSemesters && !searchTerm) {
      return filteredSemesters.slice(0, 5); // Show most recent 5 semesters
    }
    
    return filteredSemesters;
  }, [availableSemesters, searchTerm, showAllSemesters]);
  
  // Toggle semester selection
  const toggleSemester = (semester: string) => {
    const newSelection = selectedSemesters.includes(semester)
      ? selectedSemesters.filter(s => s !== semester)
      : [...selectedSemesters, semester];
    
    setSelectedSemesters(newSelection);
  };
  
  // Generate list of professors
  const availableProfessors = useMemo(() => {
    const professorSet = new Set<string>();
    professors.forEach(p => {
      professorSet.add(`${p.firstName} ${p.lastName}`);
    });
    return Array.from(professorSet);
  }, [professors]);
  
  // Filter professors for display based on search and visibility settings
  const displayedProfessors = useMemo(() => {
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const filteredProfessors = availableProfessors.filter(prof => 
      prof.toLowerCase().includes(searchLower)
    );
    
    // Limit display if not searching or showing all
    if (!showAllProfessors && !searchTerm) {
      return filteredProfessors.slice(0, 8); // Show first 8 professors
    }
    
    return filteredProfessors;
  }, [availableProfessors, searchTerm, showAllProfessors]);
  
  // Toggle professor selection
  const toggleProfessor = (professor: string) => {
    const newSelection = selectedProfessors.includes(professor)
      ? selectedProfessors.filter(p => p !== professor)
      : [...selectedProfessors, professor];
    
    setSelectedProfessors(newSelection);
  };
  
  const gradeDistribution = useMemo(() => {
    // Initialize with all possible grades
    const distribution: Record<string, { count: number; percentage: number }> = {};
    GRADE_ORDER.forEach(grade => {
      distribution[grade] = { count: 0, percentage: 0 };
    });
    
    let totalGrades = 0;
    
    professors.forEach(professor => {
      // Skip if filtering by professor and this professor isn't selected
      // If no professors are selected, include all professors
      const professorName = `${professor.firstName} ${professor.lastName}`;
      if (selectedProfessors.length > 0 && !selectedProfessors.includes(professorName)) {
        return;
      }
      
      professor.reviews.forEach(review => {
        if (!review.grade) return;
        
        // Skip if the grade isn't in our predefined list
        if (!GRADE_ORDER.includes(review.grade as GradeKey)) return;
        
        // Apply semester filter if needed
        // If no semesters are selected, include all semesters
        if (selectedSemesters.length > 0) {
          const reviewSemester = extractSemesterFromDate(review.date);
          if (!selectedSemesters.includes(reviewSemester)) return;
        }
        
        distribution[review.grade].count += 1;
        totalGrades += 1;
      });
    });
    
    // Calculate percentages
    if (totalGrades > 0) {
      GRADE_ORDER.forEach(grade => {
        distribution[grade].percentage = (distribution[grade].count / totalGrades) * 100;
      });
    }
    
    return distribution;
  }, [professors, selectedProfessors, selectedSemesters]);
  
  const totalGrades = useMemo(() => {
    return Object.values(gradeDistribution).reduce((sum, data) => sum + data.count, 0);
  }, [gradeDistribution]);
  
  const avgGrade = useMemo(() => calculateAverage(gradeDistribution), [gradeDistribution]);
  const medianGrade = useMemo(() => findMedian(gradeDistribution), [gradeDistribution]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex flex-col space-y-4">
        {/* Unified search for both filters */}
        <div className="relative mb-2">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm"
            placeholder="Search professors or semesters..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value) {
                setShowAllProfessors(true);
                setShowAllSemesters(true);
              }
            }}
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-col space-y-4">
          {/* Professor selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Professors</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {displayedProfessors.map(professor => (
                <button
                  key={professor}
                  onClick={() => toggleProfessor(professor)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedProfessors.includes(professor)
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {professor}
                </button>
              ))}
              
              {/* Show more/less buttons for professors */}
              {!showAllProfessors && !searchTerm && availableProfessors.length > displayedProfessors.length && (
                <button 
                  onClick={() => setShowAllProfessors(true)}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                >
                  <span>Show more</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              
              {showAllProfessors && !searchTerm && (
                <button 
                  onClick={() => setShowAllProfessors(false)}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                >
                  <span>Show less</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Semester tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <div className="flex flex-wrap gap-2">
              {displayedSemesters.map(semester => (
                <button
                  key={semester}
                  onClick={() => toggleSemester(semester)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedSemesters.includes(semester)
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {semester}
                </button>
              ))}
              
              {/* Show more/less buttons for semesters */}
              {!showAllSemesters && !searchTerm && availableSemesters.length > displayedSemesters.length && (
                <button 
                  onClick={() => setShowAllSemesters(true)}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                >
                  <span>Show more</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              
              {showAllSemesters && !searchTerm && (
                <button 
                  onClick={() => setShowAllSemesters(false)}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                >
                  <span>Show less</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Grade distribution chart */}
        <div className="border rounded-md p-4 mt-4">
          {totalGrades > 0 ? (
            <div className="space-y-3">
              {GRADE_ORDER.map(grade => {
                const data = gradeDistribution[grade];
                if (!data || data.count === 0) return null;
                
                return (
                  <div key={grade} className="flex items-center">
                    <div className="w-6 font-medium text-gray-700">{grade}</div>
                    <div className="flex-1 mx-2">
                      <div 
                        className={`h-6 ${getGradeColor(grade)} rounded`}
                        style={{ width: `${Math.max(data.percentage, 2)}%` }}
                        title={`${data.percentage.toFixed(1)}% (${data.count})`}
                      />
                    </div>
                    <div className="w-24 text-sm text-gray-600">
                      {data.percentage.toFixed(0)}% ({data.count})
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No grade data available for the selected filters.
            </div>
          )}
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between border-t pt-3 text-sm">
          <div>
            <span className="font-medium">Avg grade:</span> {avgGrade}
          </div>
          <div>
            <span className="font-medium">Median:</span> {medianGrade}
          </div>
          <div>
            <span className="font-medium">n =</span> {totalGrades}
          </div>
        </div>
      </div>
    </div>
  );
} 