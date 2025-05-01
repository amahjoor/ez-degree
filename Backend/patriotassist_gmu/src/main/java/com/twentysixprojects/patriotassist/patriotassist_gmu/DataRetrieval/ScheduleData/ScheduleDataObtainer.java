package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.ScheduleData;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Scanner;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.WebElement;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ScheduleDataObtainer {

    private String WebsiteURL = "https://patriotweb.gmu.edu/";

    private String ScheduleDataLocation = "..\\ScheduleData\\";

    public void GetScheduleData()
    {
        HelperClass HelperClassObj = new HelperClass(WebsiteURL, ScheduleDataLocation);
        HelperClassObj.GetScheduleData();
        HelperClassObj.CloseDriver();
    }
}

class HelperClass
{
    private WebDriver Chrome_WebDriver;
    private ChromeOptions ChromeDriverConfiguration;

    private String ScheduleDataLocation;

    private String WebsiteURL;
    private String ParentWindow;

    public HelperClass(String WebsiteURL, String ScheduleDataLocation)
    {
        this.WebsiteURL = WebsiteURL;
        this.ScheduleDataLocation = ScheduleDataLocation;

        //Configure Headless here once implementation is set
        ChromeDriverConfiguration = new ChromeOptions();
        ChromeDriverConfiguration.addArguments("--headless");
        //Chrome_WebDriver = new ChromeDriver(ChromeDriverConfiguration);
        Chrome_WebDriver = new ChromeDriver();

        ConfigureWebpage();
    }

    private void ConfigureWebpage()
    {
        Chrome_WebDriver.get(WebsiteURL);
        ParentWindow = Chrome_WebDriver.getWindowHandle();

        Scanner ScannerObject = new Scanner(System.in);
        System.out.println("Sign into your account and go directly to the schedule list then scroll down and change the 10 to 50, full screen window then press enter");
        ScannerObject.nextLine();
        ScannerObject.close();
    }

    public void CloseDriver()
    {
        Chrome_WebDriver.close();
    }

