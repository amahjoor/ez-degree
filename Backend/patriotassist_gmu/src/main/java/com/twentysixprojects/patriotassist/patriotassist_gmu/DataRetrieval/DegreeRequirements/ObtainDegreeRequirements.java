package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.DegreeRequirements;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

//Manually Set the Degree And Course Requirements
@Deprecated
public class ObtainDegreeRequirements {

    private String WebsiteURL = "https://patriotweb.gmu.edu/";

    private String ScheduleDataLocation = "..\\ScheduleData\\";

    //e.g Computer Science
    private String DegreeName;
    //e.g BS
    private String DegreeLevel;

    public ObtainDegreeRequirements(String DegreeName, String DegreeLevel)
    {
        this.DegreeName = DegreeName;
        this.DegreeLevel = DegreeLevel;
    }


    
}


class HelperClass
{
    private String WebsiteURL;
    
    private String DegreeName;
    private String DegreeLevel;
    
    private WebDriver Chrome_WebDriver;
    private ChromeOptions ChromeDriverConfiguration;


    public HelperClass(String DegreeName, String DegreeLevel)
    {
        this.DegreeName = DegreeName;
        this.DegreeLevel = DegreeLevel;

         //Configure Headless here once implementation is set
         ChromeDriverConfiguration = new ChromeOptions();
         ChromeDriverConfiguration.addArguments("--headless");
         //Chrome_WebDriver = new ChromeDriver(ChromeDriverConfiguration);
         Chrome_WebDriver = new ChromeDriver();
 
         ConfigureWebpage();
    }

    private WebElement ConfigureWebpage()
    {
        Chrome_WebDriver.get(WebsiteURL);
        WebElement RightColumnRawInformation = Chrome_WebDriver.findElement(By.id("az_sitemap_simple"));

        return RightColumnRawInformation;
    }
}