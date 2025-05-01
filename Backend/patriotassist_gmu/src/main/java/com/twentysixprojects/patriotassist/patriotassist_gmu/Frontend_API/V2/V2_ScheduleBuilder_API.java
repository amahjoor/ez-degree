package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API.V2;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogicCustom;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.V2_ScheduleBuilderLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom.CustomTimefoldScheduler;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleCustomModel;

@RestController
@RequestMapping("/api/v2/schedule-builder")
public class V2_ScheduleBuilder_API
{
    @Value("${supported.terms}")
    private String SupportedTerms;

    @Autowired
    private V2_ScheduleBuilderLogic V2_SBL;

    @Autowired
    private GenerateScheduleLogicCustom GSLC;

    @Autowired
    private CustomTimefoldScheduler CTFS;

    @GetMapping("/term-list")
    public List<String> getSupportedTermList() {
        String[] parts = SupportedTerms.split(",");
        List<String> SupportedTermList = new ArrayList<>(Arrays.asList(parts));
        System.out.println("Supported Term List: " + SupportedTermList);
        return SupportedTermList;
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
    public String generateCustomSchedule(@RequestBody GenerateScheduleCustomModel request)
    {
       System.out.println("Raw Request Data: " + request.toString());
       System.out.println("Data: " + request.getCourseCodes());
       List<String> ScheduleCourseFileNames = GSLC.getMatchingScheduleFiles(request);
       System.out.println("Data Files: " + ScheduleCourseFileNames);
       String Data = CTFS.generateSchedules(ScheduleCourseFileNames, request);
       System.out.println("Output Data: " + Data);

       return Data;
    }
}