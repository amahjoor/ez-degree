export interface Review {
    comment?: string;
    date: string;
    difficultyRating: number;
    clarityRating?: number;
    helpfulRating?: number;
    grade: string;
    textbookUse?: string | number;
    wouldTakeAgain?: boolean;
    attendanceMandatory?: string;
    isForCredit?: boolean;
    isForOnlineClass?: boolean;
    ratingTags?: string[];
    thumbsDownTotal?: number;
    thumbsUpTotal?: number;
}

export interface Professor {
    firstName: string;
    lastName: string;
    department: string;
    avgRating: number;
    avgDifficulty: number;
    wouldTakeAgainPercent: number;
    helpfulRating?: number;
    clarityRating?: number;
    averageGrade?: string;
    reviews: { [courseCode: string]: Review[] };
    url?: string;
    isAttendanceMandatory?: number;
} 