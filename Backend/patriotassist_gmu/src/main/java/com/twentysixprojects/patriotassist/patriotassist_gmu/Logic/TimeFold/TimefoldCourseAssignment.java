package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;

@PlanningEntity
public class TimefoldCourseAssignment {

    @PlanningId
    private Long id;

    private TimefoldCourse course;

    @PlanningVariable(valueRangeProviderRefs = {"selectionRange"})
    private Boolean selected;

    // Simple static counter to generate unique IDs.
    private static long counter = 0;

    public TimefoldCourseAssignment() {
        this.id = ++counter;
    }

    public Long getId() { return id; }
    
    public TimefoldCourse getCourse() { return course; }
    public void setCourse(TimefoldCourse course) { this.course = course; }
    
    public Boolean getSelected() { return selected; }
    public void setSelected(Boolean selected) { this.selected = selected; }
    
    @Override
    public String toString() {
        return "Assignment{" + course.toString() + ", selected=" + selected + "}";
    }
}
