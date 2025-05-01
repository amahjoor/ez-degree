package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class V2_ScheduleBuilderLogic
{
    @Value("${project.data.path}")
    private String AllData_Path;

    public String GetCourseCodeData(String Term, String CourseCode)
    {
        try {
            ObjectMapper mapper = new ObjectMapper();

            // 1) load CourseAbbr.json
            File abbrFile = new File(
                AllData_Path +
                File.separator + "CourseAbbr" +
                File.separator + "CourseAbbr.json"
            );
            Map<String, String> abbrMap = mapper.readValue(
                abbrFile,
                new TypeReference<Map<String, String>>() {}
            );

            // 2) split "CS 211"
            String[] parts = CourseCode.trim().split("\\s+");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid CourseCode: " + CourseCode);
            }
            String courseAbbrev = parts[0];
            String courseNumber = parts[1];

            // 3) find full subject name
            String subjectFullName = abbrMap.entrySet().stream()
                .filter(e -> e.getValue().equalsIgnoreCase(courseAbbrev))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElseThrow(() ->
                    new IllegalArgumentException("Abbreviation not found: " + courseAbbrev)
                );

            // 4) locate schedule-data directory for this term
            String scheduleDirPath = AllData_Path +
                File.separator + "ScheduleData" +
                File.separator + Term;
            File scheduleDir = new File(scheduleDirPath);
            if (!scheduleDir.isDirectory()) {
                throw new IllegalArgumentException(
                    "Schedule data directory not found: " + scheduleDirPath
                );
            }

            // 5) filter for files named "Computer Science-211-*.json"
            String prefix = subjectFullName + "-" + courseNumber + "-";
            FilenameFilter jsonFilter = (dir, name) ->
                name.startsWith(prefix) && name.endsWith(".json");

            File[] jsonFiles = scheduleDir.listFiles(jsonFilter);
            List<JsonNode> dataList = new ArrayList<>();

            if (jsonFiles != null) {
                for (File f : jsonFiles) {
                    JsonNode node = mapper.readTree(f);
                    dataList.add(node);
                }
            }

            // 6) return as JSON array string
            return mapper.writeValueAsString(dataList);

        } catch (IOException ex) {
            throw new RuntimeException("Error reading schedule data for " + CourseCode, ex);
        }
    }
}
