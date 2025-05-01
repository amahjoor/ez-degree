package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseData;

import java.io.IOException;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.io.FileWriter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.json.JSONArray;
import org.json.JSONObject;

public class ObtainCourseData {
    
    private String WebsiteURL = "https://catalog.gmu.edu/courses/";

    private String ScheduleDataLocation = "..\\ScheduleData\\";
    
    public void GetCourseData()
    {
        HelperClass HelperClassObj = new HelperClass(WebsiteURL, ScheduleDataLocation);
        HelperClassObj.RetrieveCourseData();
        HelperClassObj.QuitDriver_3();
    }
}

class HelperClass
{
    private String WebsiteURL;

    private String ScheduleDataLocation;

    private WebDriver Chrome_WebDriver;

    public HelperClass(String WebsiteURL, String ScheduleDataLocation)
    {
        this.WebsiteURL = WebsiteURL;
        this.ScheduleDataLocation = ScheduleDataLocation;

        ChromeOptions ChromeDriverConfiguration = new ChromeOptions();
        ChromeDriverConfiguration.addArguments("--headless");
        //Chrome_WebDriver = new ChromeDriver(ChromeDriverConfiguration);
        Chrome_WebDriver = new ChromeDriver();

        ConfigureWebpage();
    }

    private void ConfigureWebpage()
    {
        Chrome_WebDriver.get(WebsiteURL);
    }

    public void RetrieveCourseData()
    {
        WebElement CourseLinks = Chrome_WebDriver.findElement(By.id("atozindex"));
        List<WebElement> AllCourseSubjectLinks = CourseLinks.findElements(By.tagName("li"));

        for(WebElement CourseSubjectLink : AllCourseSubjectLinks)
        {

            String LinkText = CourseSubjectLink.getText();
            System.out.println("Downloading Data for Subject: " + LinkText);

            WebElement LinkElement = Chrome_WebDriver.findElement((By.linkText(LinkText)));
            String HrefLink = LinkElement.getAttribute("href");
            Chrome_WebDriver.get(HrefLink);

            ExpandCourse(CourseSubjectLink);

            try {
                DownloadData();
            } catch (IOException e) {
                System.out.println("Unable to Create New Directory");
            }


            Chrome_WebDriver.navigate().back();
        }
    }

    private void ExpandCourse(WebElement CourseSubjectLink)
    {
        WebElement CourseContainer = Chrome_WebDriver.findElement(By.id("coursescontainer"));
        List<WebElement> CourseBlockLevelsList = CourseContainer.findElements(By.className("courseblocklevel"));
        for(WebElement CourseBlockLevel : CourseBlockLevelsList)
        {
            CourseBlockLevel.click();
        }
    }

    private void DownloadData() throws IOException
    {
        String SubjectTitle = Chrome_WebDriver.findElement(By.className("page-title")).getText();
    String NewSubjectLevelDirectory = ScheduleDataLocation + SubjectTitle + "\\";
    Path subjectPath = Paths.get(NewSubjectLevelDirectory);
    Files.createDirectories(subjectPath);

    WebElement AllCourses = Chrome_WebDriver.findElement(By.id("coursescontainer"));
    List<WebElement> CourseBlockLevels = AllCourses.findElements(By.className("courseblocklevel"));

    // Iterate over each course block level (for example "200 Level Courses")
    for (WebElement EachCourseblockLevel : CourseBlockLevels) {
        // Get the course level code from the toggle element (assumes the first line/text)
        String CourseLevel = EachCourseblockLevel.findElement(By.className("course-toggle")).getText().split("\\n")[0];

        // Retrieve all courses under this category
        List<WebElement> AllCourseBlocks = EachCourseblockLevel.findElements(By.className("courseblock"));
        JSONArray coursesArray = new JSONArray();

        // Process each course (e.g., CS 101, etc.)
        for (WebElement EachCourse : AllCourseBlocks) {
            WebElement CourseTitleAndCreditsWebElement = EachCourse.findElement(By.className("courseblocktitle"));
            String CourseTitleAndCredits = CourseTitleAndCreditsWebElement.getText();
            String[] CourseTitleAndCreditsList = CourseTitleAndCredits.split(" ");

            // Extract the course title (e.g., "CS 101")
            String CourseTitle = CourseTitleAndCreditsList[0] + " " + CourseTitleAndCreditsList[1];
            CourseTitle = CourseTitle.substring(0, CourseTitle.length() - 1);
            System.out.println("Course Title: " + CourseTitle);

            // Extract the course credits
            String CourseCredits = CourseTitleAndCreditsList[CourseTitleAndCreditsList.length - 2] 
                                  + " " + CourseTitleAndCreditsList[CourseTitleAndCreditsList.length - 1];
            CourseCredits = CourseCredits.substring(0, CourseCredits.length() - 1);
            System.out.println("Course Credits: " + CourseCredits);

            // Attempt to get the prerequisite data (default to "NoPreReq")
            String PreRequisiteCourseData = "NoPreReq";
            try {
                PreRequisiteCourseData = EachCourse.findElement(By.className("prereq")).getText();
            } catch(Exception e) {
                // No prerequisite requirements found
            }

            // Get the course name, cleaning it up as needed
            String CourseName = CourseTitleAndCreditsWebElement.findElement(By.className("cb_title")).getText().replace(".", "");
            System.out.println("Course Name: " + CourseName);

            // Build a JSON object for the course
            JSONObject courseJson = new JSONObject();
            courseJson.put("courseTitle", CourseTitle);
            courseJson.put("courseName", CourseName);
            courseJson.put("courseCredits", CourseCredits);
            courseJson.put("preRequisite", PreRequisiteCourseData);

            coursesArray.put(courseJson);
        }

        // Build the category JSON object with the category code as key and the courses array as value
        JSONObject categoryJson = new JSONObject();
        categoryJson.put(CourseLevel, coursesArray);

        // Write the JSON to a file named after the course level (category)
        String jsonFilePath = NewSubjectLevelDirectory + CourseLevel + ".json";
        File jsonFile = new File(jsonFilePath);
        FileWriter fileWriter = new FileWriter(jsonFile);
        fileWriter.write(categoryJson.toString(4));  // formatted output with indent factor 4
        fileWriter.flush();
        fileWriter.close();
    }
  }

    public void QuitDriver_3()
    {
        Chrome_WebDriver.quit();
    }

}



