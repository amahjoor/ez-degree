-- SQL Insert statements for GMU CS Requirements
-- Generated from the web scraper

-- Insert Degree Program
INSERT INTO degree_programs (name, total_credits, description) VALUES ('Statistics BS', 120.0, 'Bachelor of Science in Computer Science') ON CONFLICT (name) DO UPDATE SET total_credits = 120.0;

-- Insert Categories
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Statistics Core', 1, 24.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 24.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Mathematics Core', 1, 11.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 11.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Computational Skills Core', 1, 4.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 4.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Statistics', 1, 3.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 3.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Technical', 1, 30.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 30.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Concentration in Mathematical Statistics (MTHS)', 1, 19.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 19.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Concentration in Sports Analytics (SPAL)', 1, 24.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 24.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Concentration in Statistical Analytics (STLA)', 1, 24.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 24.0;

-- Insert Courses
INSERT INTO courses (code, title, credits) VALUES ('STAT 260', 'Introduction to Statistical Practice I', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Statistical Practice I', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 334', 'Introduction to Probability Models and Simulation 1', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Probability Models and Simulation 1', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 354', 'Probability and Statistics for Engineers and Scientists II', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Probability and Statistics for Engineers and Scientists II', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 362', 'Introduction to Computer Statistical Packages', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Computer Statistical Packages', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 456', 'Applied Regression Analysis', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Applied Regression Analysis', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 463', 'Introduction to Exploratory Data Analysis', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Exploratory Data Analysis', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 489', 'Pre-Capstone Professional Development (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Pre-Capstone Professional Development (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 490', 'Capstone in Statistics (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Capstone in Statistics (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 113', 'Analytic Geometry and Calculus I (Mason Core) 1,2', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus I (Mason Core) 1,2', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 114', 'Analytic Geometry and Calculus II 3', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus II 3', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 203', 'Linear Algebra', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Linear Algebra', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 112', 'Introduction to Computer Programming (Mason Core)', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Computer Programming (Mason Core)', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 356', 'Statistical Theory', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Statistical Theory', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 125', 'Discrete Mathematics I (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Discrete Mathematics I (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('BENG 322', 'Health Data Challenges', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Health Data Challenges', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 101', 'Introduction to Cyber Security Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Cyber Security Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ENGH 388', 'Professional and Technical Writing', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Professional and Technical Writing', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('IT 214', 'Database Fundamentals', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Database Fundamentals', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SOCI 391', 'Big Data, Technology, and Society', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Big Data, Technology, and Society', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 438', 'Analytics for Financial Engineering and Econometrics', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytics for Financial Engineering and Econometrics', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 468', 'Applied Predictive Analytics', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Applied Predictive Analytics', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 473', 'Decision and Risk Analysis', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Decision and Risk Analysis', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 488', 'Financial Systems Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Financial Systems Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 356', 'Statistical Theory', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Statistical Theory', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CDS 130', 'Computing for Scientists (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Computing for Scientists (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 125', 'Discrete Mathematics I (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Discrete Mathematics I (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 213', 'Analytic Geometry and Calculus III 1', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus III 1', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 300', 'Introduction to Advanced Mathematics (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Advanced Mathematics (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 315', 'Advanced Calculus I', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Advanced Calculus I', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SPMT 201', 'Introduction to Sport Management', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Sport Management', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SPMT 425', 'Sport Analytics', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Sport Analytics', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SRST 450', 'Research Methods (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Research Methods (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ECON 103', 'Contemporary Microeconomic Principles (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Contemporary Microeconomic Principles (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ECON 104', 'Contemporary Macroeconomic Principles (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Contemporary Macroeconomic Principles (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CDS 130', 'Computing for Scientists (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Computing for Scientists (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 468', 'Applied Predictive Analytics', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Applied Predictive Analytics', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 473', 'Decision and Risk Analysis', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Decision and Risk Analysis', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 472', 'Introduction to Statistical Learning', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Statistical Learning', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 211', 'Object-Oriented Programming', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Object-Oriented Programming', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 310', 'Data Structures', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Data Structures', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 330', 'Formal Methods and Models', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Formal Methods and Models', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 450', 'Database Concepts', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Database Concepts', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 484', 'Data Mining', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Data Mining', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 125', 'Discrete Mathematics I (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Discrete Mathematics I (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('OR 481', 'Numerical Methods in Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Numerical Methods in Engineering', credits = 3.0;

-- Insert Category Requirements
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 260')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 334')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 354')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 362')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 456')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 463')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 489')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'STAT 490')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (2, (SELECT id FROM courses WHERE code = 'MATH 113')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (2, (SELECT id FROM courses WHERE code = 'MATH 114')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (2, (SELECT id FROM courses WHERE code = 'MATH 203')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (3, (SELECT id FROM courses WHERE code = 'CS 112')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'STAT 356')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'MATH 125')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'BENG 322')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'CYSE 101')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'ENGH 388')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'IT 214')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'SOCI 391')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'SYST 438')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'SYST 468')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'SYST 473')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'SYST 488')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'STAT 356')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'CDS 130')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'MATH 125')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'MATH 213')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'MATH 300')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'MATH 315')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'SPMT 201')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'SPMT 425')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'SRST 450')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'ECON 103')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'ECON 104')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'CDS 130')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'SYST 468')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'SYST 473')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'STAT 472')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'CS 211')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'CS 310')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'CS 330')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'CS 450')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'CS 484')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'MATH 125')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'OR 481')) ON CONFLICT (category_id, course_id) DO NOTHING;

-- Insert Course Alternatives
