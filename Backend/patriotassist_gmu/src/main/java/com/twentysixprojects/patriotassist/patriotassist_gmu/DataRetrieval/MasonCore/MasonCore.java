package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.MasonCore;

import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MasonCore {

    private String WebsiteURL = "https://catalog.gmu.edu/mason-core/";

    @Value("${project.data.path}")
    private String AllData_Path;
    
    public void GetCourseData()
    {
        String JsonFile_Path = AllData_Path + "\\MasonCore\\MasonCore.json";
        HelperClass HelperClassObj = new HelperClass(WebsiteURL, JsonFile_Path);
        HelperClassObj.RetrieveCourseData();
        HelperClassObj.QuitDriver_3();
    }
}

class HelperClass {

    private WebDriver driver;
    private String jsonFilePath;

    public HelperClass(String websiteURL, String jsonFilePath) {
        this.jsonFilePath = jsonFilePath;

        driver = new ChromeDriver();
        driver.get(websiteURL);
    }

    public void RetrieveCourseData() {
        // Create the root JSON object.
        JSONObject root = new JSONObject();
        JSONArray categoriesArray = new JSONArray();

        // Locate all toggle-wrap elements.
        List<WebElement> toggleWraps = driver.findElements(By.cssSelector("div.toggle-wrap"));
        for (WebElement toggleWrap : toggleWraps) {
            JSONObject categoryObj = new JSONObject();
            try {
                // Get the category name from the button's text, trimming "Hide".
                WebElement button = toggleWrap.findElement(By.tagName("button"));
                String buttonText = button.getText();
                if (buttonText.endsWith("Hide")) {
                    buttonText = buttonText.substring(0, buttonText.lastIndexOf("Hide")).trim();
                }
                categoryObj.put("category", buttonText);

                // Click the button to expand the content.
                button.click();

                // Get the expanded content.
                WebElement toggleContent = toggleWrap.findElement(By.className("toggle-content"));

                // Extract description (first paragraph).
                String description = "";
                try {
                    WebElement pDesc = toggleContent.findElement(By.tagName("p"));
                    description = pDesc.getText();
                } catch (Exception e) {
                    // Description not found.
                }
                categoryObj.put("description", description);

                // Extract learning outcomes.
                String learningOutcomes = "";
                try {
                    List<WebElement> h4s = toggleContent.findElements(By.tagName("h4"));
                    for (WebElement h4 : h4s) {
                        if (h4.getText().contains("Learning Outcomes")) {
                            WebElement outcomeParagraph = h4.findElement(By.xpath("following-sibling::p[1]"));
                            learningOutcomes = outcomeParagraph.getText();
                            break;
                        }
                    }
                } catch (Exception e) {
                    // Learning outcomes not found.
                }
                categoryObj.put("learningOutcomes", learningOutcomes);

                // Extract "Required" info.
                String required = "";
                try {
                    List<WebElement> h4s = toggleContent.findElements(By.tagName("h4"));
                    for (WebElement h4 : h4s) {
                        if (h4.getText().contains("Required")) {
                            WebElement reqParagraph = h4.findElement(By.xpath("following-sibling::p[1]"));
                            required = reqParagraph.getText();
                            break;
                        }
                    }
                } catch (Exception e) {
                    // Required info not found.
                }
                categoryObj.put("required", required);

                // Extract courses data from the table.
                JSONArray coursesArray = new JSONArray();
                try {
                    WebElement table = toggleContent.findElement(By.cssSelector("table.sc_courselist"));
                    List<WebElement> rows = table.findElements(By.cssSelector("tbody tr"));
                    for (WebElement row : rows) {
                        List<WebElement> cells = row.findElements(By.tagName("td"));
                        if (cells.size() >= 3) {
                            JSONObject courseObj = new JSONObject();
                            // Course code.
                            String code = cells.get(0).getText().trim();
                            courseObj.put("code", code);
                            // Course title.
                            String title = cells.get(1).getText().trim();
                            courseObj.put("title", title);
                            // Course credits.
                            String creditsStr = cells.get(2).getText().trim();
                            try {
                                int credits = Integer.parseInt(creditsStr);
                                courseObj.put("credits", credits);
                            } catch (NumberFormatException nfe) {
                                courseObj.put("credits", creditsStr);
                            }
                            // Do not include URL as per requirement.
                            coursesArray.put(courseObj);
                        }
                    }
                } catch (Exception e) {
                    // Courses table not found.
                }
                categoryObj.put("courses", coursesArray);
                categoriesArray.put(categoryObj);

            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        root.put("categories", categoriesArray);

        // Write the JSON data to the file.
        try (FileWriter file = new FileWriter(jsonFilePath)) {
            file.write(root.toString(4)); // pretty-print JSON with 4-space indentation.
            file.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void QuitDriver_3() {
        if (driver != null) {
            driver.quit();
        }
    }
}