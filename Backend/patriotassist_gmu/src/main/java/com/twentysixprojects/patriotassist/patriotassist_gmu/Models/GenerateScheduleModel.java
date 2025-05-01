package com.twentysixprojects.patriotassist.patriotassist_gmu.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class GenerateScheduleModel
{
    @JsonProperty("term")
    private String term;

    @JsonProperty("selectedDegree")
    private String selectedDegree;

    @JsonProperty("availability")
    private Map<String, DayAvailability> availability;

    @JsonProperty("requirements")
    private Object requirements;

    @JsonProperty("locationPreferences")
    private List<String> locationPreferences;
    
    // New fields for semester credit limits
    @JsonProperty("minCredits")
    private int minCredits;

    @JsonProperty("maxCredits")
    private int maxCredits;

    @JsonProperty("ignoreSeatAvailability")
    private boolean ignoreSeatAvailability;


    // Getters and Setters
    public boolean getIgnoreSeatAvailability()
    {
        return ignoreSeatAvailability;
    }

    public void setIgnoreSeatAvailability(boolean ignoreSeatAvailability)
    {
        this.ignoreSeatAvailability = ignoreSeatAvailability;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String selectedTerm) {
        this.term = selectedTerm;
    }

    public String getSelectedDegree() {
        return selectedDegree;
    }

    public void setSelectedDegree(String selectedDegree) {
        this.selectedDegree = selectedDegree;
    }

    public Map<String, DayAvailability> getAvailability() {
        return availability;
    }

    public void setAvailability(Map<String, DayAvailability> availability) {
        this.availability = availability;
    }

    public Object getRequirements() {
        return requirements;
    }

    public void setRequirements(Object requirements) {
        this.requirements = requirements;
    }

    public List<String> getLocationPreferences() {
        return locationPreferences;
    }

    public void setLocationPreferences(List<String> locationPreferences) {
        this.locationPreferences = locationPreferences;
    }
    
    public int getMinCredits() {
        return minCredits;
    }

    public void setMinCredits(int minCredits) {
        this.minCredits = minCredits;
    }

    public int getMaxCredits() {
        return maxCredits;
    }

    public void setMaxCredits(int maxCredits) {
        this.maxCredits = maxCredits;
    }

    @Override
    public String toString() {
        return "GenerateScheduleModel{" +
                "selectedDegree='" + selectedDegree + '\'' +
                ", availability=" + availability +
                ", requirements=" + requirements +
                ", locationPreferences=" + locationPreferences +
                ", minCredits=" + minCredits +
                ", maxCredits=" + maxCredits +
                '}';
    }

    // Nested classes to match the frontend's availability format.
    public static class DayAvailability {

        @JsonProperty("selected")
        private boolean selected;

        @JsonProperty("intervals")
        private List<Interval> intervals;

        public boolean isSelected() {
            return selected;
        }

        public void setSelected(boolean selected) {
            this.selected = selected;
        }

        public List<Interval> getIntervals() {
            return intervals;
        }

        public void setIntervals(List<Interval> intervals) {
            this.intervals = intervals;
        }
    }

    public static class Interval {

        @JsonProperty("start")
        private String start;

        @JsonProperty("end")
        private String end;

        public String getStart() {
            return start;
        }

        public void setStart(String start) {
            this.start = start;
        }

        public String getEnd() {
            return end;
        }

        public void setEnd(String end) {
            this.end = end;
        }
    }
}
