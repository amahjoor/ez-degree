import { LocalMajorData, ParsedMajorData, ParsedRequirementGroup, ParsedCourse, LocalMajorRequirement, BooleanCourse } from '@/types/course';

// Cache for parsed data
let cachedMajorData: ParsedMajorData[] | null = null;

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

// Helper function to parse boolean course structures
function parseBooleanCourse(courseData: any, choiceGroup: string = ''): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  
  if (courseData.classes) {
    Object.entries(courseData.classes).forEach(([key, value]: [string, any]) => {
      if (key.startsWith('bool') && value.classes) {
        // Nested boolean structure
        courses.push(...parseBooleanCourse(value, `${choiceGroup} ${courseData.boolword || 'or'}`));
      } else {
        const courseCode = extractCourseCode(key, value.name);
        if (courseCode) {
          courses.push({
            code: courseCode,
            name: value.name || key,
            credits: value.hours || null,
            isRequired: false,
            isChoice: true,
            choiceGroup: `${choiceGroup} ${courseData.boolword || 'or'}`.trim(),
            footnotes: value.footnotes || [],
            url: value.url
          });
        }
      }
    });
  }
  
  return courses;
}

// Helper function to parse requirement courses
function parseRequirementCourses(classes: any, choiceGroup: string = ''): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  
  Object.entries(classes).forEach(([key, value]: [string, any]) => {
    if (key.startsWith('bool') && value && typeof value === 'object' && value.classes) {
      // Boolean choice structure
      courses.push(...parseBooleanCourse(value, choiceGroup));
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
      // Regular course
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
function parseRequirementCategory(categoryName: string, category: any): ParsedRequirementGroup {
  const courses = parseRequirementCourses(category.table?.classes || {});
  
  // Extract concentrations from category names
  const concentrations: string[] = [];
  if (categoryName.includes('Concentration')) {
    const concMatch = categoryName.match(/Concentration (?:in )?([^(]+)/);
    if (concMatch) {
      concentrations.push(concMatch[1].trim());
    }
  }
  
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
  
  const requirementGroups: ParsedRequirementGroup[] = [];
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

// Function to load and parse all major data from the API
async function loadAllMajorData(): Promise<ParsedMajorData[]> {
  if (cachedMajorData !== null) {
    return cachedMajorData as ParsedMajorData[];
  }
  
  try {
    const response = await fetch('/api/local-majors');
    if (!response.ok) {
      throw new Error(`Failed to fetch major data: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    cachedMajorData = data.programs || [];
    return cachedMajorData;
  } catch (error) {
    console.error('Error loading major data:', error);
    return [];
  }
}

// Service interface
export class MajorDataService {
  private data: ParsedMajorData[] = [];
  private loaded = false;
  
  async initialize(): Promise<void> {
    if (!this.loaded) {
      this.data = await loadAllMajorData();
      this.loaded = true;
    }
  }
  
  async getAllPrograms(): Promise<ParsedMajorData[]> {
    await this.initialize();
    return this.data;
  }
  
  async getProgramsByType(programType: string): Promise<ParsedMajorData[]> {
    await this.initialize();
    return this.data.filter(program => program.programType === programType);
  }
  
  async getMajors(): Promise<ParsedMajorData[]> {
    return this.getProgramsByType('Major');
  }
  
  async getMinors(): Promise<ParsedMajorData[]> {
    return this.getProgramsByType('Minor');
  }
  
  async getCertificates(): Promise<ParsedMajorData[]> {
    return this.getProgramsByType('Certificate');
  }
  
  async getGraduatePrograms(): Promise<ParsedMajorData[]> {
    return this.getProgramsByType('Graduate');
  }
  
  async getProgramByName(name: string): Promise<ParsedMajorData | null> {
    await this.initialize();
    return this.data.find(program => program.name === name) || null;
  }
  
  async getProgramsByCollege(college: string): Promise<ParsedMajorData[]> {
    await this.initialize();
    return this.data.filter(program => program.college === college);
  }
  
  async searchPrograms(query: string): Promise<ParsedMajorData[]> {
    await this.initialize();
    const searchTerm = query.toLowerCase();
    return this.data.filter(program => 
      program.name.toLowerCase().includes(searchTerm) ||
      program.college.toLowerCase().includes(searchTerm) ||
      program.categories.some(cat => cat.toLowerCase().includes(searchTerm))
    );
  }
  
  async getConcentrations(programName: string): Promise<string[]> {
    const program = await this.getProgramByName(programName);
    return program?.concentrations || [];
  }
  
  async getProgramRequirements(programName: string, concentration?: string): Promise<ParsedRequirementGroup[]> {
    const program = await this.getProgramByName(programName);
    if (!program) return [];
    
    if (concentration) {
      // Filter requirement groups for specific concentration
      return program.requirementGroups.filter(group => 
        group.title.includes(concentration) || 
        !program.hasConcentrations || 
        !group.title.includes('Concentration')
      );
    }
    
    return program.requirementGroups;
  }
  
  // Clear cache (useful for development/testing)
  clearCache(): void {
    cachedMajorData = null;
    this.loaded = false;
    this.data = [];
  }
}

// Export singleton instance
export const majorDataService = new MajorDataService(); 