    public void GetScheduleData()
    {
        for (String WindowHandle : Chrome_WebDriver.getWindowHandles()) {
            if (!ParentWindow.equals(WindowHandle)) {
                Chrome_WebDriver.switchTo().window(WindowHandle);
            }
        }

        WebElement Term_WebElement = Chrome_WebDriver.findElement(By.id("searchTerms"));
        String TermName = Term_WebElement.getText().replace("Term: ", "");

        Date CurrentDateObject = new Date();
        SimpleDateFormat SimpleDateFormatObject = new SimpleDateFormat("yyyy:MM:dd:HH:mm:ss");
        String DateTime = SimpleDateFormatObject.format(CurrentDateObject);
        String CreationDataPath = ScheduleDataLocation + TermName + "\\" + "CreationData.txt";
        File CreationDataFileObject = new File(CreationDataPath);
        try {
            FileWriter FileWriterObject = new FileWriter(CreationDataFileObject);
            CreationDataFileObject.createNewFile();

            while(!CreationDataFileObject.exists())
            {
                Thread.sleep(1000);
            }

            FileWriterObject.write(DateTime);
            FileWriterObject.close();
        } catch (IOException | InterruptedException e) {
            System.out.println("Error with Writing To File: " + e);
        }

        System.out.println(TermName);

        //Start Download From 32 with Configuration 50 items per page
        int NextPageIndex = 25;
        while (true) 
        {
            System.out.println("Next Page Index Set To: " + NextPageIndex);
            WebDriverWait WebDriverWaitNextPage = new WebDriverWait(Chrome_WebDriver, Duration.ofSeconds(8));
            List<WebElement> CourseRows = null;

            try
            {
            CourseRows = WebDriverWaitNextPage.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector(".odd, .even")));
            }
            catch(StaleElementReferenceException e)
            {
                while(CourseRows == null)
                {
                    System.out.println("CourseRows Stale Element Error Trying Again...");
                    CourseRows = WebDriverWaitNextPage.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector(".odd, .even")));
                }
            }

            int CourseIndex = 0;
            for(WebElement Course : CourseRows)
            {
                //WebElement Course = WebDriverWaitNextPage.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector(".odd, .even"))).get(CourseIndex);
                WebElement CourseIterate = Chrome_WebDriver.findElements(By.cssSelector(".odd, .even")).get(CourseIndex);

                String CourseTitle = "null"; String CourseSubject = "null"; String CourseNumber = "null";
                String CourseSection = "null"; String CreditHours = "null"; String CRN = "null";
                String Term = "null"; String Instructor = "null"; String MeetingDays = "null"; String MeetingTimes = "null";
                String Campus = "null"; String Seats = "null"; String ScheduleType = "null";
                try
                {
                 CourseTitle = Course.findElement(By.xpath(".//td[@data-property='courseTitle']")).getText();
                 CourseSubject = Course.findElement(By.xpath(".//td[@data-property='subjectDescription']")).getText();
                 CourseNumber = Course.findElement(By.xpath(".//td[@data-property='courseNumber']")).getText();
                 CourseSection = Course.findElement(By.xpath(".//td[@data-property='sequenceNumber']")).getText();
                 CreditHours = Course.findElement(By.xpath(".//td[@data-property='creditHours']")).getText();
                 CRN = Course.findElement(By.xpath(".//td[@data-property='courseReferenceNumber']")).getText();
                 Term = Course.findElement(By.xpath(".//td[@data-property='term']")).getText();
                 Instructor = Course.findElement(By.xpath(".//td[@data-property='instructor']")).getText();
                
                 MeetingDays = Course.findElement(By.xpath(".//td[@data-property='meetingTime']")).getAttribute("title").split("SMTWTFS")[0];
                 MeetingTimes = Course.findElement(By.xpath(".//td[@data-property='meetingTime']"))
                    .findElement(By.className("meeting-schedule")).findElement(By.xpath(".//span[2]")).getText();

                 Campus = Course.findElement(By.xpath(".//td[@data-property='campus']")).getText();
                 Seats = Course.findElement(By.xpath(".//td[@data-property='status']")).getText();
                 ScheduleType = Course.findElement(By.xpath(".//td[@data-property='scheduleType']")).getText();
                }
                catch(StaleElementReferenceException e)
                {
                    //System.out.println("Stale Element Reference Error, Correcting...");
                    Course = WebDriverWaitNextPage.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector(".odd, .even"))).get(CourseIndex);
                    
                    try
                    {
                    CourseTitle = Course.findElement(By.xpath(".//td[@data-property='courseTitle']")).getText();
                    CourseSubject = Course.findElement(By.xpath(".//td[@data-property='subjectDescription']")).getText();
                    CourseNumber = Course.findElement(By.xpath(".//td[@data-property='courseNumber']")).getText();
                    CourseSection = Course.findElement(By.xpath(".//td[@data-property='sequenceNumber']")).getText();
                    CreditHours = Course.findElement(By.xpath(".//td[@data-property='creditHours']")).getText();
                    CRN = Course.findElement(By.xpath(".//td[@data-property='courseReferenceNumber']")).getText();
                    Term = Course.findElement(By.xpath(".//td[@data-property='term']")).getText();
                    Instructor = Course.findElement(By.xpath(".//td[@data-property='instructor']")).getText();
                
                    MeetingDays = Course.findElement(By.xpath(".//td[@data-property='meetingTime']")).getAttribute("title").split("SMTWTFS")[0];
                    MeetingTimes = Course.findElement(By.xpath(".//td[@data-property='meetingTime']"))
                    .findElement(By.className("meeting-schedule")).findElement(By.xpath(".//span[2]")).getText();

                    Campus = Course.findElement(By.xpath(".//td[@data-property='campus']")).getText();
                    Seats = Course.findElement(By.xpath(".//td[@data-property='status']")).getText();
                    ScheduleType = Course.findElement(By.xpath(".//td[@data-property='scheduleType']")).getText();
                    }
                    catch(NoSuchElementException e2)
                    {
                        System.out.println("Cannot Append Course Data For Course: " + CourseSubject + " On Page: " + (NextPageIndex - 1));
                    }
                }
                catch(NoSuchElementException e2)
                {
                    System.out.println("Cannot Append Course Data For Course: " + CourseSubject + " On Page: " + (NextPageIndex - 1));
                }

                CourseIndex++;
                
                System.out.println("Appended: " + CourseSubject + " " + CourseNumber + " " + CourseSection);

                DownloadData_Json(CourseTitle, CourseSubject, CourseNumber, CourseSection, CreditHours, CRN, TermName, Instructor, MeetingDays, MeetingTimes, Campus, Seats, ScheduleType);
            }
            System.out.println("Done With Page");

            WebElement PageInput = Chrome_WebDriver.findElement(By.className("page-number"));
            PageInput.clear();
            PageInput.sendKeys(String.valueOf(NextPageIndex));
            NextPageIndex++;
        }
    }

    private void DownloadData_Json(String CourseTitle, String CourseSubject, String CourseNumber, String CourseSection, String CreditHours,
    String CRN, String Term, String Instructor, String MeetingDays, String MeetingTimes, String Campus, String Seats, String ScheduleType)
    {
        // Define the directory and file name based on term and course details.
        String DirectoryPath = ScheduleDataLocation + Term + "\\";
        String FileName = CourseSubject + "-" + CourseNumber + "-" + CourseSection + ".json";
        String SafeFileName = FileName.replaceAll("[\\\\/:*?\"<>|]", "_");

        // Ensure the directory exists; create it if not.
        File directory = new File(DirectoryPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // Create a JSON object and populate it with course data.
        JsonObject jsonData = new JsonObject();
        jsonData.addProperty("CourseTitle", CourseTitle);
        jsonData.addProperty("CourseSubject", CourseSubject);
        jsonData.addProperty("CourseNumber", CourseNumber);
        jsonData.addProperty("CourseSection", CourseSection);
        jsonData.addProperty("CreditHours", CreditHours);
        jsonData.addProperty("CRN", CRN);
        jsonData.addProperty("Term", Term);
        jsonData.addProperty("Instructor", Instructor);
        jsonData.addProperty("MeetingDays", MeetingDays);
        jsonData.addProperty("MeetingTimes", MeetingTimes);
        jsonData.addProperty("Campus", Campus);
        jsonData.addProperty("Seats", Seats);
        jsonData.addProperty("ScheduleType", ScheduleType);

        // Add the current date and time (formatted with seconds)
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String formattedDateTime = now.format(formatter);
        jsonData.addProperty("createdAt", formattedDateTime);

        // Create a Gson instance with pretty printing enabled.
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String jsonString = gson.toJson(jsonData);

        // Write the JSON string to the file.
        try (FileWriter file = new FileWriter(DirectoryPath + SafeFileName)) {
            file.write(jsonString);
        } catch (IOException e) {
            e.printStackTrace();
        }
        }
}
