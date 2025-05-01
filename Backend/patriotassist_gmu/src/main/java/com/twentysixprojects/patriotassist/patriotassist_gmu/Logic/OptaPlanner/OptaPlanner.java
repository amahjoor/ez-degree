package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.GenerateScheduleModel;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class OptaPlanner {

    @Value("${project.data.path}")
    private String AllData_Path;

    @Autowired
    private GenerateScheduleLogic GSL;

    /**
     * Generates a list of schedules based on the given scheduleData and numberOfSchedules.
     * It builds and solves the planning problem multiple times to produce diverse schedules.
     */
    public String GenerateSchedules(GenerateScheduleModel scheduleData, int numberOfSchedules) {
        try {
            // 1. Retrieve pre-filtered course file names.
            List<String> courseFileNames = GSL.ConstraintSatisfiedScheduledCourses(scheduleData);
            //System.out.println("Available Courses: " + courseFileNames);
            
            // 2. Load course data from JSON files.
            List<Course> courseList = new ArrayList<>();
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            for (String fileName : courseFileNames) {
                File file = new File(AllData_Path + "\\ScheduleData\\" + scheduleData.getTerm() + "\\" + fileName);
                Course course = mapper.readValue(file, Course.class);
                course.parseMeetingTimes();
                courseList.add(course);
            }
            
            // 3. Load professor ratings from RMPData_All.json.
            File rmpFile = new File(AllData_Path + "\\RMP\\RMPData_All.json");
            ProfessorRating[] ratingsArray = mapper.readValue(rmpFile, ProfessorRating[].class);
            Map<String, ProfessorRating> professorRatingMap = new HashMap<>();
            for (ProfessorRating pr : ratingsArray) {
                String normalizedName = normalizeInstructorName(pr.getName());
                professorRatingMap.put(normalizedName, pr);
            }
            
            // 4. Prepare the solver.
            SolverFactory<Schedule> solverFactory = SolverFactory.createFromXmlResource("solverConfig.xml");
            Solver<Schedule> solver = solverFactory.buildSolver();
            
            // 5. Generate a list of schedules.
            List<Schedule> scheduleList = new ArrayList<>();
            Random random = new Random();
            
            for (int i = 0; i < numberOfSchedules; i++) {
                // 5a. Create a CourseAssignment for each course (default: not selected).
                List<CourseAssignment> assignmentList = new ArrayList<>();
                for (Course course : courseList) {
                    CourseAssignment assignment = new CourseAssignment();
                    assignment.setCourse(course);
                    // Randomize initial selection to help explore different solutions.
                    assignment.setSelected(random.nextBoolean());
                    assignmentList.add(assignment);
                }
                
                // 5b. Build the planning solution.
                Schedule schedule = new Schedule();
                schedule.setCourseAssignmentList(assignmentList);
                schedule.setSelectionRange(List.of(Boolean.TRUE, Boolean.FALSE));
                CreditLimits creditLimits = new CreditLimits(scheduleData.getMinCredits(), scheduleData.getMaxCredits());
                schedule.setCreditLimits(creditLimits);
                
                // 5c. (Optional) If needed, update the constraint provider with the professor rating map.
                // This assumes your solver configuration picks up a ScheduleConstraintProvider instance.
                // For example:
                // ((ScheduleConstraintProvider)solverFactory.getScoreDirectorFactory().getConstraintProvider())
                //         .setProfessorRatingMap(professorRatingMap);
                
                // 5d. Solve the scheduling problem.
                Schedule solvedSchedule = solver.solve(schedule);
                scheduleList.add(solvedSchedule);
            }
            
            // 6. Return the list of generated schedules as JSON.
            String resultJson = mapper.writeValueAsString(scheduleList);
            return resultJson;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    // Utility: Normalize instructor names from "Last, First (Primary)" to "First Last"
    private String normalizeInstructorName(String instructor) {
        if (instructor == null) {
            return "";
        }
        String namePart = instructor.split("\\(")[0].trim();
        if (namePart.contains(",")) {
            String[] parts = namePart.split(",");
            return parts[1].trim() + " " + parts[0].trim();
        }
        return namePart;
    }
}
