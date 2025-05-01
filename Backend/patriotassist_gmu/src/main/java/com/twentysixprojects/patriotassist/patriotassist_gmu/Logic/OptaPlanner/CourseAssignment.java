// File: CourseAssignment.java
package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

@PlanningEntity
public class CourseAssignment {
    
    @PlanningId
    private Long id;
    
    private Course course;
    
    // Planning variable: whether the course is selected for the schedule.
    // A simple Boolean is used with a value range of {true, false}.
    @PlanningVariable(valueRangeProviderRefs = {"selectionRange"})
    private Boolean selected;
    
    // Static counter to generate unique IDs (ensure thread safety in production if needed)
    private static long counter = 0;
    
    public CourseAssignment() {
        // Auto-generate a unique ID upon instantiation.
        this.id = ++counter;
    }
    
    public Long getId() {
        return id;
    }
    
    public Course getCourse() {
        return course;
    }
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public Boolean getSelected() {
        return selected;
    }
    public void setSelected(Boolean selected) {
        this.selected = selected;
    }
    
    @Override
    public String toString() {
        return "Assignment{" + course.toString() + ", selected=" + selected + "}";
    }
}
