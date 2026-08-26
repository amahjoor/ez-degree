package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleCustomModel;

@Component
public class GenerateScheduleLogicCustom {

    @Value("${project.data.path}")
    private String AllData_Path;

    public String getCreditAndCoursesAmount(String TermAndCourseCode)
    {
        // Split input into term and course code parts.
        String[] parts = TermAndCourseCode.split(":");
        if(parts.length != 2) {
            return "{\"error\": \"Invalid input format. Expected 'Term:CourseCode'\"}";
        }
        String term = parts[0].trim();
        String courseCodeStr = parts[1].trim(); // e.g. "CS 211"

        // Split the course code into abbreviation and course number.
        String[] codeParts = courseCodeStr.split(" ");
        if(codeParts.length != 2) {
            return "{\"error\": \"Invalid course code format. Expected format like 'CS 211'\"}";
        }
        String courseAbbr = codeParts[0].trim();
        String courseNumber = codeParts[1].trim();

        ObjectMapper mapper = new ObjectMapper();

        try {
            // 1. Load CourseAbbr.json to get the full course category name.
            String courseAbbrPath = AllData_Path + File.separator + "CourseAbbr" + File.separator + "CourseAbbr.json";
            Map<String, String> abbrMap = mapper.readValue(new File(courseAbbrPath), new TypeReference<Map<String, String>>() {});
            String fullCategoryName = null;
            // Invert mapping: for each (fullName, abbr) find matching abbreviation.
            for (Map.Entry<String, String> entry : abbrMap.entrySet()) {
                if(entry.getValue().equalsIgnoreCase(courseAbbr)) {
                    fullCategoryName = entry.getKey();
                    break;
                }
            }
            if(fullCategoryName == null) {
                return "{\"error\": \"Course abbreviation not found in CourseAbbr.json.\"}";
            }
            final String finalCategoryName = fullCategoryName;
            
            // 2. List all course JSON files in the ScheduleData/term directory.
            String termDirPath = AllData_Path + File.separator + "ScheduleData" + File.separator + term;
            File termDir = new File(termDirPath);
            File[] courseFiles = termDir.listFiles((dir, name) -> 
                name.endsWith(".json") && name.startsWith(finalCategoryName + "-" + courseNumber + "-")
            );
            
            // 3. Iterate over the files to retrieve credit hours and count courses.
            String lectureCredit = null;
            String labCredit = null;
            int lectureCount = 0;
            int labCount = 0;
            
            if(courseFiles != null) {
                for (File f : courseFiles) {
                    Map<String, Object> courseData = mapper.readValue(f, new TypeReference<Map<String, Object>>() {});
                    // Ensure the term matches.
                    if(!term.equals(courseData.get("Term"))) {
                        continue;
                    }
                    String scheduleType = (String) courseData.get("ScheduleType");
                    String creditHoursStr = (String) courseData.get("CreditHours");
                    if(scheduleType.equalsIgnoreCase("Lecture")) {
                        lectureCount++;
                        if(lectureCredit == null) {
                            lectureCredit = creditHoursStr.trim();
                        }
                    } else if(scheduleType.equalsIgnoreCase("Laboratory")) {
                        labCount++;
                        if(labCredit == null) {
                            labCredit = creditHoursStr.trim();
                        }
                    }
                }
            }
            
            // If no file was found for a type, mark it as "N/A".
            if(lectureCredit == null) {
                lectureCredit = "N/A";
            }
            if(labCredit == null) {
                labCredit = "N/A";
            }
            
            // 4. Build final JSON result.
            Map<String, Object> result = new HashMap<>();
            Map<String, Object> lectureMap = new HashMap<>();
            lectureMap.put("courses", lectureCount);
            lectureMap.put("credits", lectureCredit);
            Map<String, Object> labMap = new HashMap<>();
            labMap.put("courses", labCount);
            labMap.put("credits", labCredit);
            result.put("Lecture", lectureMap);
            result.put("Laboratory", labMap);
            
            return mapper.writeValueAsString(result);
            
        } catch (IOException e) {
            e.printStackTrace();
            return "{\"error\": \"An error occurred processing the files.\"}";
        }
    }



