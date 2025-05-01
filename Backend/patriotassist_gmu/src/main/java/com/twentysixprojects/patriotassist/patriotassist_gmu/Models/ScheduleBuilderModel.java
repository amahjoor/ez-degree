package com.twentysixprojects.patriotassist.patriotassist_gmu.Models;

import java.util.List;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.annotation.JsonProperty;

@Component
public class ScheduleBuilderModel {

    @JsonProperty("SortByRMPFilter")
    private boolean SortByRMPFilter; // 3

    @JsonProperty("SortByMinimizeGapFilter")
    private boolean SortByMinimizeGapFilter; // 3

    @JsonProperty("LocationsFilter")
    private List<String> LocationsFilter; // 2

    @JsonProperty("CourseCode")
    private String CourseCode; // 1 

    @JsonProperty("Term")
    private String Term;

    public boolean isSortByRMPFilter() {
        return SortByRMPFilter;
    }

    public void setSortByRMPFilter(boolean sortByRMPFilter) {
        SortByRMPFilter = sortByRMPFilter;
    }

    public boolean isSortByMinimizeGapFilter() {
        return SortByMinimizeGapFilter;
    }

    public void setSortByMinimizeGapFilter(boolean sortByMinimizeGapFilter) {
        SortByMinimizeGapFilter = sortByMinimizeGapFilter;
    }

    public List<String> getLocationsFilter() {
        return LocationsFilter;
    }

    public void setLocationsFilter(List<String> locationsFilter) {
        LocationsFilter = locationsFilter;
    }

    public String getCourseCode() {
        return CourseCode;
    }

    public void setCourseCode(String courseCode) {
        CourseCode = courseCode;
    }

    public String getTerm() {
        return Term;
    }

    public void setTerm(String term) {
        this.Term = term;
    }
}
