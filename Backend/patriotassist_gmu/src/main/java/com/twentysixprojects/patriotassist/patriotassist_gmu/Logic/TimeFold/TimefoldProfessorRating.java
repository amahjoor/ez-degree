package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class TimefoldProfessorRating {
    private String profileURL;
    private String school;
    private String name; // expected in normalized "First Last" format
    private double qualityRating;
    
    @JsonDeserialize(using = TimefoldRatingCountDeserializer.class)
    private int ratingCount;
    
    private String department;

    public String getProfileURL() { return profileURL; }
    public void setProfileURL(String profileURL) { this.profileURL = profileURL; }

    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getQualityRating() { return qualityRating; }
    public void setQualityRating(double qualityRating) { this.qualityRating = qualityRating; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    @Override
    public String toString() {
        return name + " (" + qualityRating + " from " + ratingCount + " ratings)";
    }
}