    public String getCourseCodeProfessorData(String TermAndCourseCode)
    {
       // Split input into term and course code parts.
        String[] parts = TermAndCourseCode.split(":");
        if(parts.length != 2) {
            return "{\"error\": \"Invalid input format. Expected 'Term:CourseCode'\"}";
        }
        String term = parts[0].trim();
        String courseCodeStr = parts[1].trim(); // e.g. "CS 211"
        
        // Split the course code into abbreviation and course number.
        String[] codeParts = courseCodeStr.split(" ");
        if(codeParts.length != 2) {
            return "{\"error\": \"Invalid course code format. Expected format like 'CS 211'\"}";
        }
        String courseAbbr = codeParts[0].trim();
        String courseNumber = codeParts[1].trim();

        ObjectMapper mapper = new ObjectMapper();
        
        try {
            // 1. Load CourseAbbr.json to get the full course category name.
            String courseAbbrPath = AllData_Path + File.separator + "CourseAbbr" + File.separator + "CourseAbbr.json";
            Map<String, String> abbrMap = mapper.readValue(new File(courseAbbrPath), new TypeReference<Map<String, String>>() {});
            String fullCategoryName = null;
            // Invert mapping: for each (fullName, abbr) find matching abbreviation.
            for (Map.Entry<String, String> entry : abbrMap.entrySet()) {
                if(entry.getValue().equalsIgnoreCase(courseAbbr)) {
                    fullCategoryName = entry.getKey();
                    break;
                }
            }
            if(fullCategoryName == null) {
                return "{\"error\": \"Course abbreviation not found in CourseAbbr.json.\"}";
            }
            
            // Create a final copy for use in the lambda.
            final String finalCategoryName = fullCategoryName;
            
            // 2. List all course JSON files in the Term directory.
            String termDirPath = AllData_Path + File.separator + "ScheduleData" + File.separator + term;
            File termDir = new File(termDirPath);
            File[] courseFiles = termDir.listFiles((dir, name) -> 
                name.endsWith(".json") && name.startsWith(finalCategoryName + "-" + courseNumber + "-")
            );
            
            // 3. Read RMP data once.
            String rmpFilePath = AllData_Path + File.separator + "RMP" + File.separator + "RMPData_All.json";
            List<Map<String, Object>> rmpData = mapper.readValue(new File(rmpFilePath), new TypeReference<List<Map<String, Object>>>() {});
            
            // Prepare lists for Lecture and Laboratory schedules.
            List<Map<String, Object>> lectureList = new ArrayList<>();
            List<Map<String, Object>> laboratoryList = new ArrayList<>();
            // Sets to keep track of already-added professors for duplicate checking.
            Set<String> lectureSet = new HashSet<>();
            Set<String> labSet = new HashSet<>();
            
            if(courseFiles != null) {
                for (File f : courseFiles) {
                    // Parse each course file.
                    Map<String, Object> courseData = mapper.readValue(f, new TypeReference<Map<String, Object>>() {});
                    // Check if the term in the file matches the input term.
                    if(!term.equals(courseData.get("Term"))) {
                        continue;
                    }
                    
                    // Get instructor and schedule type.
                    String instructorRaw = (String) courseData.get("Instructor");
                    String scheduleType = (String) courseData.get("ScheduleType");
                    String cleanedInstructor = cleanInstructorName(instructorRaw);
                    
                    // Skip if professor field is empty.
                    if(cleanedInstructor == null || cleanedInstructor.trim().isEmpty()) {
                        continue;
                    }
                    
                    // Check for duplicates and add to the appropriate set.
                    if(scheduleType.equalsIgnoreCase("Lecture")) {
                        if(lectureSet.contains(cleanedInstructor)) {
                            continue;
                        }
                        lectureSet.add(cleanedInstructor);
                    } else if(scheduleType.equalsIgnoreCase("Laboratory")) {
                        if(labSet.contains(cleanedInstructor)) {
                            continue;
                        }
                        labSet.add(cleanedInstructor);
                    }
                    
                    // Look up professor rating from RMP data.
                    Map<String, Object> professorRating = null;
                    for (Map<String, Object> rmpEntry : rmpData) {
                        if(cleanedInstructor.equalsIgnoreCase((String) rmpEntry.get("name"))) {
                            professorRating = rmpEntry;
                            break;
                        }
                    }
                    
                    // Build a result entry for this professor.
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("professor", cleanedInstructor);
                    if(professorRating != null) {
                        entry.put("qualityRating", professorRating.get("qualityRating"));
                        entry.put("ratingCount", professorRating.get("ratingCount"));
                    } else {
                        entry.put("qualityRating", "N/A");
                        entry.put("ratingCount", "N/A");
                    }
                    
                    // Group by ScheduleType.
                    if(scheduleType.equalsIgnoreCase("Lecture")) {
                        lectureList.add(entry);
                    } else if(scheduleType.equalsIgnoreCase("Laboratory")) {
                        laboratoryList.add(entry);
                    }
                }
            }
            
            // 4. Build final JSON result.
            Map<String, Object> finalResult = new HashMap<>();
            finalResult.put("Lecture", lectureList);
            finalResult.put("Laboratory", laboratoryList);
            
            return mapper.writeValueAsString(finalResult);
            
        } catch (IOException e) {
            e.printStackTrace();
            return "{\"error\": \"An error occurred processing the files.\"}";
        }
}

