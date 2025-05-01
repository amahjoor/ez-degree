package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.io.File;
import java.util.*;

public class CustomDegreeRequirementUtil {

    public static Set<String> calculateRequiredCourseCodes(String degreeReqFilePath) {
        Set<String> requiredCourseCodes = new HashSet<>();
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> degreeReq = mapper.readValue(new File(degreeReqFilePath),
                    new TypeReference<Map<String, Object>>() {});
            for (Object categoryObj : degreeReq.values()) {
                if (categoryObj instanceof Map) {
                    Map<String, Object> categoryMap = (Map<String, Object>) categoryObj;
                    Object requirements = categoryMap.get("Requirements");
                    if (requirements != null) {
                        collectCourseCodes(requirements, requiredCourseCodes);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return requiredCourseCodes;
    }

    private static void collectCourseCodes(Object node, Set<String> requiredCourseCodes) {
        if (node instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) node;
            if (map.containsKey("Code") && map.containsKey("Completed")) {
                Boolean completed = (Boolean) map.get("Completed");
                if (completed == null || !completed) {
                    String code = (String) map.get("Code");
                    if (code != null && !code.isEmpty()) {
                        requiredCourseCodes.add(code.trim());
                    }
                }
            }
            for (Object value : map.values()) {
                collectCourseCodes(value, requiredCourseCodes);
            }
        } else if (node instanceof List) {
            for (Object item : (List<?>) node) {
                collectCourseCodes(item, requiredCourseCodes);
            }
        }
    }
    
    public static Map<String, Boolean> calculateLabOnlyCourseMap(String degreeReqFilePath) {
        Map<String, Boolean> labOnlyMap = new HashMap<>();
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> degreeReq = mapper.readValue(new File(degreeReqFilePath),
                    new TypeReference<Map<String, Object>>() {});
            extractLabOnlyInfo(degreeReq, labOnlyMap);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return labOnlyMap;
    }
    
    private static void extractLabOnlyInfo(Object node, Map<String, Boolean> labOnlyMap) {
        if (node instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) node;
            if (map.containsKey("Code") && map.containsKey("LabOnly")) {
                String code = (String) map.get("Code");
                Object labOnlyObj = map.get("LabOnly");
                if (code != null && !code.isEmpty() && labOnlyObj instanceof Boolean) {
                    labOnlyMap.put(code.trim(), (Boolean) labOnlyObj);
                }
            }
            for (Object value : map.values()) {
                extractLabOnlyInfo(value, labOnlyMap);
            }
        } else if (node instanceof List) {
            for (Object item : (List<?>) node) {
                extractLabOnlyInfo(item, labOnlyMap);
            }
        }
    }
}
