package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API.V2;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogicCustom;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.ScheduleTermCatalog;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.V2_ScheduleBuilderLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom.CustomTimefoldScheduler;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleCustomModel;

@RestController
@RequestMapping("/api/v2/schedule-builder")
public class V2_ScheduleBuilder_API
{
    @Autowired
    private V2_ScheduleBuilderLogic V2_SBL;

    @Autowired
    private GenerateScheduleLogicCustom GSLC;

    @Autowired
    private CustomTimefoldScheduler CTFS;

    @Autowired
    private ScheduleTermCatalog scheduleTermCatalog;

    @GetMapping("/term-list")
    public List<String> getSupportedTermList() {
        List<String> supportedTermList = scheduleTermCatalog.listCatalogTerms();
        System.out.println("Supported Term List: " + supportedTermList);
        return supportedTermList;
    }

    @GetMapping("/get-course-code-data")
    public String getCourseCodeData(@RequestParam String Term, @RequestParam String CourseCode)
    {
        String Data = V2_SBL.GetCourseCodeData(Term, CourseCode);

        System.out.println("GetCourseCodeData Obtained: " + Data);
        return Data;
    }

    // AI - Generate Schedule For You

    @GetMapping("/course-lookup")
    public List<String> CustomCourseLookup(@RequestParam String PartialCourseCode)
    {
        List<String> Data = GSLC.generateScheduleCustomCourseLookup(PartialCourseCode);
        System.out.println("Data: " + Data);
        return Data;
    }

    @GetMapping("/credit-course-amount")
    public String getCreditAndCoursesAmount(@RequestParam String TermAndCourseCode)
    {
        String Data = GSLC.getCreditAndCoursesAmount(TermAndCourseCode);
        System.out.println("credit course amount data: " + Data + " " + TermAndCourseCode);
        return Data;
    }

    @GetMapping("/course-code-professor")
    public String getCourseCodeProfessorData(@RequestParam String TermAndCourseCode)
    {
        System.out.println("Term and Course Code: " + TermAndCourseCode);
        String Data = GSLC.getCourseCodeProfessorData(TermAndCourseCode);
        System.out.println(Data);
        return Data;
    }

    @PostMapping("/generate-custom-schedule")
    public ResponseEntity<?> generateCustomSchedule(@RequestBody GenerateScheduleCustomModel request)
    {
       System.out.println("Raw Request Data: " + request.toString());
       System.out.println("Data: " + request.getCourseCodes());
       if (request.getCourseCodes() == null || request.getCourseCodes().isEmpty()) {
           return ResponseEntity.badRequest().body(Map.of("error", "Select at least one course to generate a schedule."));
       }
       List<String> ScheduleCourseFileNames = GSLC.getMatchingScheduleFiles(request);
       System.out.println("Data Files: " + ScheduleCourseFileNames);
       if (ScheduleCourseFileNames.isEmpty()) {
           String term = request.getTerm() == null ? "the selected term" : request.getTerm();
           return ResponseEntity.badRequest().body(Map.of(
               "error",
               "No matching sections found for those courses in " + term + ". Try another term, another campus, or turn off seat limits."
           ));
       }
       String Data = CTFS.generateSchedules(ScheduleCourseFileNames, request);
       System.out.println("Output Data: " + Data);
       if (Data == null || Data.isBlank()) {
           return ResponseEntity.internalServerError().body(Map.of("error", "Schedule generation failed."));
       }
       try {
           return ResponseEntity.ok(new ObjectMapper().readTree(Data));
       } catch (Exception e) {
           return ResponseEntity.internalServerError().body(Map.of("error", "Schedule generation failed."));
       }
    }
}