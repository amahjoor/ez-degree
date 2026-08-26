import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LocalMajorData, ParsedMajorData } from '@/types/course';

// Helper function to determine program type from categories and name
function determineProgramType(name: string, categories: string[] = []): { programType: 'Major' | 'Minor' | 'Certificate' | 'Graduate', degreeType: string, college: string } {
  const nameUpper = name.toUpperCase();
  const categoriesStr = categories.join(' ').toUpperCase();
  
  let programType: 'Major' | 'Minor' | 'Certificate' | 'Graduate' = 'Major';
  let degreeType = '';
  let college = '';
  
  // Determine program type
  if (nameUpper.includes('MINOR')) {
    programType = 'Minor';
  } else if (nameUpper.includes('CERTIFICATE')) {
    programType = 'Certificate';
  } else if (categoriesStr.includes('GRADUATE') && !categoriesStr.includes('UNDERGRADUATE')) {
    // Only classify as Graduate if it has Graduate in categories but NOT Undergraduate
    programType = 'Graduate';
  } else if (nameUpper.includes(', PHD') || nameUpper.includes(', MS') || nameUpper.includes(', MA') || nameUpper.includes(', MBA') || nameUpper.includes(', MPH') || nameUpper.includes(', MPA') || nameUpper.includes(', MPP') || nameUpper.includes(', MSW') || nameUpper.includes(', EDS')) {
    // Check for specific graduate degree patterns with comma separator
    programType = 'Graduate';
  }
  
  // Extract degree type from name
  const degreeMatch = name.match(/, (BS|BA|MS|MA|MBA|PhD|EdS|MSW|MPA|MPP|MPH)\b/);
  if (degreeMatch) {
    degreeType = degreeMatch[1];
  } else if (nameUpper.includes('CERTIFICATE')) {
    degreeType = 'Certificate';
  } else if (nameUpper.includes('MINOR')) {
    degreeType = 'Minor';
  }
  
  // Extract college from categories
  const collegeMapping: { [key: string]: string } = {
    'COLLEGE OF ENGINEERING AND COMPUTING': 'College of Engineering and Computing',
    'COLLEGE OF SCIENCE': 'College of Science', 
    'COSTELLO COLLEGE OF BUSINESS': 'Costello College of Business',
    'COLLEGE OF HEALTH AND HUMAN SERVICES': 'College of Health and Human Services',
    'COLLEGE OF HUMANITIES AND SOCIAL SCIENCES': 'College of Humanities and Social Sciences',
    'COLLEGE OF EDUCATION AND HUMAN DEVELOPMENT': 'College of Education and Human Development',
    'COLLEGE OF VISUAL AND PERFORMING ARTS': 'College of Visual and Performing Arts',
    'SCHAR SCHOOL': 'Schar School of Policy and Government'
  };
  
  for (const [key, value] of Object.entries(collegeMapping)) {
    if (categoriesStr.includes(key)) {
      college = value;
      break;
    }
  }
  
  return { programType, degreeType, college };
}

// Helper function to extract course code from a string
function extractCourseCode(key: string, name: string = ''): string | null {
  // Look for course codes like "CS 112", "MATH 113", etc.
  const codeMatch = key.match(/^([A-Z]{2,4})\s+(\d{3}[A-Z]?)/);
  if (codeMatch) {
    return `${codeMatch[1]} ${codeMatch[2]}`;
  }
  
  // Also check in the name field
  const nameMatch = name.match(/^([A-Z]{2,4})\s+(\d{3}[A-Z]?)/);
  if (nameMatch) {
    return `${nameMatch[1]} ${nameMatch[2]}`;
  }
  
  return null;
}

// Helper function to parse requirement courses recursively
function parseRequirementCourses(classes: any, choiceGroup: string = ''): any[] {
  const courses: any[] = [];
  
  if (!classes || typeof classes !== 'object') return courses;
  
  Object.entries(classes).forEach(([key, value]: [string, any]) => {
    if (key.startsWith('bool') && value && typeof value === 'object' && value.classes) {
      // Boolean choice structure
      const boolCourses = parseRequirementCourses(value.classes, `${choiceGroup} ${value.boolword || 'or'}`);
      courses.push(...boolCourses);
    } else if (key.includes('Select') || key.includes('Choose')) {
      // Selection requirement
      if (value && typeof value === 'object' && value.classes) {
        const selectionCourses = parseRequirementCourses(value.classes, key);
        selectionCourses.forEach(course => {
          course.isChoice = true;
          course.choiceGroup = key;
        });
        courses.push(...selectionCourses);
      }
    } else {
      // Regular course or nested category
      const courseCode = extractCourseCode(key, value?.name);
      if (courseCode) {
        courses.push({
          code: courseCode,
          name: value?.name || key,
          credits: value?.hours || null,
          isRequired: !choiceGroup,
          isChoice: !!choiceGroup,
          choiceGroup,
          footnotes: value?.footnotes || [],
          url: value?.url
        });
      } else if (value && typeof value === 'object' && value.classes) {
        // Nested category
        courses.push(...parseRequirementCourses(value.classes, key));
      }
    }
  });
  
  return courses;
}

