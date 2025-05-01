package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintCollectors;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;

import java.time.Duration;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

public class ScheduleConstraintProvider implements ConstraintProvider {

    // A map of normalized professor names to their ratings (injected during solver setup)
    private Map<String, ProfessorRating> professorRatingMap = new HashMap<>();

    public ScheduleConstraintProvider() {
        // The professorRatingMap will be empty unless set via the setter.
    }

    public ScheduleConstraintProvider(Map<String, ProfessorRating> professorRatingMap) {
        this.professorRatingMap = professorRatingMap;
    }
    
    public void setProfessorRatingMap(Map<String, ProfessorRating> professorRatingMap) {
        this.professorRatingMap = professorRatingMap;
    }

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
            creditLimitConstraint(factory),
            noTimeOverlapConstraint(factory),
            professorRatingReward(factory),
            gapMinimizationConstraint(factory),
            courseCountMinimizationConstraint(factory),
            maxCourseCountConstraint(factory),
            earlyStartPenalty(factory),
            lateFinishPenalty(factory)
        };
    }

    /**
     * Hard constraint: The sum of credit hours for all selected courses (regardless of type)
     * must be within the specified minimum and maximum credit limits.
     */
    private Constraint creditLimitConstraint(ConstraintFactory factory) {
        return factory.from(CourseAssignment.class)
            .filter(a -> Boolean.TRUE.equals(a.getSelected()))
            .groupBy(a -> 1, ConstraintCollectors.sum(a -> a.getCourse().getCreditHours()))
            .join(factory.from(CreditLimits.class))
            .penalize("Credit limits violation", HardSoftScore.ONE_HARD,
                (dummy, totalCredits, creditLimits) -> {
                    if (totalCredits < creditLimits.getMinCredits()) {
                        return (creditLimits.getMinCredits() - totalCredits); // Adjust multiplier if needed
                    } else if (totalCredits > creditLimits.getMaxCredits()) {
                        return (totalCredits - creditLimits.getMaxCredits());
                    }
                    return 0;
                });
    }

    /**
     * Hard constraint: Courses meeting on the same day must not have overlapping times.
     */
    private Constraint noTimeOverlapConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(CourseAssignment.class,
                Joiners.equal(a -> a.getCourse().getMeetingDays()))
                .filter((a1, a2) -> Boolean.TRUE.equals(a1.getSelected())
                        && Boolean.TRUE.equals(a2.getSelected())
                        && overlaps(a1.getCourse(), a2.getCourse()))
                .penalize("Time overlap", HardSoftScore.ONE_HARD, (a1, a2) -> 1);
    }

    private boolean overlaps(Course c1, Course c2) {
        if (c1.getStartTime() == null || c1.getEndTime() == null ||
            c2.getStartTime() == null || c2.getEndTime() == null) {
            return false;
        }
        return c1.getStartTime().isBefore(c2.getEndTime())
                && c2.getStartTime().isBefore(c1.getEndTime());
    }

    /**
     * Soft constraint: Reward selected courses taught by higher-rated professors.
     */
    private Constraint professorRatingReward(ConstraintFactory factory) {
        return factory.from(CourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected()))
                .reward("Professor rating reward", HardSoftScore.ONE_SOFT,
                        assignment -> {
                            Course course = assignment.getCourse();
                            String normalizedName = normalizeInstructorName(course.getInstructor());
                            ProfessorRating rating = professorRatingMap.get(normalizedName);
                            if (rating != null) {
                                return (int) (rating.getQualityRating() 
                                        * Math.log(rating.getRatingCount() + 1) * 10);
                            }
                            return 0;
                        });
    }

    /**
     * Soft constraint: Penalize gaps between courses on the same day.
     */
    private Constraint gapMinimizationConstraint(ConstraintFactory factory) {
        return factory.fromUniquePair(CourseAssignment.class,
                Joiners.equal(a -> a.getCourse().getMeetingDays()))
                .filter((a1, a2) -> Boolean.TRUE.equals(a1.getSelected())
                        && Boolean.TRUE.equals(a2.getSelected()))
                .penalize("Gap minimization", HardSoftScore.ONE_SOFT,
                        (a1, a2) -> {
                            Course c1 = a1.getCourse();
                            Course c2 = a2.getCourse();
                            if (c1.getStartTime() == null || c2.getStartTime() == null) {
                                return 0;
                            }
                            LocalTime firstEnd, secondStart;
                            if (c1.getStartTime().isBefore(c2.getStartTime())) {
                                firstEnd = c1.getEndTime();
                                secondStart = c2.getStartTime();
                            } else {
                                firstEnd = c2.getEndTime();
                                secondStart = c1.getStartTime();
                            }
                            long gapMinutes = Duration.between(firstEnd, secondStart).toMinutes();
                            return (int) Math.max(0, gapMinutes);
                        });
    }

    /**
     * Soft constraint: Penalize each selected "main" course to discourage overpacking.
     * Only courses with positive credit hours are considered "main" courses.
     */
    private Constraint courseCountMinimizationConstraint(ConstraintFactory factory) {
        return factory.from(CourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected())
                        && a.getCourse().getCreditHours() > 0)
                .penalize("Course count minimization", HardSoftScore.ONE_SOFT, assignment -> 5);
    }

    /**
     * Hard constraint: Limit the number of main courses selected.
     * For example, if max credits is 18 and a typical course is 3 credits,
     * then only 6 main courses should be allowed.
     */
    private Constraint maxCourseCountConstraint(ConstraintFactory factory) {
        return factory.from(CourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected())
                        && a.getCourse().getCreditHours() > 0)
                .groupBy(a -> 1, ConstraintCollectors.count())
                .join(factory.from(CreditLimits.class))
                .penalize("Max course count violation", HardSoftScore.ONE_HARD, (dummy, count, creditLimits) -> {
                    int typicalCourseCredit = 3; // Adjust if your courses have variable credit values.
                    int maxCourseCount = creditLimits.getMaxCredits() / typicalCourseCredit;
                    if (count > maxCourseCount) {
                        return (count - maxCourseCount) * 1000;
                    }
                    return 0;
                });
    }

    /**
     * Soft constraint: Penalize courses that start too early.
     * For example, starting before 9:00 AM.
     */
    private Constraint earlyStartPenalty(ConstraintFactory factory) {
        LocalTime desiredStart = LocalTime.of(9, 0);
        return factory.from(CourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected())
                        && a.getCourse().getStartTime() != null
                        && a.getCourse().getStartTime().isBefore(desiredStart))
                .penalize("Early start penalty", HardSoftScore.ONE_SOFT,
                        a -> (int) Duration.between(a.getCourse().getStartTime(), desiredStart).toMinutes());
    }

    /**
     * Soft constraint: Penalize courses that end too late.
     * For example, ending after 5:00 PM.
     */
    private Constraint lateFinishPenalty(ConstraintFactory factory) {
        LocalTime desiredEnd = LocalTime.of(17, 0);
        return factory.from(CourseAssignment.class)
                .filter(a -> Boolean.TRUE.equals(a.getSelected())
                        && a.getCourse().getEndTime() != null
                        && a.getCourse().getEndTime().isAfter(desiredEnd))
                .penalize("Late finish penalty", HardSoftScore.ONE_SOFT,
                        a -> (int) Duration.between(desiredEnd, a.getCourse().getEndTime()).toMinutes());
    }

    /**
     * Utility: Normalize instructor names from formats like
     * "Last, First (Primary)" to "First Last".
     */
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
