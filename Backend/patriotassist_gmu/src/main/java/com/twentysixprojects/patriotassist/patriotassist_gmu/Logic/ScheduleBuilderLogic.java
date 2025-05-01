package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.ScheduleBuilderModel;

@Component
public class ScheduleBuilderLogic
{
    @Value("${project.data.path}")
    private String AllData_Path;
    
    public String GetCourses(ScheduleBuilderModel data)
    {
        try {
            // 1. Parse the CourseCode (e.g. "CS 211")
            String courseCode = data.getCourseCode().trim();
            String[] parts = courseCode.split("\\s+");
            if (parts.length < 2) {
                return new JSONObject().toString();
            }
            String abbr = parts[0];       // Abbreviated subject, e.g., "CS"
            String courseNumber = parts[1]; // e.g., "211"

            // 2. Map abbreviated code to full course category name using CourseAbbr.json.
            String courseAbbrPath = AllData_Path + File.separator + "CourseAbbr" + File.separator + "CourseAbbr.json";
            String abbrContent = new String(Files.readAllBytes(new File(courseAbbrPath).toPath()));
            JSONObject abbrJson = new JSONObject(abbrContent);
            
            String fullCourseName = null;
            // The JSON maps FullCourseName -> Abbreviation.
            for (String key : abbrJson.keySet()) {
                if (abbrJson.getString(key).equalsIgnoreCase(abbr)) {
                    fullCourseName = key;
                    break;
                }
            }
            if (fullCourseName == null) {
                // Could not find mapping; return empty JSON
                return new JSONObject().toString();
            }
            
            // 3. Locate all course files in the Term directory matching the given fullCourseName and courseNumber.
            String termDirPath = AllData_Path + File.separator + "ScheduleData" + File.separator + data.getTerm();
            File termDir = new File(termDirPath);
            if (!termDir.exists() || !termDir.isDirectory()) {
                return new JSONObject().toString();
            }
            
            File[] files = termDir.listFiles((dir, name) -> name.endsWith(".json"));
            if (files == null) {
                return new JSONObject().toString();
            }
            
            // Lists to hold the full contents of course files by schedule type.
            List<JSONObject> lectureCourses = new ArrayList<>();
            List<JSONObject> laboratoryCourses = new ArrayList<>();
            
            // Only process files starting with: fullCourseName + "-" + courseNumber + "-"
            String filePrefix = fullCourseName + "-" + courseNumber + "-";
            
            for (File f : files) {
                if (f.getName().startsWith(filePrefix)) {
                    // Read entire file content and parse as JSON.
                    String fileContent = new String(Files.readAllBytes(f.toPath()));
                    JSONObject courseJson = new JSONObject(fileContent);
                    
                    // Organize based on ScheduleType.
                    String scheduleType = courseJson.optString("ScheduleType", "").trim();
                    if ("Lecture".equalsIgnoreCase(scheduleType)) {
                        lectureCourses.add(courseJson);
                    } else if ("Laboratory".equalsIgnoreCase(scheduleType)) {
                        laboratoryCourses.add(courseJson);
                    }
                }
            }
            
            // 4. If the SortByRMPFilter is enabled, append RMP rating info.
            if (data.isSortByRMPFilter()) {
                // Read RMPData_All.json from RMP directory.
                String rmpPath = AllData_Path + File.separator + "RMP" + File.separator + "RMPData_All.json";
                String rmpContent = new String(Files.readAllBytes(new File(rmpPath).toPath()));
                JSONArray rmpArray = new JSONArray(rmpContent);
                
                // Create a lookup map for professor's formatted name -> quality rating.
                Map<String, Double> rmpLookup = new HashMap<>();
                for (int i = 0; i < rmpArray.length(); i++) {
                    JSONObject rmpEntry = rmpArray.getJSONObject(i);
                    String profName = rmpEntry.optString("name", "").trim();
                    double qualityRating = 0.0;
                    try {
                        qualityRating = Double.parseDouble(rmpEntry.optString("qualityRating", "0"));
                    } catch (NumberFormatException e) {
                        // Defaults to 0.0 on parse error
                    }
                    rmpLookup.put(profName.toLowerCase(), qualityRating);
                }
                
                // Function to format instructor name.
                // Example: "Tsirigotis, Peggy (Primary)" becomes "Peggy Tsirigotis"
                java.util.function.Function<String, String> formatInstructor = (instructor) -> {
                    if (instructor == null || instructor.isEmpty())
                        return instructor;
                    int parenIndex = instructor.indexOf(" (");
                    String baseName = (parenIndex > 0) ? instructor.substring(0, parenIndex) : instructor;
                    String[] nameParts = baseName.split(",");
                    if (nameParts.length == 2) {
                        String lastName = nameParts[0].trim();
                        String firstName = nameParts[1].trim();
                        return firstName + " " + lastName;
                    }
                    return baseName;
                };
                
                // Process course lists to add RMP rating.
                java.util.function.Consumer<List<JSONObject>> processCourses = (courseList) -> {
                    for (JSONObject course : courseList) {
                        String originalInstr = course.optString("Instructor", "");
                        String formattedInstr = formatInstructor.apply(originalInstr);
                        course.put("Instructor", formattedInstr);  // update with formatted name
                        
                        double rating = rmpLookup.getOrDefault(formattedInstr.toLowerCase(), 0.0);
                        course.put("RMPRating", rating);
                    }
                };
                processCourses.accept(lectureCourses);
                processCourses.accept(laboratoryCourses);
                
                // Sort courses in each list by descending RMPRating.
                Comparator<JSONObject> ratingComparator = (o1, o2) -> {
                    Double r1 = o1.optDouble("RMPRating", 0.0);
                    Double r2 = o2.optDouble("RMPRating", 0.0);
                    return r2.compareTo(r1);
                };
                lectureCourses.sort(ratingComparator);
                laboratoryCourses.sort(ratingComparator);
            }
            
            // 5. Build the final output JSON structure.
            JSONObject output = new JSONObject();
            output.put("Lecture", new JSONArray(lectureCourses));      // Contains full content of lecture files.
            output.put("Laboratory", new JSONArray(laboratoryCourses));  // Contains full content of laboratory files.
            
            return output.toString();
            
        } catch (IOException ex) {
            ex.printStackTrace();
            return new JSONObject().toString();
        } catch (Exception ex) {
            ex.printStackTrace();
            return new JSONObject().toString();
        }
    }
}
