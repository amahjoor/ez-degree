package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintCollectors;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;
import ai.timefold.solver.core.api.score.stream.Joiners;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.List;

import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseAbbr.GetCourseAbbr;
import org.springframework.stereotype.Component;

@Component
public class TimefoldConstraintProvider implements ConstraintProvider {

    private static TimefoldConstraintProvider configuredInstance;

    public static void setConfiguredInstance(TimefoldConstraintProvider instance) {
        configuredInstance = instance;
    }

    private Map<String, TimefoldProfessorRating> professorRatingMap;
    private double creditMultiplier = 1.0;
    private double professorRatingMultiplier = 1.0;
    private double gapMultiplier = 1.0;
    private double degreeRequirementMultiplier = 1000000.0;
    private Set<String> requiredCourseCodes = new HashSet<>();
    private Map<String, Boolean> labOnlyCourseMap = new HashMap<>();

    public TimefoldConstraintProvider() {
        if (configuredInstance != null) {
            this.professorRatingMap = configuredInstance.professorRatingMap;
            this.creditMultiplier = configuredInstance.creditMultiplier;
            this.professorRatingMultiplier = configuredInstance.professorRatingMultiplier;
            this.gapMultiplier = configuredInstance.gapMultiplier;
            this.degreeRequirementMultiplier = configuredInstance.degreeRequirementMultiplier;
            this.requiredCourseCodes = configuredInstance.requiredCourseCodes;
            this.labOnlyCourseMap = configuredInstance.labOnlyCourseMap;
        }
    }

    public TimefoldConstraintProvider(Map<String, TimefoldProfessorRating> professorRatingMap) {
        this.professorRatingMap = professorRatingMap;
    }

    public void setProfessorRatingMap(Map<String, TimefoldProfessorRating> professorRatingMap) {
        this.professorRatingMap = professorRatingMap;
    }

    public void setCreditMultiplier(double creditMultiplier) {
        this.creditMultiplier = creditMultiplier;
    }

    public void setProfessorRatingMultiplier(double professorRatingMultiplier) {
        this.professorRatingMultiplier = professorRatingMultiplier;
    }

    public void setGapMultiplier(double gapMultiplier) {
        this.gapMultiplier = gapMultiplier;
    }

    public void setDegreeRequirementMultiplier(double degreeRequirementMultiplier) {
        this.degreeRequirementMultiplier = degreeRequirementMultiplier;
    }

    public void setRequiredCourseCodes(Set<String> requiredCourseCodes) {
        this.requiredCourseCodes = requiredCourseCodes;
    }
    