    private String cleanInstructorName(String instructorRaw) {
        // Remove any content in parentheses (e.g. " (Primary)").
        int parenIndex = instructorRaw.indexOf('(');
        if(parenIndex != -1) {
            instructorRaw = instructorRaw.substring(0, parenIndex).trim();
        }
        // Expecting a format like "LastName, FirstName"
        String[] nameParts = instructorRaw.split(",");
        if(nameParts.length == 2) {
            return nameParts[1].trim() + " " + nameParts[0].trim();
        } else {
            return instructorRaw.trim();
        }
    }

    /**
     * Returns a list of matching schedule file names for the provided custom model,
     * enforcing seat availability, day/time availability, and location preferences.
     */
    public List<String> getMatchingScheduleFiles(GenerateScheduleCustomModel scheduleData) {
        List<String> matchedFiles = new ArrayList<>();
    
        String term = scheduleData.getTerm();
        // Build path using File.separator
        String scheduleDataPath = AllData_Path + File.separator + "ScheduleData";
        String termDirPath = scheduleDataPath + File.separator + term;
        File termDir = new File(termDirPath);
        if (!termDir.exists() || !termDir.isDirectory()) {
            return matchedFiles;
        }
    
        File[] jsonFiles = termDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (jsonFiles == null) {
            return matchedFiles;
        }
    
        // Load CourseAbbr.json mapping from AllData_Path and invert it.
        // The JSON file has format: { "Full Category Name" : "AbbreviatedCode", ... }
        // We need the reverse: from abbreviated code (e.g., "BIOL") to full category name.
        Map<String, String> abbrToFullCategoryMap = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        try {
            File courseAbbrFile = new File(AllData_Path + File.separator + "CourseAbbr" + File.separator + "CourseAbbr.json");
            if (courseAbbrFile.exists()) {
                Map<String, String> courseAbbrMap = mapper.readValue(courseAbbrFile, new TypeReference<Map<String, String>>() {});
                for (Map.Entry<String, String> entry : courseAbbrMap.entrySet()) {
                    abbrToFullCategoryMap.put(entry.getValue(), entry.getKey());
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    
        List<String> courseCodes = scheduleData.getCourseCodes();
        if (courseCodes == null || courseCodes.isEmpty()) {
            return matchedFiles;
        }
    
        // Get the excluded professors list.
        List<String> excludedProfs = scheduleData.getExcludedProfessors();
    
        for (String courseCode : courseCodes) {
            // Split on colon to separate the actual course code from the lab flag.
            String[] courseParts = courseCode.split(":");
            String actualCourseCode = courseParts[0].trim();
            boolean labOnly = false;
            if (courseParts.length > 1) {
                labOnly = Boolean.parseBoolean(courseParts[1].trim());
            }
            // Parse the actual course code (e.g., "CS 211" -> deptCode: "CS", courseNumber: "211")
            String[] parts = actualCourseCode.split("\\s+");
            if (parts.length < 2) {
                continue;
            }
            String deptCode = parts[0];
            String courseNumber = parts[1];
    
            // Use the inverted mapping to get the full course category name.
            String fullCourseCategoryName = abbrToFullCategoryMap.get(deptCode);
            if (fullCourseCategoryName == null) {
                continue;
            }
    
            String regex = "^" + Pattern.quote(fullCourseCategoryName) + "-" 
                         + Pattern.quote(courseNumber) + "-\\d+\\.json$";
            Pattern pattern = Pattern.compile(regex);
    
            for (File jsonFile : jsonFiles) {
                String fileName = jsonFile.getName();
                Matcher matcher = pattern.matcher(fileName);
                if (matcher.matches()) {
                    try {
                        Map<String, Object> course = mapper.readValue(jsonFile, new TypeReference<Map<String, Object>>() {});
        
                        if (!scheduleData.getIgnoreSeatAvailability()) {
                            String seatsStr = (String) course.get("Seats");
                            int availableSeats = MiscHelper.parseAvailableSeats(seatsStr);
                            if (availableSeats == 0) {
                                continue;
                            }
                        }
        
                        List<String> locationPrefs = scheduleData.getLocationPreferences();
                        if (locationPrefs != null && !locationPrefs.isEmpty()) {
                            String campus = (String) course.get("Campus");
                            if (campus == null) {
                                continue;
                            }
                            boolean locationMatch = false;
                            for (String locPref : locationPrefs) {
                                if (campusMatchesPreference(campus, locPref)) {
                                    locationMatch = true;
                                    break;
                                }
                            }
                            if (!locationMatch) {
                                continue;
                            }
        
                            String meetingDaysStr = (String) course.get("MeetingDays");
                            String meetingTimesStr = (String) course.get("MeetingTimes");
                            if (meetingDaysStr == null || meetingTimesStr == null) {
                                continue;
                            }
                            String[] meetingDays = meetingDaysStr.split(",");
                            String[] times = meetingTimesStr.split("-");
                            if (times.length != 2) {
                                continue;
                            }
                            int courseStart = MiscHelper.convertTimeToMinutes(times[0].trim());
                            int courseEnd = MiscHelper.convertTimeToMinutes(times[1].trim());
        
                            Map<String, GenerateScheduleCustomModel.DayAvailability> availability = scheduleData.getAvailability();
                            boolean availableForAllDays = true;
                            for (String day : meetingDays) {
                                String trimmedDay = day.trim();
                                GenerateScheduleCustomModel.DayAvailability dayAvail = availability.get(trimmedDay);
                                if (dayAvail == null || !dayAvail.isSelected()) {
                                    availableForAllDays = false;
                                    break;
                                }
                                boolean intervalFound = false;
                                for (GenerateScheduleCustomModel.Interval interval : dayAvail.getIntervals()) {
                                    int availStart = MiscHelper.convertTimeToMinutes(interval.getStart());
                                    int availEnd = MiscHelper.convertTimeToMinutes(interval.getEnd());
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
                            if (!availableForAllDays) {
                                continue;
                            }
                        }
        
                        if (labOnly) {
                            String scheduleType = (String) course.get("ScheduleType");
                            if (scheduleType == null || !scheduleType.equalsIgnoreCase("Laboratory")) {
                                continue;
                            }
                        }
        
                        // Use helper method to check if the course should be excluded based on instructor.
                        if (shouldExcludeCourse(course, excludedProfs)) {
                            continue;
                        }
        
                        matchedFiles.add(fileName);
        
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        return matchedFiles;
    }
    
    /**
     * Helper method that checks whether a given course file should be excluded based on the excluded professors list.
     * It retrieves the "Instructor" field from the course, removes any parenthetical content, flips the name
     * from "Last, First" to "First Last" (if applicable), then for each excluded professor (splitting by space)
     * checks if the flipped instructor contains the first name of the excluded professor.
     *
     * @param course The course file's parsed data.
     * @param excludedProfs The list of excluded professor names.
     * @return true if the course should be excluded; false otherwise.
     */
    private boolean shouldExcludeCourse(Map<String, Object> course, List<String> excludedProfs) {
        if (excludedProfs == null || excludedProfs.isEmpty()) {
            return false;
        }
        String instructor = (String) course.get("Instructor");
        if (instructor == null) {
            return false;
        }
        // Remove content in parentheses.
        int parenIndex = instructor.indexOf('(');
        if (parenIndex != -1) {
            instructor = instructor.substring(0, parenIndex).trim();
        }
        // Flip the name from "Last, First" to "First Last" if applicable.
        String[] nameParts = instructor.split(",");
        String flippedName = nameParts.length == 2 ? nameParts[1].trim() + " " + nameParts[0].trim() : instructor;
        
        // Check each excluded professor.
        for (String excluded : excludedProfs) {
            String[] excludedParts = excluded.split(" ");
            if (excludedParts.length > 0) {
                String firstName = excludedParts[0];
                if (flippedName.contains(firstName)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean campusMatchesPreference(String campus, String locPref) {
        if (campus == null || locPref == null) {
            return false;
        }
        String campusLower = campus.toLowerCase();
        String prefLower = locPref.toLowerCase().trim();
        if (prefLower.equals("virtual") || prefLower.equals("online")) {
            return campusLower.contains("online") || campusLower.contains("virtual") || campusLower.contains("distance");
        }
        return campusLower.contains(prefLower) || prefLower.contains(campusLower);
    }
    
    public List<String> generateScheduleCustomCourseLookup(String partialCourseCode) {
        List<String> results = new ArrayList<>();
        try {
            ObjectMapper mapper = new ObjectMapper();
            File file = new File(AllData_Path + File.separator + "CourseHasLab.json");
            if (!file.exists()) {
                System.out.println("CourseHasLab.json not found at: " + file.getAbsolutePath());
                return results;
            }
            // Read the JSON into a Map of course code -> lab flag
            Map<String, Boolean> courseLabMap = mapper.readValue(file, new TypeReference<Map<String, Boolean>>() {});
            // Filter courses that contain the partial code (case-insensitive)
            for (Map.Entry<String, Boolean> entry : courseLabMap.entrySet()) {
                if (entry.getKey().toLowerCase().contains(partialCourseCode.toLowerCase())) {
                    results.add(entry.getKey() + " - Lab: " + entry.getValue());
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        // Return only the top 50 matches
        if (results.size() > 50) {
            return results.subList(0, 50);
        }
        return results;
    }
}
