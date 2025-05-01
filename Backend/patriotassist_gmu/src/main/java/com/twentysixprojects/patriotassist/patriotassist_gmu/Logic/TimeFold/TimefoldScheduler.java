package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleModel;
import java.io.File;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ai.timefold.solver.core.api.solver.Solver;
import ai.timefold.solver.core.api.solver.SolverFactory;
import ai.timefold.solver.core.config.solver.SolverConfig;
import java.time.Duration;

@Component
public class TimefoldScheduler {

    @Value("${project.data.path}")
    private String AllData_Path;

    @Autowired
    private GenerateScheduleLogic GSL;

    /**
     * Generates schedules using Timefold. In addition to scheduleData and numberOfSchedules,
     * the caller provides multipliers for:
     * - Credit limits (hard constraint)
     * - Professor rating reward (soft objective)
     * - Gap minimization (soft objective)
     * - Degree requirement violations (hard constraint)
     *
     * The output JSON includes only the selected course assignments for each schedule.
     * For each selected course, the professor rating and rating count (if available) are included.
     *
     * Returns the generated schedules as a JSON string.
     */
    public String GenerateSchedules(GenerateScheduleModel scheduleData, int numberOfSchedules,
                                    double creditMultiplier, double professorRatingMultiplier,
                                    double gapMultiplier, double degreeRequirementMultiplier) {
        try {
            // 1. Retrieve course file names via basic filtering.
            List<String> courseFileNames = GSL.ConstraintSatisfiedScheduledCourses(scheduleData);
            
            // 2. Load course data.
            List<TimefoldCourse> courseList = new ArrayList<>();
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            for (String fileName : courseFileNames) {
                File file = new File(AllData_Path + "\\ScheduleData\\" + scheduleData.getTerm() + "\\" + fileName);
                TimefoldCourse course = mapper.readValue(file, TimefoldCourse.class);
                course.parseMeetingTimes();
                courseList.add(course);
            }
            
            // 3. Load professor ratings.
            File rmpFile = new File(AllData_Path + "\\RMP\\RMPData_All.json");
            TimefoldProfessorRating[] ratingsArray = mapper.readValue(rmpFile, TimefoldProfessorRating[].class);
            Map<String, TimefoldProfessorRating> professorRatingMap = new HashMap<>();
            for (TimefoldProfessorRating pr : ratingsArray) {
                String normalizedName = normalizeInstructorName(pr.getName());
                professorRatingMap.put(normalizedName, pr);
            }
            
            // 4. Compute required course codes and labOnly mapping from degree requirements.
            String degreeReqFilePath = AllData_Path + "\\DegreeRequirements\\" + scheduleData.getSelectedDegree() + ".json";
            Set<String> requiredCourseCodes = DegreeRequirementUtil.calculateRequiredCourseCodes(degreeReqFilePath);
            Map<String, Boolean> labOnlyCourseMap = DegreeRequirementUtil.calculateLabOnlyCourseMap(degreeReqFilePath);
            
            // 5. Build the Timefold solver programmatically.
            TimefoldConstraintProvider customProvider = new TimefoldConstraintProvider();
            customProvider.setProfessorRatingMap(professorRatingMap);
            customProvider.setCreditMultiplier(creditMultiplier);
            customProvider.setProfessorRatingMultiplier(professorRatingMultiplier);
            customProvider.setGapMultiplier(gapMultiplier);
            customProvider.setDegreeRequirementMultiplier(degreeRequirementMultiplier);
            customProvider.setRequiredCourseCodes(requiredCourseCodes);
            customProvider.setLabOnlyCourseMap(labOnlyCourseMap);
            TimefoldConstraintProvider.setConfiguredInstance(customProvider);
            
            SolverConfig solverConfig = new SolverConfig()
                    .withSolutionClass(TimefoldSchedule.class)
                    .withEntityClasses(TimefoldCourseAssignment.class)
                    .withConstraintProviderClass(TimefoldConstraintProvider.class)
                    .withTerminationSpentLimit(Duration.ofSeconds(10));
            SolverFactory<TimefoldSchedule> solverFactory = SolverFactory.create(solverConfig);
            Solver<TimefoldSchedule> solver = solverFactory.buildSolver();

            // 6. Generate schedules.
            List<TimefoldSchedule> scheduleList = new ArrayList<>();
            // Initialize all course assignments as unselected (false) by default.
            for (int i = 0; i < numberOfSchedules; i++) {
                List<TimefoldCourseAssignment> assignmentList = new ArrayList<>();
                for (TimefoldCourse course : courseList) {
                    TimefoldCourseAssignment assignment = new TimefoldCourseAssignment();
                    assignment.setCourse(course);
                    assignment.setSelected(Boolean.FALSE);
                    assignmentList.add(assignment);
                }
                TimefoldSchedule schedule = new TimefoldSchedule();
                schedule.setCourseAssignmentList(assignmentList);
                schedule.setSelectionRange(List.of(Boolean.TRUE, Boolean.FALSE));
                TimefoldCreditLimits creditLimits = new TimefoldCreditLimits(scheduleData.getMinCredits(), scheduleData.getMaxCredits());
                schedule.setCreditLimits(creditLimits);
                
                TimefoldSchedule solvedSchedule = solver.solve(schedule);
                scheduleList.add(solvedSchedule);
            }
            
            // 7. Post-process schedules:
            //    - Remove non-selected assignments.
            //    - For each selected course, include professor rating and rating count (if available).
            List<TimefoldSchedule> processedScheduleList = new ArrayList<>();
            for (TimefoldSchedule schedule : scheduleList) {
                List<TimefoldCourseAssignment> selectedAssignments = schedule.getCourseAssignmentList()
                        .stream()
                        .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                        .map(a -> {
                            TimefoldCourse course = a.getCourse();
                            String normalizedName = normalizeInstructorName(course.getInstructor());
                            TimefoldProfessorRating rating = professorRatingMap.get(normalizedName);
                            // Assume TimefoldCourse has setters for professorRating and professorRatingCount
                            if (rating != null) {
                                course.setProfessorRating(rating.getQualityRating());
                                course.setProfessorRatingCount(rating.getRatingCount());
                            } else {
                                course.setProfessorRating(null);
                                course.setProfessorRatingCount(null);
                            }
                            return a;
                        })
                        .collect(Collectors.toList());
                schedule.setCourseAssignmentList(selectedAssignments);
                processedScheduleList.add(schedule);
            }
            
            String resultJson = mapper.writeValueAsString(processedScheduleList);
            return resultJson;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    // Utility: Normalize instructor names from formats like "Last, First (Primary)" to "First Last".
    private String normalizeInstructorName(String instructor) {
        if (instructor == null) return "";
        String namePart = instructor.split("\\(")[0].trim();
        if (namePart.contains(",")) {
            String[] parts = namePart.split(",");
            return parts[1].trim() + " " + parts[0].trim();
        }
        return namePart;
    }
}