    public void setLabOnlyCourseMap(Map<String, Boolean> labOnlyCourseMap) {
        this.labOnlyCourseMap = labOnlyCourseMap;
    }
    
    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
            creditLimitConstraint(factory),
            noTimeOverlapConstraint(factory),
            degreeRequirementConstraint(factory),
            professorRatingReward(factory),
            gapMinimizationConstraint(factory),
            labLecturePairingConstraint(factory),
            uniqueLectureSelectionConstraint(factory)
        };
    }
    
    // Hard constraint: total credits must be within min and max.
    private Constraint creditLimitConstraint(ConstraintFactory factory) {
        return factory.from(TimefoldCourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .groupBy(a -> 1, ConstraintCollectors.sum(a -> a.getCourse().getCreditHours()))
            .join(factory.from(TimefoldCreditLimits.class))
            .penalize("Credit limits violation", HardSoftScore.ONE_HARD,
                (dummy, totalCredits, creditLimits) -> {
                    if (totalCredits < creditLimits.getMinCredits() || totalCredits > creditLimits.getMaxCredits()) {
                        System.out.println("DEBUG: Credit violation: totalCredits=" + totalCredits +
                            ", limits=(" + creditLimits.getMinCredits() + "," + creditLimits.getMaxCredits() + ")");
                        return 1000000;
                    }
                    return 0;
                });
    }
    
    // Revised constraint: courses must not overlap.
    private Constraint noTimeOverlapConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(TimefoldCourseAssignment.class)
                .filter((a1, a2) -> {
                    if (!Boolean.TRUE.equals(a1.getSelected()) || !Boolean.TRUE.equals(a2.getSelected())) {
                        return false;
                    }
                    // Skip if same CRN (same course instance)
                    if (a1.getCourse().getCRN() != null && a1.getCourse().getCRN().equals(a2.getCourse().getCRN())) {
                        return false;
                    }
                    // Parse meeting days into standardized sets.
                    Set<String> days1 = parseMeetingDays(a1.getCourse().getMeetingDays());
                    Set<String> days2 = parseMeetingDays(a2.getCourse().getMeetingDays());
                    days1.retainAll(days2);
                    if (days1.isEmpty()) {
                        return false;
                    }
                    return overlaps(a1.getCourse(), a2.getCourse());
                })
                .penalize("Time overlap", HardSoftScore.ONE_HARD, (a1, a2) -> 1000000);
    }
    
    // Helper: Parse the MeetingDays string into a set of standardized day abbreviations.
    private Set<String> parseMeetingDays(String meetingDays) {
        Set<String> days = new HashSet<>();
        if (meetingDays == null || meetingDays.trim().isEmpty()) {
            return days;
        }
        if (meetingDays.contains(",")) {
            String[] parts = meetingDays.split(",");
            for (String part : parts) {
                String day = part.trim();
                switch(day.toLowerCase()) {
                    case "monday": days.add("M"); break;
                    case "tuesday": days.add("T"); break;
                    case "wednesday": days.add("W"); break;
                    case "thursday": days.add("Th"); break;
                    case "friday": days.add("F"); break;
                    case "saturday": days.add("Sa"); break;
                    case "sunday": days.add("Su"); break;
                    default: days.add(day); break;
                }
            }
        } else {
            if (meetingDays.contains("Th")) {
                days.add("Th");
                meetingDays = meetingDays.replace("Th", "");
            }
            for (char ch : meetingDays.toCharArray()) {
                String d = String.valueOf(ch).trim();
                if (!d.isEmpty()) {
                    days.add(d);
                }
            }
        }
        return days;
    }
    
    private boolean overlaps(TimefoldCourse c1, TimefoldCourse c2) {
        if (c1.getStartTime() == null || c1.getEndTime() == null ||
            c2.getStartTime() == null || c2.getEndTime() == null) {
            return false;
        }
        return c1.getStartTime().isBefore(c2.getEndTime()) &&
               c2.getStartTime().isBefore(c1.getEndTime());
    }
    
    // Hard constraint: only courses that contribute to degree requirements are allowed.
    private Constraint degreeRequirementConstraint(ConstraintFactory factory) {
        return factory.from(TimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .filter(a -> {
                    String courseCode = normalizeCourseCode(a.getCourse());
                    return !requiredCourseCodes.contains(courseCode);
                })
                .penalize("Degree requirement violation", HardSoftScore.ONE_HARD,
                        assignment -> (int) degreeRequirementMultiplier);
    }
    
    // Soft objective: reward higher-rated professors.
    private Constraint professorRatingReward(ConstraintFactory factory) {
        return factory.from(TimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .reward("Professor rating reward", HardSoftScore.ONE_SOFT,
                        assignment -> {
                            TimefoldCourse course = assignment.getCourse();
                            String normalizedName = normalizeInstructorName(course.getInstructor());
                            TimefoldProfessorRating rating = professorRatingMap.get(normalizedName);
                            int reward = 0;
                            if (rating != null) {
                                reward = (int)(rating.getQualityRating() * Math.log(rating.getRatingCount() + 1) * 10 * professorRatingMultiplier);
                            }
                            return reward;
                        });
    }
    
    // Soft objective: minimize gaps between courses.
    private Constraint gapMinimizationConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(TimefoldCourseAssignment.class,
                Joiners.equal(a -> a.getCourse().getMeetingDays()))
                .filter((a1, a2) -> {
                    if (!Boolean.TRUE.equals(a1.getSelected()) || !Boolean.TRUE.equals(a2.getSelected())) {
                        return false;
                    }
                    if (a1.getCourse().getCRN() != null && a1.getCourse().getCRN().equals(a2.getCourse().getCRN())) {
                        return false;
                    }
                    return true;
                })
                .penalize("Gap minimization", HardSoftScore.ONE_SOFT,
                        (a1, a2) -> {
                            try {
                                TimefoldCourse c1 = a1.getCourse();
                                TimefoldCourse c2 = a2.getCourse();
                                if (c1.getStartTime() == null || c2.getStartTime() == null) {
                                    return 0;
                                }
                                return (int)(Math.max(0, java.time.Duration.between(
                                    c1.getEndTime(), c2.getStartTime()).toMinutes() * gapMultiplier));
                            } catch (Exception e) {
                                return 0;
                            }
                        });
    }
    
    /**
     * Unified Constraint: For courses that offer both Lecture and Laboratory, enforce proper pairing.
     * - If LabOnly flag is true for the course, exactly one assignment must be selected and it must be Laboratory.
     * - Otherwise, exactly two assignments must be selected (one Lecture and one Laboratory).
     */
    private Constraint labLecturePairingConstraint(ConstraintFactory factory) {
        return factory.from(TimefoldCourseAssignment.class)
                .filter(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()) ||
                             "Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()))
                .groupBy(a -> normalizeCourseCode(a.getCourse()), ConstraintCollectors.toList())
                .filter((normalizedCode, assignmentList) -> {
                    // Only consider courses that offer both types.
                    boolean offersBoth = assignmentList.stream().anyMatch(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()))
                            && assignmentList.stream().anyMatch(a -> "Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()));
                    if (!offersBoth) {
                        return false;
                    }
                    Boolean labOnly = labOnlyCourseMap.get(normalizedCode);
                    long selectedCount = assignmentList.stream().filter(a -> Boolean.TRUE.equals(a.getSelected())).count();
                    if (labOnly != null && labOnly) {
                        // For LabOnly courses, valid only if exactly one is selected and it is Laboratory.
                        if (selectedCount != 1) {
                            return true; // Violation: count is not exactly 1.
                        }
                        return assignmentList.stream()
                            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                            .anyMatch(a -> !"Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()));
                    } else {
                        // For full courses, valid only if exactly two are selected.
                        return selectedCount != 2;
                    }
                })
                .penalize("Lab-Lecture pairing violation", HardSoftScore.ONE_HARD,
                           (normalizedCode, assignmentList) -> 1000000);
    }
    
    // Constraint: For lecture-only courses, ensure that at most one section is selected.
    private Constraint uniqueLectureSelectionConstraint(ConstraintFactory factory) {
        return factory.from(TimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .filter(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()))
                .groupBy(a -> normalizeCourseCode(a.getCourse()), ConstraintCollectors.count())
                .filter((normalizedCode, count) -> count > 1)
                .penalize("Duplicate lecture selection", HardSoftScore.ONE_HARD,
                          (normalizedCode, count) -> (count - 1) * 1000000);
    }
    
    private String normalizeInstructorName(String instructor) {
        if (instructor == null) return "";
        String namePart = instructor.split("\\(")[0].trim();
        if (namePart.contains(",")) {
            String[] parts = namePart.split(",");
            return parts[1].trim() + " " + parts[0].trim();
        }
        return namePart;
    }
    
    private String normalizeCourseCode(TimefoldCourse course) {
        String subject = course.getCourseSubject().trim();
        String abbreviatedSubject = convertSubjectToAbbreviation(subject);
        String number = course.getCourseNumber().trim();
        return abbreviatedSubject + " " + number;
    }
    
    /**
     * Uses the GetCourseAbbr bean to convert the subject's full name into its abbreviation.
     */
    private String convertSubjectToAbbreviation(String subject) {
        String abbreviation = GetCourseAbbr.getCourseAbbr(subject);
        return abbreviation != null ? abbreviation : subject.toUpperCase();
    }
}
