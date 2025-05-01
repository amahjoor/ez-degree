package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import ai.timefold.solver.core.api.domain.solution.ProblemFactProperty;

public class CustomTimefoldCreditLimits {

    @ProblemFactProperty
    private int maxCredits;
    
    @ProblemFactProperty
    private int minCredits; // New field for minimum credits

    public CustomTimefoldCreditLimits() { }

    // Updated constructor to accept both minimum and maximum credits.
    public CustomTimefoldCreditLimits(int minCredits, int maxCredits) {
        this.minCredits = minCredits;
        this.maxCredits = maxCredits;
    }

    public int getMaxCredits() { 
        return maxCredits; 
    }
    
    public void setMaxCredits(int maxCredits) { 
        this.maxCredits = maxCredits; 
    }

    public int getMinCredits() { 
        return minCredits; 
    }
    
    public void setMinCredits(int minCredits) { 
        this.minCredits = minCredits; 
    }
}
