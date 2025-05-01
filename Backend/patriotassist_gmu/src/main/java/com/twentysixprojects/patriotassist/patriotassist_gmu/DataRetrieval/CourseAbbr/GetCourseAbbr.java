package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseAbbr;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GetCourseAbbr {
    
    @Value("${project.data.path}")
    private String AllData_Path;

    private static String TempPath = "patriotassist_gmu\\\\src\\\\main\\\\java\\\\com\\\\twentysixprojects\\\\patriotassist\\\\patriotassist_gmu\\\\AllData";

    /**
     * Loads course abbreviations from folder names in AllData_Path\CourseData
     * and writes them to AllData_Path\CourseAbbr\CourseAbbr.json.
     */
    public void LoadCourseAbbr() {
        // Define the source directory for course folders
        File courseDataDir = new File(AllData_Path + "\\CourseData");
        if (!courseDataDir.exists() || !courseDataDir.isDirectory()) {
            System.err.println("CourseData directory does not exist: " + courseDataDir.getAbsolutePath());
            return;
        }

        // Map to hold course full name as key and abbreviation as value
        Map<String, String> courseAbbrMap = new java.util.HashMap<>();

        // Regular expression to extract "Full Name" and "Abbreviation" from folder names
        Pattern pattern = Pattern.compile("(.+)\\((.+)\\)$");

        // Process each folder in the CourseData directory
        for (File folder : courseDataDir.listFiles()) {
            if (folder.isDirectory()) {
                String folderName = folder.getName();
                Matcher matcher = pattern.matcher(folderName);
                if (matcher.find()) {
                    String fullName = matcher.group(1).trim();
                    String abbr = matcher.group(2).trim();
                    courseAbbrMap.put(fullName, abbr);
                }
            }
        }

        // Ensure the CourseAbbr directory exists
        File courseAbbrDir = new File(AllData_Path + "\\CourseAbbr");
        if (!courseAbbrDir.exists()) {
            courseAbbrDir.mkdirs();
        }

        // Write the course abbreviations to CourseAbbr.json
        File jsonFile = new File(courseAbbrDir, "CourseAbbr.json");
        ObjectMapper mapper = new ObjectMapper();
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(jsonFile, courseAbbrMap);
            System.out.println("Course abbreviations saved to: " + jsonFile.getAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Retrieves the course abbreviation given the full course name.
     *
     * @param fullCourseName the full name of the course (e.g., "Academic English")
     * @return the course abbreviation (e.g., "AE"), or null if not found or on error.
     */
    public static String getCourseAbbr(String fullCourseName) {
        // Define the JSON file path where the course abbreviations are stored
        File jsonFile = new File(TempPath + "\\CourseAbbr\\CourseAbbr.json");
        if (!jsonFile.exists()) {
            System.err.println("CourseAbbr.json file does not exist: " + jsonFile.getAbsolutePath());
            return null;
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            // Read the JSON file into a Map
            Map<String, String> courseAbbrMap = mapper.readValue(jsonFile, new TypeReference<Map<String, String>>() {});
            // Return the abbreviation corresponding to the full course name
            return courseAbbrMap.get(fullCourseName);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}
