package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic;

import java.io.File;
import java.io.IOException;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleModel;

import java.util.*;
import java.util.regex.Matcher;

@Component
public class GenerateScheduleLogic {
    @Value("${project.data.path}")
    private String AllData_Path;

    public List<String> ConstraintSatisfiedScheduledCourses(GenerateScheduleModel scheduleData) {
        return getSeatAvailability_UnCompletedCourse(scheduleData);
    }

    private List<String> getSeatAvailability_UnCompletedCourse(GenerateScheduleModel schedulingData) {
        // First get the eligible courses based on location preferences and availability time.
        List<String> eligibleCourses = getEligibleSchedule_LocationPreferences_AvailableTime(schedulingData);
        List<String> filteredCourses = new ArrayList<>();

        String term = schedulingData.getTerm();
        String scheduleDataPath = AllData_Path + File.separator + "ScheduleData";
        String termDirPath = scheduleDataPath + File.separator + term;
        File termDir = new File(termDirPath);
        if (!termDir.exists() || !termDir.isDirectory()) {
            System.out.println("Term directory not found: " + termDirPath);
            return filteredCourses;
        }
        
        // Loop over each eligible course file name.
        for (String jsonFileName : eligibleCourses) {
            File jsonFile = new File(termDir, jsonFileName);
            if (!jsonFile.exists() || !jsonFile.isFile()) continue;
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> course = mapper.readValue(jsonFile, new TypeReference<Map<String, Object>>() {});
                
                // 1. Check seat availability if ignoreSeatAvailability is false.
                if (!schedulingData.getIgnoreSeatAvailability()) {
                    String seatsStr = (String) course.get("Seats");
                    int availableSeats = MiscHelper.parseAvailableSeats(seatsStr);
                    if (availableSeats == 0) {
                        continue; // Skip course if no seats are available.
                    }
                }
                
                // 2. Construct course code from the JSON file.
                String courseSubject = (String) course.get("CourseSubject");
                String courseNumber = (String) course.get("CourseNumber");
                if (courseSubject == null || courseNumber == null) {
                    // If unable to build a course code, include the course by default.
                    filteredCourses.add(jsonFileName);
                    continue;
                }
                String courseCode = courseSubject.trim() + " " + courseNumber.trim();
                
                // 3. Search for a matching course in the requirements.
                Map<String, Object> matchingReq = null;
                Object reqsObj = schedulingData.getRequirements();
                if (reqsObj instanceof Map) {
                    Map<String, Object> reqs = (Map<String, Object>) reqsObj;
                    for (Object sectionObj : reqs.values()) {
                        if (sectionObj instanceof Map) {
                            Map<String, Object> sectionMap = (Map<String, Object>) sectionObj;
                            Object sectionRequirements = sectionMap.get("Requirements");
                            matchingReq = findCourseNodeWithCode(sectionRequirements, courseCode);
                            if (matchingReq != null) break;
                        }
                    }
                }
                
                boolean includeCourse = true;
                if (matchingReq != null) {
                    Boolean completed = (Boolean) matchingReq.get("Completed");
                    Boolean hasLab = (Boolean) matchingReq.get("HasLab");
                    Boolean labOnly = (Boolean) matchingReq.get("LabOnly");
                    if (completed == null) completed = false;
                    if (hasLab == null) hasLab = false;
                    if (labOnly == null) labOnly = false;
                    
                    if (!hasLab) {
                        // For non-lab courses: if already completed, skip it.
                        if (completed) {
                            includeCourse = false;
                        }
                    } else {
                        // For courses with labs:
                        if (labOnly) {
                            // Only include the course if its CourseTitle (in lowercase) does NOT contain "lab".
                            String courseTitle = ((String) course.get("CourseTitle")).toLowerCase();
                            if (courseTitle.contains("lab")) {
                                includeCourse = false;
                            }
                        } else {
                            // When labOnly is false, include only if the course is not completed.
                            if (completed) {
                                includeCourse = false;
                            }
                        }
                    }
                }
                
                if (includeCourse) {
                    filteredCourses.add(jsonFileName);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return filteredCourses;
    }

    private List<String> getEligibleSchedule_LocationPreferences_AvailableTime(GenerateScheduleModel schedulingData) {
        //AvailableTime needs fixing currently
        //System.out.println("Availability: " + schedulingData.toString());

        // Get all eligible schedule courses as JSON file names plus extra info.
        List<String> eligibleCourses = getEligibleScheduledCourses(schedulingData);
    
        String term = schedulingData.getTerm();
        String scheduleDataPath = AllData_Path + File.separator + "ScheduleData";
        String termDirPath = scheduleDataPath + File.separator + term;
        File termDir = new File(termDirPath);
        if (!termDir.exists() || !termDir.isDirectory()) {
            System.out.println("Term directory not found: " + termDirPath);
            return new ArrayList<>();
        }
    
        List<String> filteredCourses = new ArrayList<>();
        List<String> locationPrefs = schedulingData.getLocationPreferences();
        if (locationPrefs == null || locationPrefs.isEmpty()) {
            // If no location preferences provided, return an empty list or all eligible courses as needed.
            return filteredCourses;
        }
        
        // The first two elements in eligibleCourses are deptCode and full course category name,
        // so we start from index 2 which should be the matching JSON file names.
        for (int i = 2; i < eligibleCourses.size(); i++) {
            String jsonFileName = eligibleCourses.get(i);
            File jsonFile = new File(termDir, jsonFileName);
            if (!jsonFile.exists() || !jsonFile.isFile()) {
                continue;
            }
            try {
                ObjectMapper mapper = new ObjectMapper();
                // Read the schedule course JSON file into a Map.
                Map<String, Object> course = mapper.readValue(jsonFile, new TypeReference<Map<String, Object>>() {});
                String campus = (String) course.get("Campus");
                if (campus != null) {
                    // Check location preferences.
                    boolean locationMatch = false;
                    for (String locPref : locationPrefs) {
                        if (locPref.toLowerCase().contains(campus.toLowerCase())) {
                            locationMatch = true;
                            break;
                        }
                    }
                    if (!locationMatch) {
                        continue; // Skip course if location doesn't match.
                    }
                }
  
                // Check availability.
                // Get the course's meeting days and times.
                String meetingDaysStr = (String) course.get("MeetingDays");
                String meetingTimesStr = (String) course.get("MeetingTimes");
                if (meetingDaysStr == null || meetingTimesStr == null) {
                    continue;
                }
                // Parse meeting days (assume comma-separated, e.g., "Monday,Wednesday")
                String[] meetingDays = meetingDaysStr.split(",");
                // Parse meeting times; assume format "hh:mm AM/PM - hh:mm AM/PM"
                String[] times = meetingTimesStr.split("-");
                if (times.length != 2) {
                    continue;
                }
                int courseStart = MiscHelper.convertTimeToMinutes(times[0].trim());
                int courseEnd = MiscHelper.convertTimeToMinutes(times[1].trim());
                
                // Retrieve the availability map from the model.
                Map<String, GenerateScheduleModel.DayAvailability> availability = schedulingData.getAvailability();
                boolean availableForAllDays = true;
                for (String day : meetingDays) {
                    String trimmedDay = day.trim();
                    // Check if the day is in availability and is selected.
                    GenerateScheduleModel.DayAvailability dayAvail = availability.get(trimmedDay);
                    if (dayAvail == null || !dayAvail.isSelected()) {
                        availableForAllDays = false;
                        break;
                    }
                    // Check if at least one interval in this day covers the course meeting time.
                    boolean intervalFound = false;
                    for (GenerateScheduleModel.Interval interval : dayAvail.getIntervals()) {
                        int availStart = MiscHelper.convertTimeToMinutes(interval.getStart());
                        int availEnd = MiscHelper.convertTimeToMinutes(interval.getEnd());
                        // Check inclusively if the course meeting time fits in this interval.
                        if (courseStart >= availStart && courseEnd <= availEnd) {
                            intervalFound = true;
                            break;
                        }
                    }
                    if (!intervalFound) {
                        availableForAllDays = false;
                        break;
                    }
                }
                if (availableForAllDays) {
                    filteredCourses.add(jsonFileName);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return filteredCourses;
    }

    private List<String> getEligibleScheduledCourses(GenerateScheduleModel schedulingData) {
        List<String> eligibleCourses = getEligibleCoursesFromPreReq(schedulingData);
        List<String> scheduledCourses = new ArrayList<>();
    
        String term = schedulingData.getTerm();
        String scheduleDataPath = AllData_Path + File.separator + "ScheduleData";
        String termDirPath = scheduleDataPath + File.separator + term;
        File termDir = new File(termDirPath);
        if (!termDir.exists() || !termDir.isDirectory()) {
            System.out.println("Term directory not found: " + termDirPath);
            return scheduledCourses;
        }
    
        if (eligibleCourses == null || eligibleCourses.isEmpty()) {
            return scheduledCourses;
        }
    
        // Cache to store department code -> full course category name mapping
        Map<String, String> deptToCategoryMap = new HashMap<>();
    
        // Locate the CourseData directory.
        String courseDataPath = AllData_Path + File.separator + "CourseData";
        File courseDataDir = new File(courseDataPath);
        if (!courseDataDir.exists() || !courseDataDir.isDirectory()) {
            System.out.println("CourseData directory not found: " + courseDataPath);
            return scheduledCourses;
        }
    
        // List all JSON files in the term directory.
        File[] jsonFiles = termDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (jsonFiles == null) {
            System.out.println("No schedule JSON files found in: " + termDirPath);
            return scheduledCourses;
        }
    
        // Use a set to avoid duplicate file names.
        Set<String> matchingFilesSet = new LinkedHashSet<>();
    
        // Loop over each eligible course.
        for (String courseCode : eligibleCourses) {
            String[] codeParts = courseCode.split("\\s+");
            if (codeParts.length < 2) {
                System.out.println("Invalid course code format: " + courseCode);
                continue;
            }
            String deptCode = codeParts[0];      // e.g., "CS", "MATH", "PHIL"
            String courseNumber = codeParts[1];    // e.g., "211", "123", "267"
    
            // Look up full course category name for this dept from the cache or by scanning CourseData.
            String fullCourseCategoryName = deptToCategoryMap.get(deptCode);
            if (fullCourseCategoryName == null) {
                File[] categoryDirs = courseDataDir.listFiles(File::isDirectory);
                if (categoryDirs != null) {
                    for (File dir : categoryDirs) {
                        String dirName = dir.getName();
                        if (dirName.contains("(" + deptCode + ")")) {
                            int index = dirName.indexOf(" (" + deptCode + ")");
                            if (index != -1) {
                                fullCourseCategoryName = dirName.substring(0, index);
                                deptToCategoryMap.put(deptCode, fullCourseCategoryName);
                                break;
                            }
                        }
                    }
                }
                if (fullCourseCategoryName == null) {
                    System.out.println("Full course category name not found for dept: " + deptCode);
                    continue;
                }
            }
    
            // Build regex pattern: ^[FullCourseCategoryName]-[courseNumber]-\d+\.json$
            String regex = "^" + Pattern.quote(fullCourseCategoryName) + "-" 
                         + Pattern.quote(courseNumber) + "-\\d+\\.json$";
            Pattern pattern = Pattern.compile(regex);
    
            // Loop over all JSON files to find matches.
            for (File jsonFile : jsonFiles) {
                String fileName = jsonFile.getName();
                Matcher matcher = pattern.matcher(fileName);
                if (matcher.matches()) {
                    matchingFilesSet.add(fileName);
                }
            }
        }
    
        // Return the matching file names.
        scheduledCourses.addAll(matchingFilesSet);
        return scheduledCourses;
    }
    
    @SuppressWarnings("unchecked")
    private List<String> getEligibleCoursesFromPreReq(GenerateScheduleModel schedulingData) {
        List<String> eligibleCourses = new ArrayList<>();
        Set<String> completedCourses = new HashSet<>();
        Object reqsObject = schedulingData.getRequirements();
        
        if (reqsObject == null || !(reqsObject instanceof Map)) {
            return eligibleCourses;
        }
        
        // Cast to a Map<String, Object> where keys are requirement categories.
        Map<String, Object> requirementsMap = (Map<String, Object>) reqsObject;
        
        // First pass: collect all completed courses.
        for (Object categoryObj : requirementsMap.values()) {
            if (categoryObj instanceof Map) {
                Map<String, Object> categoryMap = (Map<String, Object>) categoryObj;
                if (categoryMap.containsKey("Requirements")) {
                    Object reqTree = categoryMap.get("Requirements");
                    EligibleCoursesFromPreReq.collectCompletedCourses(reqTree, completedCourses);
                }
            }
        }
        
        // Load the degree requirements JSON from file.
        String degreeReqsPath = AllData_Path + File.separator + "DegreeRequirements" 
                                + File.separator + schedulingData.getSelectedDegree() + ".json";
        Map<String, Object> degreeReqs = null;
        try {
            ObjectMapper mapper = new ObjectMapper();
            degreeReqs = mapper.readValue(new File(degreeReqsPath), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Prepare a variable to hold MasonCore data (load only once if needed)
        Map<String, Object> masonCoreData = null;
        
        // Second pass: evaluate every course node that is not yet completed.
        for (Object categoryObj : requirementsMap.values()) {
            if (categoryObj instanceof Map) {
                Map<String, Object> categoryMap = (Map<String, Object>) categoryObj;
                if (categoryMap.containsKey("Requirements")) {
                    Object reqTree = categoryMap.get("Requirements");
                    List<Map<String, Object>> courseNodes = new ArrayList<>();
                    EligibleCoursesFromPreReq.collectCourseNodes(reqTree, courseNodes);
                    
                    for (Map<String, Object> courseNode : courseNodes) {
                        // Handle standard requirement nodes with a "Code" property.
                        if (courseNode.containsKey("Code")) {
                            Boolean isCompleted = (Boolean) courseNode.get("Completed");
                            if (isCompleted != null && isCompleted) {
                                continue;
                            }
                            String courseCode = (String) courseNode.get("Code");
                            boolean meetsPrereq = false;
                            
                            // Check the ForceNoPreReq flag from the degree requirements JSON.
                            if (degreeReqs != null) {
                                Map<String, Object> courseData = findCourseNodeWithCode(degreeReqs, courseCode);
                                if (courseData != null && Boolean.TRUE.equals(courseData.get("ForceNoPreReq"))) {
                                    meetsPrereq = true;
                                }
                            }
                            
                            // If not eligible via ForceNoPreReq, evaluate prerequisites normally.
                            if (!meetsPrereq) {
                                String prereqJson = getPreRequisiteCourses(courseCode);
                                if (prereqJson == null || prereqJson.equalsIgnoreCase("NoPreReq")) {
                                    meetsPrereq = true;
                                } else {
                                    try {
                                        ObjectMapper mapper = new ObjectMapper();
                                        Object prereqExpr = mapper.readValue(prereqJson, Object.class);
                                        meetsPrereq = EligibleCoursesFromPreReq.evaluatePrereq(prereqExpr, completedCourses);
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                        meetsPrereq = false;
                                    }
                                }
                            }
                            
                            if (meetsPrereq && !eligibleCourses.contains(courseCode)) {
                                eligibleCourses.add(courseCode);
                            }
                        }
                        // Handle nodes using the new MasonCore format.
                        else if (courseNode.containsKey("MasonCore")) {
                            Boolean isCompleted = (Boolean) courseNode.get("Completed");
                            if (isCompleted != null && isCompleted) {
                                continue;
                            }
                            String masonCoreCategoryReq = (String) courseNode.get("MasonCore");
                            
                            // Load MasonCore.json if not already loaded.
                            if (masonCoreData == null) {
                                try {
                                    ObjectMapper mapper = new ObjectMapper();
                                    String masonCorePath = AllData_Path + File.separator + "MasonCore" 
                                                           + File.separator + "MasonCore.json";
                                    masonCoreData = mapper.readValue(new File(masonCorePath), new TypeReference<Map<String, Object>>() {});
                                } catch (Exception e) {
                                    e.printStackTrace();
                                    continue;
                                }
                            }
                            
                            // Expecting masonCoreData to have a "categories" field that is a List.
                            List<Map<String, Object>> categories = (List<Map<String, Object>>) masonCoreData.get("categories");
                            if (categories == null) {
                                continue;
                            }
                            // For each category, check if its "category" field contains the MasonCore requirement text.
                            for (Map<String, Object> category : categories) {
                                String categoryTag = (String) category.get("category");
                                if (categoryTag != null && categoryTag.contains(masonCoreCategoryReq)) {
                                    // Get the list of courses from this category.
                                    List<Map<String, Object>> courses = (List<Map<String, Object>>) category.get("courses");
                                    if (courses == null) {
                                        continue;
                                    }
                                    // Add each course code from the MasonCore category.
                                    for (Map<String, Object> course : courses) {
                                        String code = (String) course.get("code");
                                        if (code != null && !eligibleCourses.contains(code)) {
                                            eligibleCourses.add(code);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return eligibleCourses;
    }
    
    /**
     * Recursively searches the given JSON tree (as a Map) for a course with the specified code.
     * Returns the course node if found; otherwise returns null.
     */
    private Map<String, Object> findCourseNodeWithCode(Object node, String courseCode) {
        if (node == null) {
            return null;
        }
        
        if (node instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) node;
            // If this map has a "Code" property, check it.
            if (map.containsKey("Code") && courseCode.equals(map.get("Code"))) {
                return map;
            }
            // Otherwise, iterate over all values in the map.
            for (Object value : map.values()) {
                Map<String, Object> found = findCourseNodeWithCode(value, courseCode);
                if (found != null) {
                    return found;
                }
            }
        } else if (node instanceof List) {
            for (Object item : (List<?>) node) {
                Map<String, Object> found = findCourseNodeWithCode(item, courseCode);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
    
    // Returns a list of course codes required
    private String getPreRequisiteCourses(String CourseCode) {
        String CourseData_Path = AllData_Path + File.separator + "CourseData";
    
        String DegreeCode = "";
        String DegreeNumber = "";
     
        String[] parts = CourseCode.split("\\s+");
        DegreeCode = parts[0];
        DegreeNumber = parts[1];
    
        File CourseDataDir = new File(CourseData_Path);
        if (!CourseDataDir.exists() || !CourseDataDir.isDirectory()) {
            System.out.println("Null 1 " + CourseData_Path);
            return null;
        }
    
        File DegreeCodeDir = null;
        File[] dirs = CourseDataDir.listFiles(File::isDirectory);
        if (dirs != null) {
            for (File dir : dirs) {
                if (dir.getName().contains("(" + DegreeCode + ")")) {
                    DegreeCodeDir = dir;
                    break;
                }
            }
        }
        if (DegreeCodeDir == null) {
            System.out.println("Null 2");
            return null;
        }
    
        char levelDigit = DegreeNumber.charAt(0);
        String levelStr = levelDigit + "00";
        String fileName = levelStr + " Level Courses.json"; 
        String jsonKey = levelStr + " Level Courses";       
    
        File CourseFile = new File(DegreeCodeDir, fileName);
        if (!CourseFile.exists() || !CourseFile.isFile()) {
            System.out.println("Null 3");
            return null;
        }
    
        ObjectMapper mapper = new ObjectMapper();
        Map<String, List<Map<String, Object>>> courseData;
        try {
            courseData = mapper.readValue(CourseFile, new TypeReference<Map<String, List<Map<String, Object>>>>() {});
        } catch (IOException e) {
            e.printStackTrace();
            System.out.println("Null 4");
            return null;
        }
    
        List<Map<String, Object>> courses = courseData.get(jsonKey);
        if (courses == null) {
            System.out.println("Null 5");
            return null;
        }
    
        Map<String, Object> TargetCourse = null;
        for (Map<String, Object> course : courses) {
            String CourseTitle = (String) course.get("courseTitle");
            if (CourseTitle != null && CourseTitle.equalsIgnoreCase(CourseCode)) {
                TargetCourse = course;
                break;
            }
        }
        if (TargetCourse == null) {
            System.out.println("Null 6");
            return null;
        }
    
        String PreReqString = (String) TargetCourse.get("preRequisite");
        if (PreReqString == null || PreReqString.isEmpty()) {
            System.out.println("Null 7");
            return null;
        }
        // Added check to handle "NoPreReq" explicitly.
        if (PreReqString.equalsIgnoreCase("NoPreReq")) {
            return "NoPreReq";
        }
    
        int colonIndex = PreReqString.indexOf(":");
        if (colonIndex != -1) {
            PreReqString = PreReqString.substring(colonIndex + 1).trim();
        }
    
        int lastParenIndex = PreReqString.lastIndexOf(")");
        if (lastParenIndex != -1) {
            PreReqString = PreReqString.substring(0, lastParenIndex + 1);
        }
    
        PrereqParser parser = new PrereqParser(PreReqString, DegreeCode);
        Object parsedPrereq = parser.parseExpression();
    
        try {
            return mapper.writeValueAsString(parsedPrereq);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Null 8");
            return null;
        }
    }
}

// PrereqParser, EligibleCoursesFromPreReq, and MiscHelper classes remain unchanged except for their file path handling if needed.

class PrereqParser {
    private String input;
    private int pos;
    private String deptPrefix;
    
    public PrereqParser(String input, String deptPrefix) {
        this.input = input;
        this.pos = 0;
        this.deptPrefix = deptPrefix;
    }
    
    // Skip whitespace characters
    private void skipWhitespace() {
        while (pos < input.length() && Character.isWhitespace(input.charAt(pos))) {
            pos++;
        }
    }
    
    // Peek the current character without advancing
    private char peek() {
        if (pos < input.length()) {
            return input.charAt(pos);
        }
        return '\0';
    }
    
    // Check if the input at current position starts with a given keyword (case-insensitive)
    private boolean startsWithIgnoreCase(String keyword) {
        return input.substring(pos).toLowerCase().startsWith(keyword.toLowerCase());
    }
    
    // Helper method to add a new item to a list if it is not already present (for course code leaves)
    private void addUniqueItem(List<Object> items, Object newItem) {
        // If the item is a leaf (a Map with "CourseCode"), check if its course code is already in the list.
        if (newItem instanceof Map) {
            Map<?, ?> newMap = (Map<?, ?>) newItem;
            if (newMap.containsKey("CourseCode")) {
                String newCode = (String) newMap.get("CourseCode");
                for (Object item : items) {
                    if (item instanceof Map) {
                        Map<?, ?> existingMap = (Map<?, ?>) item;
                        if (existingMap.containsKey("CourseCode") && newCode.equals(existingMap.get("CourseCode"))) {
                            return; // duplicate found, do not add
                        }
                    }
                }
            }
        }
        items.add(newItem);
    }
    
    // Parse an Expression which handles "and" at the top level.
    public Object parseExpression() {
        Object expr = parseOrExpr();
        skipWhitespace();
        List<Object> items = new ArrayList<>();
        addUniqueItem(items, expr);
        while (true) {
            skipWhitespace();
            if (startsWithIgnoreCase("and")) {
                pos += 3; // consume "and"
                skipWhitespace();
                Object right = parseOrExpr();
                addUniqueItem(items, right);
            } else {
                break;
            }
        }
        if (items.size() == 1) {
            return expr;
        } else {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("Operator", "AND");
            node.put("Items", items);
            return node;
        }
    }
    
    // Parse an OrExpr that handles "or" or commas as separators.
    private Object parseOrExpr() {
        Object term = parseTerm();
        skipWhitespace();
        List<Object> items = new ArrayList<>();
        addUniqueItem(items, term);
        while (true) {
            skipWhitespace();
            if (startsWithIgnoreCase("or")) {
                pos += 2; // consume "or"
                skipWhitespace();
                Object nextTerm = parseTerm();
                addUniqueItem(items, nextTerm);
            } else if (peek() == ',') {
                pos++; // skip comma
                skipWhitespace();
                Object nextTerm = parseTerm();
                addUniqueItem(items, nextTerm);
            } else {
                break;
            }
        }
        if (items.size() == 1) {
            return term;
        } else {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("Operator", "OR");
            node.put("Items", items);
            return node;
        }
    }
    
    // Parse a Term, which is either a course code token or a parenthesized Expression.
    private Object parseTerm() {
        skipWhitespace();
        char ch = peek();
        if (ch == '(') {
            pos++; // skip '('
            Object expr = parseExpression();
            skipWhitespace();
            if (peek() == ')') {
                pos++; // skip ')'
            }
            return expr;
        } else {
            // Use a regex to capture the entire token, including optional prefix letters,
            // digits, and optional trailing letters/asterisks. Also ensure not to match keywords.
            Pattern tokenPattern = Pattern.compile("^(?!and\\b|or\\b)((?:[A-Za-z]+\\s*)?\\d+[A-Za-z\\*]*)", Pattern.CASE_INSENSITIVE);
            String remaining = input.substring(pos);
            Matcher matcher = tokenPattern.matcher(remaining);
            if (matcher.find()) {
                String token = matcher.group(1);
                pos += matcher.end();
                String cleaned = cleanCourseCode(token, deptPrefix);
                Map<String, String> courseNode = new LinkedHashMap<>();
                courseNode.put("CourseCode", cleaned);
                return courseNode;
            }
            return null;
        }
    }
    
    // Cleans a token by extracting the digits; if the prefix is missing, it is prepended.
    private String cleanCourseCode(String token, String deptPrefix) {
        token = token.trim();
        // This regex captures an optional letter group and then the digits.
        Pattern pattern = Pattern.compile("([A-Za-z]+)?\\s*(\\d+)");
        Matcher matcher = pattern.matcher(token);
        if (matcher.find()) {
            String digits = matcher.group(2);
            return deptPrefix + " " + digits;
        }
        return token;
    }
}

class EligibleCoursesFromPreReq {
    @SuppressWarnings("unchecked")
    public static void collectCompletedCourses(Object node, Set<String> completedCourses) {
        if (node instanceof Map) {
            Map<String, Object> nodeMap = (Map<String, Object>) node;
            if (nodeMap.containsKey("Code")) {
                Boolean completed = (Boolean) nodeMap.get("Completed");
                if (completed != null && completed) {
                    String courseCode = (String) nodeMap.get("Code");
                    completedCourses.add(courseCode);
                }
            }
            if (nodeMap.containsKey("Items")) {
                Object items = nodeMap.get("Items");
                collectCompletedCourses(items, completedCourses);
            }
        } else if (node instanceof List) {
            List<?> nodeList = (List<?>) node;
            for (Object item : nodeList) {
                collectCompletedCourses(item, completedCourses);
            }
        }
    }
    
    public static void collectCourseNodes(Object node, List<Map<String, Object>> courseNodes) {
        if (node instanceof Map) {
            Map<String, Object> nodeMap = (Map<String, Object>) node;
            if (nodeMap.containsKey("Code") || nodeMap.containsKey("MasonCore")) {
                courseNodes.add(nodeMap);
            }
            if (nodeMap.containsKey("Items")) {
                Object items = nodeMap.get("Items");
                collectCourseNodes(items, courseNodes);
            }
        } else if (node instanceof List) {
            List<?> nodeList = (List<?>) node;
            for (Object item : nodeList) {
                collectCourseNodes(item, courseNodes);
            }
        }
    }

    @SuppressWarnings("unchecked")
    public static boolean evaluatePrereq(Object expr, Set<String> completedCourses) {
        if (expr instanceof Map) {
            Map<String, Object> exprMap = (Map<String, Object>) expr;
            if (exprMap.containsKey("Operator")) {
                String operator = (String) exprMap.get("Operator");
                List<?> items = (List<?>) exprMap.get("Items");
                if ("AND".equalsIgnoreCase(operator)) {
                    for (Object item : items) {
                        if (!evaluatePrereq(item, completedCourses)) {
                            return false;
                        }
                    }
                    return true;
                } else if ("OR".equalsIgnoreCase(operator)) {
                    for (Object item : items) {
                        if (evaluatePrereq(item, completedCourses)) {
                            return true;
                        }
                    }
                    return false;
                }
            } else if (exprMap.containsKey("CourseCode")) {
                String reqCourseCode = (String) exprMap.get("CourseCode");
                return completedCourses.contains(reqCourseCode);
            }
        }
        // Default to false if the structure is not recognized.
        return false;
    }
}

class MiscHelper {
    public static int convertTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return -1;
        }
        
        timeStr = timeStr.trim();
        
        // Check if the string contains AM or PM (ignoring case)
        if (timeStr.toUpperCase().contains("AM") || timeStr.toUpperCase().contains("PM")) {
            // Expecting format: "hh:mm AM/PM"
            String[] parts = timeStr.split(" ");
            if (parts.length != 2) {
                return -1;
            }
            String[] hm = parts[0].split(":");
            if (hm.length != 2) {
                return -1;
            }
            try {
                int hour = Integer.parseInt(hm[0]);
                int minute = Integer.parseInt(hm[1]);
                String amPm = parts[1].toUpperCase();
                if ("PM".equals(amPm) && hour < 12) {
                    hour += 12;
                } else if ("AM".equals(amPm) && hour == 12) {
                    hour = 0;
                }
                return hour * 60 + minute;
            } catch (NumberFormatException e) {
                return -1;
            }
        } else {
            // Assume 24-hour format "HH:mm"
            String[] hm = timeStr.split(":");
            if (hm.length != 2) {
                return -1;
            }
            try {
                int hour = Integer.parseInt(hm[0].trim());
                int minute = Integer.parseInt(hm[1].trim());
                return hour * 60 + minute;
            } catch (NumberFormatException e) {
                return -1;
            }
        }
    }

    // Helper method to parse the number of available seats from the "Seats" field.
    public static int parseAvailableSeats(String seatsStr) {
        if (seatsStr == null || seatsStr.isEmpty()) return 0;
        try {
            // Assuming the format is: "X of Y seats remain..." where X is the available count.
            String[] parts = seatsStr.split(" ");
            return Integer.parseInt(parts[0]);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Recursively searches the given JSON tree for a course with the specified code.
     * Returns the course node if found; otherwise returns null.
     */
    public static Map<String, Object> findCourseNodeWithCode(Object node, String courseCode) {
        if (node == null) {
            return null;
        }
        
        if (node instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) node;
            // Check if this map has a "Code" property that matches.
            if (map.containsKey("Code") && courseCode.equals(map.get("Code"))) {
                return map;
            }
            // Otherwise, iterate over all values.
            for (Object value : map.values()) {
                Map<String, Object> found = findCourseNodeWithCode(value, courseCode);
                if (found != null) {
                    return found;
                }
            }
        } else if (node instanceof List) {
            for (Object item : (List<?>) node) {
                Map<String, Object> found = findCourseNodeWithCode(item, courseCode);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
}
