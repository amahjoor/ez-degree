package com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.RMP;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GetRMPData {

    private String WebsiteURL = "https://www.ratemyprofessors.com/search/professors/352?q=*";

    @Value("${project.data.path}")
    private String AllData_Path;

    public void getRMPData() {
        // The single JSON file where all professor data will be stored.
        String outputFile = AllData_Path + "\\RMP\\RMPData_All.json";
        HelperClass helper = new HelperClass(WebsiteURL, outputFile);
        helper.getRMPDataByCategory();
    }
}

class HelperClass {

    private String websiteURL;
    private String outputFile;
    private WebDriver driver;

    public HelperClass(String websiteURL, String outputFile) {
        this.websiteURL = websiteURL;
        this.outputFile = outputFile;

        ChromeOptions options = new ChromeOptions();
        // Use headless mode if desired; remove the argument for debugging.
        options.addArguments("--headless");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        driver.get(websiteURL);
    }

    public void getRMPDataByCategory() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        // To avoid processing the same category more than once.
        Set<String> processedCategories = new HashSet<>();

        try {
            // Click the textbox to reveal the dropdown.
            WebElement categoryTextbox = wait.until(ExpectedConditions.elementToBeClickable(By.className("css-12ex35h-control")));
            categoryTextbox.click();
            // Wait for the dropdown to appear.
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("css-w3e80j-menu")));
            
            // Get all category options.
            List<WebElement> categoryOptions = driver.findElements(By.cssSelector(".css-w3e80j-menu [role='option']"));
            System.out.println("Found " + categoryOptions.size() + " categories.");
            
            // Loop through each category.
            for (int i = 0; i < categoryOptions.size(); i++) {
                // Re-open the dropdown (the DOM may have changed after navigation).
                try {
                    categoryTextbox = wait.until(ExpectedConditions.elementToBeClickable(By.className("css-12ex35h-control")));
                    categoryTextbox.click();
                    wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("css-w3e80j-menu")));
                } catch(Exception e) {
                    System.out.println("Error re-opening category dropdown: " + e.getMessage());
                    continue;
                }
                
                // Re-find the category options.
                categoryOptions = driver.findElements(By.cssSelector(".css-w3e80j-menu [role='option']"));
                if (i >= categoryOptions.size()) {
                    break;
                }
                WebElement categoryElement = categoryOptions.get(i);
                String categoryName = categoryElement.getText().trim();
                if (processedCategories.contains(categoryName) || categoryName.isEmpty()) {
                    continue;
                }
                processedCategories.add(categoryName);
                System.out.println("Processing category: " + categoryName);

                // Click the category option.
                try {
                    try {
                        categoryElement.click();
                    } catch (ElementClickInterceptedException e) {
                        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", categoryElement);
                    }
                } catch(Exception e) {
                    System.out.println("Could not click category " + categoryName + ": " + e.getMessage());
                    continue;
                }
                
                // Wait for the filtered page to load.
                Thread.sleep(2000);

                // Click on the "Load More" button until no new professors are loaded.
                loadAllProfessors(wait);

                // Scrape the professor cards for the current category.
                JSONArray professors = scrapeProfessors(categoryName);

                // Append the current category's data to the output file.
                appendDataToFile(professors);

                // Navigate back to the original search URL for the next category.
                driver.get(websiteURL);
                Thread.sleep(2000);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            driver.quit();
        }
    }
    
    /**
     * Repeatedly clicks the "Load More" button until no new professor cards are loaded.
     */
    private void loadAllProfessors(WebDriverWait wait) {
        try {
            int previousCount = 0;
            while (true) {
                List<WebElement> cards = driver.findElements(By.className("TeacherCard__StyledTeacherCard-syjs0d-0"));
                int currentCount = cards.size();
                if (currentCount <= previousCount) {
                    break;
                }
                previousCount = currentCount;
                try {
                    List<WebElement> loadMoreButtons = driver.findElements(By.className("Buttons__Button-sc-19xdot-1"));
                    if (loadMoreButtons.isEmpty()) {
                        System.out.println("No 'Load More' button found; possibly all professors are loaded.");
                        break;
                    }
                    WebElement loadMoreButton = wait.until(ExpectedConditions.elementToBeClickable(By.className("Buttons__Button-sc-19xdot-1")));
                    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", loadMoreButton);
                    try {
                        loadMoreButton.click();
                    } catch (ElementClickInterceptedException e) {
                        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", loadMoreButton);
                    }
                    // Pause to allow new content to load.
                    Thread.sleep(2000);
                } catch (StaleElementReferenceException | NoSuchElementException e) {
                    break;
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Scrapes the professor cards and returns a JSONArray of professor data.
     * Each professor object includes a "category" tag.
     */
    private JSONArray scrapeProfessors(String categoryName) {
        JSONArray professorData = new JSONArray();
        List<WebElement> teacherCards = driver.findElements(By.className("TeacherCard__StyledTeacherCard-syjs0d-0"));
        System.out.println("Found " + teacherCards.size() + " professor cards in category: " + categoryName);
        for (WebElement card : teacherCards) {
            JSONObject professor = new JSONObject();
            try {
                // Profile URL from the <a> tag.
                String profileURL = card.getAttribute("href");
                professor.put("profileURL", profileURL);

                // Quality Rating.
                WebElement qualityElement = card.findElement(By.cssSelector(".CardNumRating__CardNumRatingNumber-sc-17t4b9u-2"));
                professor.put("qualityRating", qualityElement.getText());

                // Rating Count.
                WebElement ratingCountElement = card.findElement(By.cssSelector(".CardNumRating__CardNumRatingCount-sc-17t4b9u-3"));
                professor.put("ratingCount", ratingCountElement.getText());

                // Professor Name.
                WebElement nameElement = card.findElement(By.cssSelector(".CardName__StyledCardName-sc-1gyrgim-0"));
                professor.put("name", nameElement.getText());

                // Department / Subject.
                WebElement departmentElement = card.findElement(By.cssSelector(".CardSchool__Department-sc-19lmz2k-0"));
                professor.put("department", departmentElement.getText());

                // School Name.
                WebElement schoolElement = card.findElement(By.cssSelector(".CardSchool__School-sc-19lmz2k-1"));
                professor.put("school", schoolElement.getText());

                // "Would Take Again" Percentage.
                WebElement wouldTakeAgainElement = card.findElement(By.xpath(".//div[contains(text(), 'would take again')]/preceding-sibling::div"));
                professor.put("wouldTakeAgain", wouldTakeAgainElement.getText());

                // Difficulty Level.
                WebElement difficultyElement = card.findElement(By.xpath(".//div[contains(text(), 'level of difficulty')]/preceding-sibling::div"));
                professor.put("difficulty", difficultyElement.getText());

                // Add the category tag.
                professor.put("category", categoryName);

            } catch (NoSuchElementException ex) {
                System.out.println("A data element was not found in one of the cards. Some fields might be missing.");
            }
            professorData.put(professor);
        }
        return professorData;
    }

    /**
     * Appends the given JSONArray of professor data to the output JSON file.
     */
    private void appendDataToFile(JSONArray newData) {
        try {
            JSONArray existingData;
            File file = new File(outputFile);
            if (file.exists()) {
                // Read existing file content.
                String content = new String(Files.readAllBytes(file.toPath()));
                if (content.trim().isEmpty()) {
                    existingData = new JSONArray();
                } else {
                    existingData = new JSONArray(content);
                }
            } else {
                existingData = new JSONArray();
            }
            // Append each professor object from the newData.
            for (int i = 0; i < newData.length(); i++) {
                existingData.put(newData.getJSONObject(i));
            }
            // Write back to the file.
            try (FileWriter writer = new FileWriter(outputFile)) {
                writer.write(existingData.toString(4));
                System.out.println("Appended data to file: " + outputFile);
            }
        } catch (IOException e) {
            System.out.println("Error appending to JSON file: " + e.getMessage());
        }
    }
}
