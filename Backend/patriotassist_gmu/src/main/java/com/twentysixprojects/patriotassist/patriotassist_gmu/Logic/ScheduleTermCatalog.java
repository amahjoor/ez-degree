package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ScheduleTermCatalog {

    private static final Pattern TERM_PATTERN = Pattern.compile("^(Spring|Summer|Fall)\\s+(\\d{4})$", Pattern.CASE_INSENSITIVE);

    @Value("${project.data.path}")
    private String allDataPath;

    @Value("${supported.terms:}")
    private String supportedTermsFallback;

    public List<String> listCatalogTerms() {
        List<String> terms = new ArrayList<>();
        File scheduleDir = new File(allDataPath + File.separator + "ScheduleData");
        File[] folders = scheduleDir.listFiles(File::isDirectory);
        if (folders != null) {
            for (File folder : folders) {
                if (TERM_PATTERN.matcher(folder.getName()).matches()) {
                    terms.add(folder.getName());
                }
            }
        }
        if (terms.isEmpty() && supportedTermsFallback != null && !supportedTermsFallback.isBlank()) {
            Arrays.stream(supportedTermsFallback.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(terms::add);
        }
        terms.sort(termComparator());
        return terms;
    }

    private Comparator<String> termComparator() {
        return (a, b) -> {
            Matcher ma = TERM_PATTERN.matcher(a);
            Matcher mb = TERM_PATTERN.matcher(b);
            boolean aOk = ma.matches();
            boolean bOk = mb.matches();
            if (!aOk && !bOk) return a.compareTo(b);
            if (!aOk) return 1;
            if (!bOk) return -1;
            int yearDiff = Integer.parseInt(ma.group(2)) - Integer.parseInt(mb.group(2));
            if (yearDiff != 0) return yearDiff;
            return seasonOrder(ma.group(1)) - seasonOrder(mb.group(1));
        };
    }

    private int seasonOrder(String season) {
        switch (season.toLowerCase(Locale.ROOT)) {
            case "spring": return 1;
            case "summer": return 2;
            default: return 3;
        }
    }
}
