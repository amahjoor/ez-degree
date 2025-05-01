package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import java.util.List;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.ProblemFactProperty;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;

@PlanningSolution
public class TimefoldSchedule {

    @PlanningEntityCollectionProperty
    private List<TimefoldCourseAssignment> courseAssignmentList;

    @ValueRangeProvider(id = "selectionRange")
    private List<Boolean> selectionRange;

    @ProblemFactProperty
    private TimefoldCreditLimits creditLimits;

    @PlanningScore
    private HardSoftScore score;

    public List<TimefoldCourseAssignment> getCourseAssignmentList() {
        return courseAssignmentList;
    }
    public void setCourseAssignmentList(List<TimefoldCourseAssignment> courseAssignmentList) {
        this.courseAssignmentList = courseAssignmentList;
    }

    public List<Boolean> getSelectionRange() {
        return selectionRange;
    }
    public void setSelectionRange(List<Boolean> selectionRange) {
        this.selectionRange = selectionRange;
    }

    public TimefoldCreditLimits getCreditLimits() {
        return creditLimits;
    }
    public void setCreditLimits(TimefoldCreditLimits creditLimits) {
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
        return "TimefoldSchedule{" + courseAssignmentList.toString() + ", score=" + score + "}";
    }
}
