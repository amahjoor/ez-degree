// File: CreditLimits.java
package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

import org.optaplanner.core.api.domain.solution.ProblemFactProperty;

public class CreditLimits {

    @ProblemFactProperty
    private int minCredits;

    @ProblemFactProperty
    private int maxCredits;

    public CreditLimits() {
    }

    public CreditLimits(int minCredits, int maxCredits) {
        this.minCredits = minCredits;
        this.maxCredits = maxCredits;
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
}
