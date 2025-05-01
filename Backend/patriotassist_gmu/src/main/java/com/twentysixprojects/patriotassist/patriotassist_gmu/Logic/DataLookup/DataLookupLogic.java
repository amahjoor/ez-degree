package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.DataLookup;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class DataLookupLogic
{
    @Value("${project.data.path}")
    private String AllData_Path;    

    public List<String> CourseLookup(String partialCourseCode) {
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

    public String GetCourseCodeData(String CourseCode, String Semester) {
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> results = new ArrayList<>();
        try {
            // Step 1: Extract course prefix and course number from the CourseCode (e.g. "CS 211")
            String[] parts = CourseCode.split(" ");
            if (parts.length < 2) {
                return "{}"; // return empty JSON if format is invalid
            }
            String prefix = parts[0].trim();
            String courseNumber = parts[1].trim();
    
            // Step 2: Read CourseAbbr.json and determine the full course category name
            File courseAbbrFile = new File(AllData_Path + File.separator + "CourseAbbr" + File.separator + "CourseAbbr.json");
            if (!courseAbbrFile.exists()) {
                System.out.println("CourseAbbr.json not found at: " + courseAbbrFile.getAbsolutePath());
                return "{}";
            }
            Map<String, String> courseAbbrMap = mapper.readValue(courseAbbrFile, new TypeReference<Map<String, String>>() {});
            String fullCourseCategory = null;
            for (Map.Entry<String, String> entry : courseAbbrMap.entrySet()) {
                if (entry.getValue().equalsIgnoreCase(prefix)) {
                    fullCourseCategory = entry.getKey();
                    break;
                }
            }
            if (fullCourseCategory == null) {
                // fallback: if not found, use the prefix itself
                fullCourseCategory = prefix;
            }
    
            // Step 3: In the semester directory, find course data files matching the pattern: FullCourseCategoryName-CourseNumber-*.json
            File semesterDir = new File(AllData_Path + File.separator + "ScheduleData" + File.separator + Semester);
            if (!semesterDir.exists() || !semesterDir.isDirectory()) {
                System.out.println("Semester directory not found: " + semesterDir.getAbsolutePath());
                return "{}";
            }
            File[] files = semesterDir.listFiles();
            if (files != null) {
                String expectedPrefix = fullCourseCategory + "-" + courseNumber + "-";
                for (File file : files) {
                    String fileName = file.getName();
                    if (fileName.startsWith(expectedPrefix) && fileName.endsWith(".json")) {
                        // Step 4: Read the course data JSON file
                        Map<String, Object> courseData = mapper.readValue(file, new TypeReference<Map<String, Object>>() {});
                        
                        // Process the Instructor field if available
                        if (courseData.containsKey("Instructor")) {
                            String originalInstructor = courseData.get("Instructor").toString();
                            String processedInstructor = processInstructor(originalInstructor);
                            courseData.put("Instructor", processedInstructor);
                            
                            // Step 5: Augment course data with RMP data based on the processed instructor name
                            File rmpFile = new File(AllData_Path + File.separator + "RMP" + File.separator + "RMPData_All.json");
                            if (rmpFile.exists()) {
                                List<Map<String, Object>> rmpDataList = mapper.readValue(rmpFile, new TypeReference<List<Map<String, Object>>>() {});
                                for (Map<String, Object> rmpEntry : rmpDataList) {
                                    if (rmpEntry.get("name") != null &&
                                        rmpEntry.get("name").toString().equalsIgnoreCase(processedInstructor)) {
                                        courseData.put("RMPData", rmpEntry);
                                        break; // Stop after the first match
                                    }
                                }
                            }
                        }
                        results.add(courseData);
                    }
                }
            }
            
            // Step 6: Package the data as a JSON string and return
            return mapper.writeValueAsString(results);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "{}";
    }
    
    /**
     * Helper method to process the instructor name.
     * Example:
     * Input: "Pierce, Jerry (he/him/his) (Primary)"
     * Output: "Jerry Pierce"
     */
    private String processInstructor(String originalInstructor) {
        if (originalInstructor == null || originalInstructor.isEmpty()) {
            return originalInstructor;
        }
        String[] parts = originalInstructor.split(",");
        if (parts.length < 2) {
            return originalInstructor.replaceAll("\\(.*?\\)", "").trim();
        }
        String lastName = parts[0].trim();
        // Remove any parenthesis from the first name part
        String firstName = parts[1].replaceAll("\\(.*?\\)", "").trim();
        return firstName + " " + lastName;
    }
}
