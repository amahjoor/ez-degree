export interface Review {
    comment: string;
    date: string;
    difficultyRating: number;
    clarityRating?: number;
    helpfulRating?: number;
    grade: string;
    textbookUse?: string;
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
    reviews: {
        [courseId: string]: {
            rating: number;
            difficulty: number;
            wouldTakeAgain: boolean;
            comment?: string;
        };
    };
    url?: string;
    isAttendanceMandatory?: number;
} 