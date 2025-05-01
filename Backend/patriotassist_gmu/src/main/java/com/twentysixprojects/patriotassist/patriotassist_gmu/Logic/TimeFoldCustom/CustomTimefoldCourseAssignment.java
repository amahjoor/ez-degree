package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;

@PlanningEntity
public class CustomTimefoldCourseAssignment {

    @PlanningId
    private Long id;

    private CustomTimefoldCourse course;

    @PlanningVariable(valueRangeProviderRefs = {"selectionRange"})
    private Boolean selected;

    private static long counter = 0;

    public CustomTimefoldCourseAssignment() {
        this.id = ++counter;
    }

    public Long getId() { return id; }
    
    public CustomTimefoldCourse getCourse() { return course; }
    public void setCourse(CustomTimefoldCourse course) { this.course = course; }
    
    public Boolean getSelected() { return selected; }
    public void setSelected(Boolean selected) { this.selected = selected; }
    
    @Override
    public String toString() {
        return "Assignment{" + course.toString() + ", selected=" + selected + "}";
    }
}
