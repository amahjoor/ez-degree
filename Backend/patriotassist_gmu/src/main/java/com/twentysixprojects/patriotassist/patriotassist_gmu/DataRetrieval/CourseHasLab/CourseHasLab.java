package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseHasLab;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.util.Iterator;

@Component
public class CourseHasLab {
    
    @Value("${project.data.path}")
    private String AllData_Path;

    public void getHasLab() {
        ObjectMapper mapper = new ObjectMapper();
        // Map to hold course key (e.g., "CS 211") and its lab status.
        Map<String, Boolean> courseHasLabMap = new HashMap<>();

        // Path to the CourseData folder.
        Path courseDataPath = Paths.get(AllData_Path, "CourseData");

        try (DirectoryStream<Path> dirStream = Files.newDirectoryStream(courseDataPath)) {
            // Iterate through each directory in CourseData.
            for (Path categoryDir : dirStream) {
                if (Files.isDirectory(categoryDir)) {
                    String dirName = categoryDir.getFileName().toString();
                    // Expected directory name format: "Full Course Category Name (Course Category Code)"
                    int start = dirName.lastIndexOf('(');
                    int end = dirName.lastIndexOf(')');
                    if (start > 0 && end > start) {
                        // Extract the full course category name and the course category code.
                        String fullCourseCategoryName = dirName.substring(0, start).trim();
                        String courseCategoryCode = dirName.substring(start + 1, end).trim();

                        // Process each JSON file in the category directory.
                        try (DirectoryStream<Path> fileStream = Files.newDirectoryStream(categoryDir, "*.json")) {
                            for (Path courseJsonFile : fileStream) {
                                // Parse the course data JSON file.
                                JsonNode rootNode = mapper.readTree(courseJsonFile.toFile());
                                // Iterate through all sections (e.g., "000 Level Courses", "100 Level Courses", etc.).
                                Iterator<Map.Entry<String, JsonNode>> sections = rootNode.fields();
                                while (sections.hasNext()) {
                                    Map.Entry<String, JsonNode> sectionEntry = sections.next();
                                    JsonNode coursesArray = sectionEntry.getValue();
                                    if (coursesArray.isArray()) {
                                        for (JsonNode course : coursesArray) {
                                            String courseTitle = course.get("courseTitle").asText(); // e.g., "CS 211" or "AE 002"
                                            // Assuming format: "[Course Category Code] [Course Code Number]"
                                            String[] parts = courseTitle.split(" ");
                                            if (parts.length >= 2) {
                                                String courseCodeNumber = parts[1];
                                                // Construct the key using the course category code from directory and the course number.
                                                String courseKey = courseCategoryCode + " " + courseCodeNumber;

                                                // Only process if we have not yet determined lab status for this course.
                                                if (!courseHasLabMap.containsKey(courseKey)) {
                                                    boolean hasLab = false;
                                                    // Construct path to the schedule data for Fall 2025.
                                                    Path scheduleDir = Paths.get(AllData_Path, "ScheduleData", "Fall 2025");

                                                    // Filter files by naming convention:
                                                    // "[Full Course Category Name]-[Course Code Number]-<anything>.json"
                                                    DirectoryStream.Filter<Path> filter = p -> {
                                                        String filename = p.getFileName().toString();
                                                        return filename.startsWith(fullCourseCategoryName + "-" + courseCodeNumber + "-")
                                                                && filename.endsWith(".json");
                                                    };

                                                    // Look through each matching schedule file.
                                                    try (DirectoryStream<Path> scheduleStream = Files.newDirectoryStream(scheduleDir, filter)) {
                                                        for (Path scheduleFile : scheduleStream) {
                                                            JsonNode scheduleNode = mapper.readTree(scheduleFile.toFile());
                                                            String schedCourseTitle = scheduleNode.get("CourseTitle").asText();
                                                            if (schedCourseTitle.contains("Lab for Lecture")) {
                                                                hasLab = true;
                                                                break;
                                                            }
                                                        }
                                                    } catch (IOException e) {
                                                        System.err.println("Error reading schedule files: " + e.getMessage());
                                                    }
                                                    // Record the lab status for the course.
                                                    courseHasLabMap.put(courseKey, hasLab);
                                                    // Print out the course code and lab status.
                                                    System.out.println(courseKey + ": " + hasLab);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (IOException e) {
                            System.err.println("Error reading course JSON files in directory " + categoryDir + ": " + e.getMessage());
                        }
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading CourseData directory: " + e.getMessage());
        }

        // Write the final course lab status map to CourseHasLab.json.
        try {
            Path courseHasLabPath = Paths.get(AllData_Path, "CourseHasLab.json");
            mapper.writerWithDefaultPrettyPrinter().writeValue(courseHasLabPath.toFile(), courseHasLabMap);
        } catch (IOException e) {
            System.err.println("Error writing CourseHasLab.json: " + e.getMessage());
        }
    }
}
