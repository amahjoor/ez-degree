package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintCollectors;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;
import ai.timefold.solver.core.api.score.stream.Joiners;
import java.time.LocalTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

public class CustomTimefoldConstraintProvider implements ConstraintProvider {

    private static CustomTimefoldConstraintProvider configuredInstance;

    public static void setConfiguredInstance(CustomTimefoldConstraintProvider instance) {
        configuredInstance = instance;
    }

    private Map<String, CustomTimefoldProfessorRating> professorRatingMap;
    private double creditMultiplier = 1.0;
    private double professorRatingMultiplier = 1.0;
    private double gapMultiplier = 1.0;
    private double maxCreditRewardMultiplier = 1.0; // multiplier for credit maximization
    // labOnlyCourseMap comes from user input.
    private Map<String, Boolean> labOnlyCourseMap = new HashMap<>();

    // NEW FIELDS for soft preferences
    private boolean preferEarlier = true; // true: prefer early classes; false: prefer late
    private boolean minimizeDaysOnCampus = false;
    // NEW multipliers for additional soft preferences
    private double timePreferenceMultiplier = 1.0;
    private double minDaysOnCampusMultiplier = 1.0;

    // Global debug flag
    private static final boolean DEBUG = false;

    public CustomTimefoldConstraintProvider() {
        if (configuredInstance != null) {
            this.professorRatingMap = configuredInstance.professorRatingMap;
            this.creditMultiplier = configuredInstance.creditMultiplier;
            this.professorRatingMultiplier = configuredInstance.professorRatingMultiplier;
            this.gapMultiplier = configuredInstance.gapMultiplier;
            this.maxCreditRewardMultiplier = configuredInstance.maxCreditRewardMultiplier;
            this.labOnlyCourseMap = configuredInstance.labOnlyCourseMap;
            this.preferEarlier = configuredInstance.preferEarlier;
            this.minimizeDaysOnCampus = configuredInstance.minimizeDaysOnCampus;
            this.timePreferenceMultiplier = configuredInstance.timePreferenceMultiplier;
            this.minDaysOnCampusMultiplier = configuredInstance.minDaysOnCampusMultiplier;
        }
    }

