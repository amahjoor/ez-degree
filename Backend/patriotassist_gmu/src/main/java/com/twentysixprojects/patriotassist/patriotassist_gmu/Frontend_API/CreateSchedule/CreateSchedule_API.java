package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API.CreateSchedule;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.nio.file.*;
import java.io.IOException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogicCustom;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner.OptaPlanner;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold.TimefoldScheduler;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom.CustomTimefoldScheduler;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleCustomModel;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleModel;

@RestController
@RequestMapping("/api/create-schedule")
public class CreateSchedule_API {

    @Value("${project.data.path}")
    private String AllData_Path;

    @Autowired
    private com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.ScheduleTermCatalog scheduleTermCatalog;

    @Autowired
    private GenerateScheduleLogic GSL;

    @Autowired
    private GenerateScheduleLogicCustom GSLC;

    @Autowired
    private OptaPlanner OP;

    @Autowired
    private TimefoldScheduler TFS;

    @Autowired
    private CustomTimefoldScheduler CTFS;
    
    @GetMapping("/term-list")
    public List<String> getSupportedTermList() {
        return scheduleTermCatalog.listCatalogTerms();
    }

    @GetMapping("/degree-list")
    public List<String> getDegreeList() throws IOException {
        // Build the directory path using File.separator
        String degreeDir = AllData_Path + File.separator + "DegreeRequirements";
        List<String> AllDegrees = HelperClass.getFileNames(degreeDir);
        return AllDegrees;
    }
    
    @GetMapping("/degree-requirements")
    public String getDegreeRequirements(@RequestParam String input) throws IOException {
        // Build the file path using File.separator
        String filePath = AllData_Path + File.separator + "DegreeRequirements" + File.separator + input + ".json";
        return HelperClass.readJsonFile(filePath);
    }

    @PostMapping("/generate-schedule")
    public String generateSchedule(@RequestBody GenerateScheduleModel request) throws JsonProcessingException {
        // Example call to TimefoldScheduler (TFS)
        String Data = TFS.GenerateSchedules(request, 1, 10.0, 1.0, 5.0, 2.0);
        System.out.println("Data: " + Data);
        return Data;
    }

    @PostMapping("/generate-schedule-custom")
    public String generateScheduleCustom(@RequestBody GenerateScheduleCustomModel request) {
        //System.out.println("Data: " + request.getCourseCodes());
        List<String> ScheduleCourseFileNames = GSLC.getMatchingScheduleFiles(request);
        //System.out.println("Data Files: " + ScheduleCourseFileNames);
        String Data = CTFS.generateSchedules(ScheduleCourseFileNames, request);
        //System.out.println("Excluded Professors: " + request.getExcludedProfessors());

        return Data;
    }

    @PostMapping("/gs-custom-course-code-lookup")
    public List<String> generateScheduleCustom_CourseLookup(@RequestParam String PartialCourseCode) {
        return GSLC.generateScheduleCustomCourseLookup(PartialCourseCode);
    }

    @GetMapping("/gs-custom-course-professor")
    public String getCourseCodeProfessorData(@RequestParam String TermAndCourseCode)
    {
        System.out.println("Term and Course Code: " + TermAndCourseCode);
        String Data = GSLC.getCourseCodeProfessorData(TermAndCourseCode);
        //System.out.println(Data);
        return Data;
    }

    @GetMapping("/gs-custom-creditandcourse-amount")
    public String getCreditAndCoursesAmount(@RequestParam String TermAndCourseCode)
    {
        String Data = GSLC.getCreditAndCoursesAmount(TermAndCourseCode);
        //System.out.println(Data);
        return Data;
    }

    @PostMapping("/gs-custom-weights-generate-schedule")
    public String getCustomScheduleWithCustomWeights(@RequestBody GenerateScheduleCustomModel request)
    {
        List<String> ScheduleCourseFileNames = GSLC.getMatchingScheduleFiles(request);
        String Data = CTFS.generateSingleWeightedSchedule(ScheduleCourseFileNames, request);
        return Data;
    }
}

class HelperClass {
    public static List<String> getFileNames(String directoryPath) throws IOException {
        try (var stream = Files.list(Paths.get(directoryPath))) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString().replace(".json", ""))
                    .collect(Collectors.toList());
        }
    }

    public static String readJsonFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        return Files.readString(path);
    }
}
