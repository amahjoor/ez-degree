-- SQL Insert statements for GMU CS Requirements
-- Generated from the web scraper

-- Insert Degree Program
INSERT INTO degree_programs (name, total_credits, description) VALUES ('Cybersecurity Engineering BS', 120.0, 'Bachelor of Science in Computer Science') ON CONFLICT (name) DO UPDATE SET total_credits = 120.0;

-- Insert Categories
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Cyber Security Engineering Core', 1, 74.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 74.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Electrical and Computer Engineering', 1, 3.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 3.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Systems Engineering', 1, 3.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 3.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Mathematics and Statistics', 1, 24.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 24.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Natural Sciences', 1, 8.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 8.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Computing', 1, 10.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 10.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Engineering', 1, 3.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 3.0;
INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('Oral Communication and Economics', 1, 6.0) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = 6.0;

-- Insert Courses
INSERT INTO courses (code, title, credits) VALUES ('CYSE 101', 'Introduction to Cyber Security Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Cyber Security Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 130', 'Introduction to Computing for Digital Systems Engineering (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Computing for Digital Systems Engineering (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 211', 'Operating Systems and Lab', 1.0) ON CONFLICT (code) DO UPDATE SET title = 'Operating Systems and Lab', credits = 1.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 230', 'Computer Networking', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Computer Networking', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 304', 'Cyber Security in Logic Design and Digital Systems', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Cyber Security in Logic Design and Digital Systems', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 411', 'Secure Software Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Secure Software Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 421', 'Industrial Control Systems Security', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Industrial Control Systems Security', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 425', 'Secure RF Communications', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Secure RF Communications', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 430', 'Critical Infrastructure Protection', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Critical Infrastructure Protection', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 445', 'System Security and Resilience', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'System Security and Resilience', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 450', 'Cyber Vulnerability Lab', 1.0) ON CONFLICT (code) DO UPDATE SET title = 'Cyber Vulnerability Lab', credits = 1.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 476', 'Cryptography Fundamentals', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Cryptography Fundamentals', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 491', 'Engineering Senior Seminar (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Engineering Senior Seminar (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 492', 'Senior Advanced Design Project I', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Senior Advanced Design Project I', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 493', 'Senior Advanced Design Project II (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Senior Advanced Design Project II (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 424', 'Embedded and Real Time Systems', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Embedded and Real Time Systems', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 460', 'Power Systems and Smart Grid Security', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Power Systems and Smart Grid Security', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 462', 'Mobile Devices and Network Security', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Mobile Devices and Network Security', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 465', 'Transportation Systems Design', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Transportation Systems Design', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 467', 'GPS Security', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'GPS Security', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 470', 'Human Factors and Cyber Security Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Human Factors and Cyber Security Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 477', 'Intrusion Detection', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Intrusion Detection', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 478', 'Cyber Security Audit and Compliance', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Cyber Security Audit and Compliance', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 479', 'Methods of User Authentication', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Methods of User Authentication', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 480', 'Reverse Software Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Reverse Software Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CYSE 499', 'Special Topics in Cyber Security Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Special Topics in Cyber Security Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ECE 301', 'Digital Electronics 1', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Digital Electronics 1', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 205', 'Systems Engineering Principles', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Systems Engineering Principles', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 113', 'Analytic Geometry and Calculus I (Mason Core)', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus I (Mason Core)', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 114', 'Analytic Geometry and Calculus II', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus II', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 125', 'Discrete Mathematics I (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Discrete Mathematics I (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 203', 'Linear Algebra', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Linear Algebra', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 213', 'Analytic Geometry and Calculus III', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Analytic Geometry and Calculus III', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('MATH 214', 'Elementary Differential Equations', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Elementary Differential Equations', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('STAT 344', 'Probability and Statistics for Engineers and Scientists I', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Probability and Statistics for Engineers and Scientists I', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('PHYS 160', 'University Physics I (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'University Physics I (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('PHYS 161', 'University Physics I Laboratory (Mason Core)', 1.0) ON CONFLICT (code) DO UPDATE SET title = 'University Physics I Laboratory (Mason Core)', credits = 1.0;
INSERT INTO courses (code, title, credits) VALUES ('PHYS 260', 'University Physics II (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'University Physics II (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('PHYS 261', 'University Physics II Laboratory (Mason Core)', 1.0) ON CONFLICT (code) DO UPDATE SET title = 'University Physics II Laboratory (Mason Core)', credits = 1.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 112', 'Introduction to Computer Programming (Mason Core)', 4.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Computer Programming (Mason Core)', credits = 4.0;
INSERT INTO courses (code, title, credits) VALUES ('SYST 230', 'Object-oriented Modeling and Design', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Object-oriented Modeling and Design', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('CS 222', 'Computer Programming for Engineers', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Computer Programming for Engineers', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ENGR 107', 'Introduction to Engineering', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Introduction to Engineering', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('COMM 100', 'Public Speaking (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Public Speaking (Mason Core)', credits = 3.0;
INSERT INTO courses (code, title, credits) VALUES ('ECON 103', 'Contemporary Microeconomic Principles (Mason Core)', 3.0) ON CONFLICT (code) DO UPDATE SET title = 'Contemporary Microeconomic Principles (Mason Core)', credits = 3.0;

-- Insert Category Requirements
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 101')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 130')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 211')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 230')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 304')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 411')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 421')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 425')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 430')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 445')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 450')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 476')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 491')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 492')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 493')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 424')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 460')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 462')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 465')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 467')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 470')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 477')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 478')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 479')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 480')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (1, (SELECT id FROM courses WHERE code = 'CYSE 499')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (2, (SELECT id FROM courses WHERE code = 'ECE 301')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (3, (SELECT id FROM courses WHERE code = 'SYST 205')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 113')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 114')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 125')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 203')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 213')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'MATH 214')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (4, (SELECT id FROM courses WHERE code = 'STAT 344')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'PHYS 160')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'PHYS 161')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'PHYS 260')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (5, (SELECT id FROM courses WHERE code = 'PHYS 261')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'CS 112')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'SYST 230')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (6, (SELECT id FROM courses WHERE code = 'CS 222')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (7, (SELECT id FROM courses WHERE code = 'ENGR 107')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'COMM 100')) ON CONFLICT (category_id, course_id) DO NOTHING;
INSERT INTO category_requirements (category_id, course_id) VALUES (8, (SELECT id FROM courses WHERE code = 'ECON 103')) ON CONFLICT (category_id, course_id) DO NOTHING;

-- Insert Course Alternatives
