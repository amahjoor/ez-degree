package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API.DataLookup;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.DataLookup.DataLookupLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.ScheduleTermCatalog;

@RestController
@RequestMapping("/api/data-lookup")
public class DataLookup_API
{
    @Autowired
    private DataLookupLogic DLL;

    @Autowired
    private ScheduleTermCatalog scheduleTermCatalog;

    @PostMapping("/data-lookup-course-code")
    public List<String> CourseCodeLookup(@RequestParam String PartialCourseCode)
    {
        return DLL.CourseLookup(PartialCourseCode);
    }

    @GetMapping("/term-list")
    public List<String> getSupportedTermList() {
        return scheduleTermCatalog.listCatalogTerms();
    }

    @PostMapping("/course-code-data")
    public String provideCourseCodeData(@RequestBody Map<String, String> payload) {
        String courseCode = payload.get("CourseCode");
        String semester = payload.get("Semester");
        return DLL.GetCourseCodeData(courseCode, semester);
    }
}