// Helper function to parse a requirement category
function parseRequirementCategory(categoryName: string, category: any): any {
  const courses = parseRequirementCourses(category.table?.classes || {});
  
  return {
    title: categoryName,
    totalCredits: category.table?.hours || undefined,
    courses,
    footnotes: category.footnotes || {},
    preNotes: category.pre_notes || [],
    postNotes: category.post_notes || []
  };
}

// Main function to parse local major data
function parseLocalMajorData(filename: string, data: LocalMajorData): ParsedMajorData {
  const name = filename;
  const { programType, degreeType, college } = determineProgramType(name, data.catagories);
  
  const requirementGroups: any[] = [];
  const concentrations: Set<string> = new Set();
  
  // Parse each requirement section
  data.requirements.forEach(reqSection => {
    Object.entries(reqSection).forEach(([categoryName, category]) => {
      if (category && typeof category === 'object') {
        const parsedGroup = parseRequirementCategory(categoryName, category);
        requirementGroups.push(parsedGroup);
        
        // Extract concentration names
        if (categoryName.includes('Concentration')) {
          const concMatch = categoryName.match(/Concentration (?:in )?([^(]+)/);
          if (concMatch) {
            concentrations.add(concMatch[1].trim());
          }
        }
      }
    });
  });
  
  return {
    banner: data.banner,
    name,
    programType,
    degreeType,
    totalCredits: data.hours,
    college,
    categories: data.catagories || [],
    requirementGroups,
    concentrations: Array.from(concentrations),
    hasConcentrations: concentrations.size > 0
  };
}

function parseFromRequirementsJson(id: string, data: any): ParsedMajorData {
  const name = data.degree_name || id;
  const { programType, degreeType, college } = determineProgramType(name, data.categories || []);
  const requirementGroups = (data.categories || []).map((category: any) => ({
    title: category.name,
    totalCredits: category.total_credits,
    courses: (category.courses || []).map((course: any) => ({
      code: course.code || course.id || '',
      name: course.title || course.name || '',
      credits: course.credits ?? null,
      isRequired: true,
      isChoice: Array.isArray(course.alternatives) && course.alternatives.length > 0,
      choiceGroup: '',
      footnotes: [],
    })),
    footnotes: {},
    preNotes: [],
    postNotes: [],
  }));
  const concentrations = (data.concentrations || [])
    .map((concentration: any) => concentration.name || concentration.id)
    .filter(Boolean);

  return {
    banner: id,
    name,
    programType,
    degreeType,
    totalCredits: String(data.total_credits ?? ''),
    college,
    categories: [],
    requirementGroups,
    concentrations,
    hasConcentrations: concentrations.length > 0,
  };
}

let cachedData: ParsedMajorData[] | null = null;

export async function GET(request: NextRequest) {
  try {
    // Return cached data if available
    if (cachedData !== null) {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      
      if (type) {
        const filtered = cachedData.filter(program => program.programType.toLowerCase() === type.toLowerCase());
        return NextResponse.json({ programs: filtered });
      }
      
      return NextResponse.json({ programs: cachedData, count: cachedData.length });
    }
    
    const parsedPrograms: ParsedMajorData[] = [];
    const seenIds = new Set<string>();
    const requirementsDir = path.join(process.cwd(), '..', 'data', 'majorRequirements');
    const majorsDir = path.join(process.cwd(), '..', 'data', 'majors');

    if (fs.existsSync(requirementsDir)) {
      for (const file of fs.readdirSync(requirementsDir)) {
        if (!file.endsWith('_requirements.json')) continue;
        try {
          const id = file.replace(/_requirements\.json$/, '');
          const payload = JSON.parse(fs.readFileSync(path.join(requirementsDir, file), 'utf8'));
          parsedPrograms.push(parseFromRequirementsJson(id, payload));
          seenIds.add(id);
        } catch (error) {
          console.error(`Error parsing requirements file ${file}:`, error);
        }
      }
    }

    if (fs.existsSync(majorsDir)) {
      for (const file of fs.readdirSync(majorsDir)) {
        if (!file.endsWith('.json') || file === 'all_programs.json' || file.startsWith('.')) continue;
        try {
          const filePath = path.join(majorsDir, file);
          if (fs.statSync(filePath).isDirectory()) continue;
          const majorData: LocalMajorData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (!majorData?.requirements) continue;
          const parsedData = parseLocalMajorData(file, majorData);
          if (!seenIds.has(parsedData.banner)) {
            parsedPrograms.push(parsedData);
          }
        } catch (error) {
          console.error(`Error parsing file ${file}:`, error);
        }
      }
    }

    if (parsedPrograms.length === 0) {
      return NextResponse.json({ error: 'Majors data directory not found' }, { status: 404 });
    }

    cachedData = parsedPrograms;
    
    // Filter by type if requested
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type) {
      const filtered = parsedPrograms.filter(program => program.programType.toLowerCase() === type.toLowerCase());
      return NextResponse.json({ programs: filtered });
    }
    
    return NextResponse.json({ 
      programs: parsedPrograms,
      count: parsedPrograms.length 
    });
    
  } catch (error) {
    console.error('Error loading major data:', error);
    return NextResponse.json({ 
      error: 'Failed to load major data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Clear cache endpoint
export async function DELETE() {
  cachedData = null;
  return NextResponse.json({ message: 'Cache cleared' });
} 