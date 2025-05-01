// File: Schedule.java
package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

import java.util.List;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.ProblemFactProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

@PlanningSolution
public class Schedule {

    // List of planning entities (course assignments)
    @PlanningEntityCollectionProperty
    private List<CourseAssignment> courseAssignmentList;

    // Available selection values: true (selected) or false (not selected)
    @ValueRangeProvider(id = "selectionRange")
    private List<Boolean> selectionRange;

    // Credit limits wrapped in a problem fact
    @ProblemFactProperty
    private CreditLimits creditLimits;

    @PlanningScore
    private HardSoftScore score;

    public List<CourseAssignment> getCourseAssignmentList() {
        return courseAssignmentList;
    }
    public void setCourseAssignmentList(List<CourseAssignment> courseAssignmentList) {
        this.courseAssignmentList = courseAssignmentList;
    }

    public List<Boolean> getSelectionRange() {
        return selectionRange;
    }
    public void setSelectionRange(List<Boolean> selectionRange) {
        this.selectionRange = selectionRange;
    }

    public CreditLimits getCreditLimits() {
        return creditLimits;
    }
    public void setCreditLimits(CreditLimits creditLimits) {
        this.creditLimits = creditLimits;
    }

    public HardSoftScore getScore() {
        return score;
    }
    public void setScore(HardSoftScore score) {
        this.score = score;
    }

    @Override
    public String toString() {
        return "Schedule{" + courseAssignmentList.toString() + ", score=" + score + "}";
    }
}