    public void setProfessorRatingMap(Map<String, CustomTimefoldProfessorRating> professorRatingMap) {
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

    public void setMaxCreditRewardMultiplier(double maxCreditRewardMultiplier) {
        this.maxCreditRewardMultiplier = maxCreditRewardMultiplier;
    }

    public void setLabOnlyCourseMap(Map<String, Boolean> labOnlyCourseMap) {
        this.labOnlyCourseMap = labOnlyCourseMap;
    }
    
    // Setter for time preference multiplier: if preferEarlier is false then override multiplier to 0.
    public void setTimePreferenceMultiplier(double timePreferenceMultiplier) {
        this.timePreferenceMultiplier = preferEarlier ? timePreferenceMultiplier : 0;
    }
    
    // Setter for minimize days on campus multiplier: if minimizeDaysOnCampus is false then override multiplier to 0.
    public void setMinDaysOnCampusMultiplier(double minDaysOnCampusMultiplier) {
        this.minDaysOnCampusMultiplier = minimizeDaysOnCampus ? minDaysOnCampusMultiplier : 0;
    }
    
    // Setter for preferEarlier.
    public void setPreferEarlier(boolean preferEarlier) {
        this.preferEarlier = preferEarlier;
    }
    
    // Setter for minimizeDaysOnCampus.
    public void setMinimizeDaysOnCampus(boolean minimizeDaysOnCampus) {
        this.minimizeDaysOnCampus = minimizeDaysOnCampus;
    }
    
    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
            creditLimitConstraint(factory),
            creditMinimumConstraint(factory),  
            creditMaximizationReward(factory),
            noTimeOverlapConstraint(factory),
            professorRatingReward(factory),
            gapMinimizationConstraint(factory),
            timePreferenceReward(factory),
            minimizeDaysOnCampusReward(factory),
            labLecturePairingConstraint(factory),
            uniqueLectureSelectionConstraint(factory),
            uniqueLabSelectionConstraint(factory)
        };
    }
    
    // HARD: total selected credits must not exceed maximum.
    private Constraint creditLimitConstraint(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .groupBy(a -> 1, ConstraintCollectors.sum(a -> a.getCourse().getCreditHours()))
            .join(factory.from(CustomTimefoldCreditLimits.class))
            .penalize("Max credit violation", HardSoftScore.ONE_HARD,
                (dummy, totalCredits, creditLimits) -> totalCredits > creditLimits.getMaxCredits() ? 1000000 : 0);
    }

    // HARD: total selected credits must not be below the minimum.
    private Constraint creditMinimumConstraint(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .groupBy(a -> 1, ConstraintCollectors.sum(a -> a.getCourse().getCreditHours()))
            .join(factory.from(CustomTimefoldCreditLimits.class))
            .penalize("Min credit violation", HardSoftScore.ONE_HARD,
                (dummy, totalCredits, creditLimits) -> totalCredits < creditLimits.getMinCredits() ? 1000000 : 0);
    }

    
    // Soft objective: reward schedules that pack more credits.
    private Constraint creditMaximizationReward(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .groupBy(a -> 1, ConstraintCollectors.sum(a -> a.getCourse().getCreditHours()))
            .reward("Credit maximization", HardSoftScore.ONE_SOFT,
                (dummy, totalCredits) -> (int)(totalCredits * maxCreditRewardMultiplier));
    }
    
    private Constraint noTimeOverlapConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(CustomTimefoldCourseAssignment.class)
                .filter((a1, a2) -> {
                    if (!Boolean.TRUE.equals(a1.getSelected()) || !Boolean.TRUE.equals(a2.getSelected())) {
                        return false;
                    }
                    if (a1.getCourse().getCRN() != null && a1.getCourse().getCRN().equals(a2.getCourse().getCRN())) {
                        return false;
                    }
                    Set<String> days1 = parseMeetingDays(a1.getCourse().getMeetingDays());
                    Set<String> days2 = parseMeetingDays(a2.getCourse().getMeetingDays());
                    Set<String> intersection = new HashSet<>(days1);
                    intersection.retainAll(days2);
                    if (intersection.isEmpty()) {
                        return false;
                    }
                    boolean overlap = overlaps(a1.getCourse(), a2.getCourse());
                    if (DEBUG && overlap) {
                        System.out.println("DEBUG: Overlap detected:");
                        System.out.println("  Course 1: " + a1.getCourse().getCourseTitle() +
                                " | Days: " + days1 +
                                " | Times: " + a1.getCourse().getMeetingTimes());
                        System.out.println("  Course 2: " + a2.getCourse().getCourseTitle() +
                                " | Days: " + days2 +
                                " | Times: " + a2.getCourse().getMeetingTimes());
                        System.out.println("  Intersection: " + intersection);
                    }
                    return overlap;
                })
                .penalize("Time overlap", HardSoftScore.ONE_HARD, (a1, a2) -> 1000000);
    }
    
    // UPDATED: parseMeetingDays method
    private Set<String> parseMeetingDays(String meetingDays) {
        Set<String> days = new HashSet<>();
        if (meetingDays == null || meetingDays.trim().isEmpty()) {
            if (DEBUG) {
                System.out.println("DEBUG: Empty meeting days received.");
            }
            return days;
        }
        String originalInput = meetingDays;
        // If the input contains commas, split by comma.
        if (meetingDays.contains(",")) {
            String[] parts = meetingDays.split(",");
            for (String part : parts) {
                String day = part.trim();
                if (DEBUG) {
                    System.out.println("DEBUG: Parsing day: " + day);
                }
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
            // Otherwise, treat the entire string as a single day.
            String day = meetingDays.trim();
            if (DEBUG) {
                System.out.println("DEBUG: Parsing single day: " + day);
            }
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
        if (DEBUG) {
            System.out.println("DEBUG: Final parsed days: " + days + " from input: " + originalInput);
        }
        return days;
    }
    
    private boolean overlaps(CustomTimefoldCourse c1, CustomTimefoldCourse c2) {
        if (c1.getStartTime() == null || c1.getEndTime() == null ||
            c2.getStartTime() == null || c2.getEndTime() == null) {
            return false;
        }
        return c1.getStartTime().isBefore(c2.getEndTime()) &&
               c2.getStartTime().isBefore(c1.getEndTime());
    }
    
    private Constraint professorRatingReward(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .reward("Professor rating reward", HardSoftScore.ONE_SOFT,
                        assignment -> {
                            CustomTimefoldCourse course = assignment.getCourse();
                            String normalizedName = normalizeInstructorName(course.getInstructor());
                            CustomTimefoldProfessorRating rating = professorRatingMap.get(normalizedName);
                            int reward = 0;
                            if (rating != null) {
                                reward = (int)(rating.getQualityRating() * Math.log(rating.getRatingCount() + 1) * 10 * professorRatingMultiplier);
                            }
                            return reward;
                        });
    }
    
    // If minimizeGap is off then gapMultiplier is zero (set externally per variant).
    private Constraint gapMinimizationConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(CustomTimefoldCourseAssignment.class,
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
                                CustomTimefoldCourse c1 = a1.getCourse();
                                CustomTimefoldCourse c2 = a2.getCourse();
                                if (c1.getStartTime() == null || c2.getStartTime() == null) {
                                    return 0;
                                }
                                return (int)(Math.max(0, Duration.between(c1.getEndTime(), c2.getStartTime()).toMinutes() * gapMultiplier));
                            } catch (Exception e) {
                                return 0;
                            }
                        });
    }
    
    // NEW: Time preference constraint.
    // Rewards assignments with earlier start times if preferEarlier is true,
    // or later start times if preferEarlier is false.
    private Constraint timePreferenceReward(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .reward("Time preference reward", HardSoftScore.ONE_SOFT, assignment -> {
                CustomTimefoldCourse course = assignment.getCourse();
                if (course.getStartTime() == null) return 0;
                int startMinutes = course.getStartTime().getHour() * 60 + course.getStartTime().getMinute();
                int pivot = 720; // 12:00 PM pivot
                int baseReward;
                if (preferEarlier) {
                    baseReward = Math.max(0, pivot - startMinutes);
                } else {
                    baseReward = Math.max(0, startMinutes - pivot);
                }
                return (int)(baseReward * timePreferenceMultiplier);
            });
    }
    
    // NEW: Minimize days on campus.
    // Rewards a schedule that uses fewer distinct meeting days.
    private Constraint minimizeDaysOnCampusReward(ConstraintFactory factory) {
        if (!minimizeDaysOnCampus) {
            return factory.from(CustomTimefoldCourseAssignment.class)
                          .filter(a -> false)
                          .reward("Minimize days on campus (inactive)", HardSoftScore.ONE_SOFT, a -> 0);
        }
        return factory.from(CustomTimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .groupBy(a -> 1, ConstraintCollectors.toList())
                .reward("Minimize days on campus", HardSoftScore.ONE_SOFT,
                    (dummy, assignmentList) -> {
                        Set<String> allDays = new HashSet<>();
                        for (CustomTimefoldCourseAssignment assignment : assignmentList) {
                            allDays.addAll(parseMeetingDays(assignment.getCourse().getMeetingDays()));
                        }
                        int baseReward = Math.max(0, (5 - allDays.size())) * 100;
                        return (int)(baseReward * minDaysOnCampusMultiplier);
                    });
    }
    
    /**
     * Revised lab/lecture pairing constraint.
     * For a given course group (by normalized course code):
     * - If the user-provided labOnly flag is true, then if any assignment is selected, exactly one must be selected and it must be Laboratory.
     * - If the user-provided labOnly flag is false:
     *      • If both Lecture and Laboratory sections are available, then if any assignment is selected, exactly two must be selected.
     *      • Otherwise, if only one type is available, then exactly one must be selected.
     * If no assignments are selected for the course, no penalty is applied.
     */
    private static final Set<String> loggedPairingViolations = new HashSet<>();

    private Constraint labLecturePairingConstraint(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
                .filter(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()) ||
                             "Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()))
                .groupBy(a -> normalizeCourseCode(a.getCourse()), ConstraintCollectors.toList())
                .filter((normalizedCode, assignmentList) -> {
                    Boolean userLabOnly = labOnlyCourseMap.get(normalizedCode);
                    if (userLabOnly == null) {
                        userLabOnly = false;
                    }
                    List<CustomTimefoldCourseAssignment> selected = assignmentList.stream()
                            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                            .collect(Collectors.toList());
                    if (selected.isEmpty()) {
                        return false;
                    }
                    boolean hasLectureAvailable = assignmentList.stream()
                            .anyMatch(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()));
                    boolean hasLabAvailable = assignmentList.stream()
                            .anyMatch(a -> "Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()));
                    
                    boolean violation = false;
                    if (userLabOnly) {
                        violation = selected.size() != 1 || !"Laboratory".equalsIgnoreCase(selected.get(0).getCourse().getScheduleType());
                    } else {
                        if (hasLectureAvailable && hasLabAvailable) {
                            violation = selected.size() != 2;
                        } else {
                            violation = selected.size() != 1;
                        }
                    }
                    if (violation && !loggedPairingViolations.contains(normalizedCode)) {
                        System.out.println("DEBUG: Pairing violation for group " + normalizedCode +
                                ". Selected types: " + selected.stream().map(a -> a.getCourse().getScheduleType()).collect(Collectors.toList()));
                        loggedPairingViolations.add(normalizedCode);
                    }
                    return violation;
                })
                .penalize("Lab-Lecture pairing violation", HardSoftScore.ONE_HARD,
                        (normalizedCode, assignmentList) -> 1000000);
    }
    
    // Constraint to ensure that at most one Lecture is selected per course group.
    private Constraint uniqueLectureSelectionConstraint(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .filter(a -> "Lecture".equalsIgnoreCase(a.getCourse().getScheduleType()))
                .groupBy(a -> normalizeCourseCode(a.getCourse()), ConstraintCollectors.count())
                .filter((normalizedCode, count) -> count > 1)
                .penalize("Duplicate lecture selection", HardSoftScore.ONE_HARD,
                          (normalizedCode, count) -> (count - 1) * 1000000);
    }
    
    // Constraint to ensure that at most one Laboratory is selected per course group.
    private Constraint uniqueLabSelectionConstraint(ConstraintFactory factory) {
        return factory.from(CustomTimefoldCourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .filter(a -> "Laboratory".equalsIgnoreCase(a.getCourse().getScheduleType()))
                .groupBy(a -> normalizeCourseCode(a.getCourse()), ConstraintCollectors.count())
                .filter((normalizedCode, count) -> count > 1)
                .penalize("Duplicate lab selection", HardSoftScore.ONE_HARD,
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
    
    private String normalizeCourseCode(CustomTimefoldCourse course) {
        String subject = course.getCourseSubject().trim();
        String abbreviatedSubject = convertSubjectToAbbreviation(subject);
        String number = course.getCourseNumber().trim();
        return abbreviatedSubject + " " + number;
    }
    
    /**
     * Converts the full subject name to its abbreviation using the custom mapping.
     * Throws an exception if the abbreviation is not found.
     */
    private String convertSubjectToAbbreviation(String subject) {
        return CustomCourseAbbrUtil.getCourseAbbr(subject);
    }
}
