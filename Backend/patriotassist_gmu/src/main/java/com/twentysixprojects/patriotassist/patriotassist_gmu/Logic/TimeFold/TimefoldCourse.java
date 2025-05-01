package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TimefoldCourse {

    @JsonProperty("CourseTitle")
    private String courseTitle;

    @JsonProperty("CourseSubject")
    private String courseSubject;

    @JsonProperty("CourseNumber")
    private String courseNumber;

    @JsonProperty("CourseSection")
    private String courseSection;

    @JsonProperty("CreditHours")
    private int creditHours;

    @JsonProperty("CRN")
    private String CRN;

    @JsonProperty("Term")
    private String term;

    @JsonProperty("Instructor")
    private String instructor;

    @JsonProperty("MeetingDays")
    private String meetingDays;

    @JsonProperty("MeetingTimes")
    private String meetingTimes;

    @JsonProperty("Campus")
    private String campus;

    @JsonProperty("Seats")
    private String seats;

    @JsonProperty("ScheduleType")
    private String scheduleType;

    @JsonProperty("createdAt")
    private String createdAt;

    // Computed fields from meetingTimes:
    private LocalTime startTime;
    private LocalTime endTime;
    
    // New fields for professor rating details:
    @JsonProperty("ProfessorRating")
    private Double professorRating;  // Can be null if not available

    @JsonProperty("ProfessorRatingCount")
    private Integer professorRatingCount;  // Can be null if not available

    // New field for student's LabOnly preference.
    // True means the student has already taken the lecture and only needs the lab.
    @JsonProperty("LabOnly")
    private boolean labOnly;

    // Getters and setters

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getCourseSubject() { return courseSubject; }
    public void setCourseSubject(String courseSubject) { this.courseSubject = courseSubject; }

    public String getCourseNumber() { return courseNumber; }
    public void setCourseNumber(String courseNumber) { this.courseNumber = courseNumber; }

    public String getCourseSection() { return courseSection; }
    public void setCourseSection(String courseSection) { this.courseSection = courseSection; }

    public int getCreditHours() { return creditHours; }
    public void setCreditHours(int creditHours) { this.creditHours = creditHours; }

    public String getCRN() { return CRN; }
    public void setCRN(String CRN) { this.CRN = CRN; }

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }

    public String getMeetingDays() { return meetingDays; }
    public void setMeetingDays(String meetingDays) { this.meetingDays = meetingDays; }

    public String getMeetingTimes() { return meetingTimes; }
    public void setMeetingTimes(String meetingTimes) { this.meetingTimes = meetingTimes; }

    public String getCampus() { return campus; }
    public void setCampus(String campus) { this.campus = campus; }

    public String getSeats() { return seats; }
    public void setSeats(String seats) { this.seats = seats; }

    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    public Double getProfessorRating() { return professorRating; }
    public void setProfessorRating(Double professorRating) { this.professorRating = professorRating; }

    public Integer getProfessorRatingCount() { return professorRatingCount; }
    public void setProfessorRatingCount(Integer professorRatingCount) { this.professorRatingCount = professorRatingCount; }

    public boolean isLabOnly() { return labOnly; }
    public void setLabOnly(boolean labOnly) { this.labOnly = labOnly; }

    /**
     * Parses the meetingTimes string (e.g., "04:30 PM - 07:10 PM") into startTime and endTime.
     */
    public void parseMeetingTimes() {
        if (meetingTimes != null && meetingTimes.contains("-")) {
            String[] parts = meetingTimes.split("-");
            String startStr = parts[0].trim();
            String endStr = parts[1].trim();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a");
            this.startTime = LocalTime.parse(startStr, formatter);
            this.endTime = LocalTime.parse(endStr, formatter);
        }
    }
    
    @Override
    public String toString() {
        return courseTitle + " (" + courseNumber + ")";
    }
}
