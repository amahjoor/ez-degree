package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.io.File;
import java.util.Map;

public class CustomCourseAbbrUtil {

    private static Map<String, String> courseAbbrMap;

    /**
     * Loads the course abbreviation mapping from the file:
     * AllData_Path\CourseAbbr\CourseAbbr.json
     * 
     * @param allDataPath The base path for project data.
     * @throws Exception if the file cannot be read or parsed.
     */
    public static void loadMapping(String allDataPath) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        File abbrFile = new File(allDataPath 
                + File.separator + "CourseAbbr" 
                + File.separator + "CourseAbbr.json");
        courseAbbrMap = mapper.readValue(abbrFile, new TypeReference<Map<String, String>>() {});
    }

    /**
     * Returns the abbreviation for the given full course subject name.
     * If no abbreviation is found, an IllegalArgumentException is thrown.
     *
     * @param fullName The full course subject name.
     * @return The abbreviation.
     */
    public static String getCourseAbbr(String fullName) {
        if (courseAbbrMap == null) {
            throw new IllegalStateException("Course abbreviation mapping not loaded.");
        }
        if (!courseAbbrMap.containsKey(fullName)) {
            throw new IllegalArgumentException("No abbreviation found for course subject: " + fullName);
        }
        return courseAbbrMap.get(fullName);
    }
}
