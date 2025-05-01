package com.twentysixprojects.patriotassist.patriotassist_gmu.Models;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GenerateScheduleCustomModel {
    @JsonProperty("term")
    private String term;

    @JsonProperty("availability")
    private Map<String, DayAvailability> availability;

    @JsonProperty("courseCodes")
    private List<String> CourseCodes;

    @JsonProperty("locationPreferences")
    private List<String> locationPreferences;
    
    // New fields for semester credit limits
    @JsonProperty("minCredits")
    private int minCredits;

    @JsonProperty("maxCredits")
    private int maxCredits;

    @JsonProperty("ignoreSeatAvailability")
    private boolean ignoreSeatAvailability;

    @JsonProperty("considerProfessorRatings")
    private boolean considerProfessorRatings;

    @JsonProperty("minimizeGap")
    private boolean minimizeGap;

    @JsonProperty("preferLaterClasses")
    private boolean preferLaterClasses;

    @JsonProperty("preferEarlierClasses")
    private boolean preferEarlierClasses;

    @JsonProperty("minimizeDaysOnCampus")
    private boolean minimizeDaysOnCampus;

    @JsonProperty("excludedProfessors")
    private List<String> excludedProfessors;

    @JsonProperty("minimizeGapMultiplier")
    private int minimizeGapMultiplier;

    @JsonProperty("maximizeProfessorRatingsMultiplier")
    private int maximizeProfessorRatingsMultiplier;

    @JsonProperty("maximizeTimePreferenceMultiplier")
    private int maximizeTimePreferenceMultiplier;

    @JsonProperty("minimizeDaysOnCampusMultiplier")
    private int minimizeDaysOnCampusMultiplier;

    // Getters and Setters
    public int getMinimizeDaysOnCampusMultiplier()
    {
        return minimizeDaysOnCampusMultiplier;
    }

    public void setMinimizeDaysOnCampusMultiplier(int minimizeDaysOnCampusMultiplier)
    {
        this.minimizeDaysOnCampusMultiplier = minimizeDaysOnCampusMultiplier;
    }

    public int getMaximizeTimePreferenceMultiplier()
    {
        return maximizeTimePreferenceMultiplier;
    }

    public void setMaximizeTimePreferenceMultiplier(int maximizeTimePreferenceMultiplier)
    {
        this.maximizeTimePreferenceMultiplier = maximizeTimePreferenceMultiplier;
    }

    public int getMaximizeProfessorRatingsMultiplier()
    {
        return maximizeProfessorRatingsMultiplier;
    }

    public void setMaximizeProfessorRatingsMultiplier(int maximizeProfessorRatingsMultiplier)
    {
        this.maximizeProfessorRatingsMultiplier = maximizeProfessorRatingsMultiplier;
    }

    public int getMinimizeGapMultiplier()
    {
        return minimizeGapMultiplier;
    }

    public void setMinimizeGapMultiplier(int minimizeGapMultiplier)
    {
        this.minimizeGapMultiplier = minimizeGapMultiplier;
    }

    
    public List<String> getExcludedProfessors()
    {
        return excludedProfessors;
    }

    public void setExcludedProfessors(List<String> excludedProfessors)
    {
        this.excludedProfessors = excludedProfessors;
    }

    public boolean getMinimizeDaysOnCampus()
    {
        return minimizeDaysOnCampus;
    }

    public void setMinimizeDaysOnCampus(boolean minimizeDaysOnCampus)
    {
        this.minimizeDaysOnCampus = minimizeDaysOnCampus;
    }

    public boolean getConsiderProfessorRatings()
    {
        return considerProfessorRatings;
    }

    public void setConsiderProfessorRatings(boolean considerProfessorRatings)
    {
        this.considerProfessorRatings = considerProfessorRatings;
    }

    public boolean getMinimizeGap()
    {
        return minimizeGap;
    }

    public void setMinimizeGap(boolean minimizeGap)
    {
        this.minimizeGap = minimizeGap;
    }

    public boolean getPreferLaterClasses()
    {
        return preferLaterClasses;
    }

    public void setPreferLaterClasses(boolean preferLaterClasses)
    {
        this.preferLaterClasses = preferLaterClasses;
    }

    public boolean getPreferEarlierClasses()
    {
        return preferEarlierClasses;
    }

    public void setPreferEarlierClasses(boolean preferEarlierClasses)
    {
        this.preferEarlierClasses = preferEarlierClasses;
    }

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


    public Map<String, DayAvailability> getAvailability() {
        return availability;
    }

    public void setAvailability(Map<String, DayAvailability> availability) {
        this.availability = availability;
    }

    public List<String> getCourseCodes() {
        return CourseCodes;
    }

    public void setCourseCodes(List<String> CourseCodes) {
        this.CourseCodes = CourseCodes;
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
                ", availability=" + availability +
                ", courseCodes=" + CourseCodes +
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

