package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFold;

import ai.timefold.solver.core.api.domain.solution.ProblemFactProperty;

public class TimefoldCreditLimits {

    @ProblemFactProperty
    private int minCredits;

    @ProblemFactProperty
    private int maxCredits;

    public TimefoldCreditLimits() { }

    public TimefoldCreditLimits(int minCredits, int maxCredits) {
        this.minCredits = minCredits;
        this.maxCredits = maxCredits;
    }

    public int getMinCredits() { return minCredits; }
    public void setMinCredits(int minCredits) { this.minCredits = minCredits; }

    public int getMaxCredits() { return maxCredits; }
    public void setMaxCredits(int maxCredits) { this.maxCredits = maxCredits; }
}
