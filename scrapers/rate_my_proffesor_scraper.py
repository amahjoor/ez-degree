# -*- coding: utf-8 -*-

#!!! ---------------------
## --- THIS SETS WHERE FILES WILL BE OUTPUT TOO
#!!! ---------------------
TARGET_DIR = "./professors"

"""
!! THIS CODE CANNOT BE USED IN CONJUNCTION WITH AI TRAINING DATA TO STAY IN COMPLIANCE WITH "ratemyprofessors.com/robots.txt"
!! Be responsible, do not DDOS "ratemyprofessor.com" by accident

scrapes professor data for a university on ratemyprofessors.com


Author: Drake Pearson (dpears@gmu.edu)
Pip requirements: requests
"""

# native libs
import base64
import json
import threading
import os

# pip libs
import requests


# makes TARGET_DIR if it does not exist
if not os.path.isdir(TARGET_DIR): os.makedirs(TARGET_DIR)


### scrapes html for the authcode
def get_auth_code(text):
    i = text.find("REACT_APP_GRAPHQL_AUTH")
    k = text.find('"', i+len("REACT_APP_GRAPHQL_AUTH")+3)
    auth = text[i+len("REACT_APP_GRAPHQL_AUTH")+3:k]
    return auth
None

### makes graphql post request to ratemyprofessor server
def iterate_graphql(headers: dict, json_payload: dict, response_keys: tuple):
    ret = []; i = 0
    while True:
        json_payload["variables"]["cursor"] = base64.b64encode(f"arrayconnection:{i}".encode('utf-8')).decode('utf-8')
        r = requests.post("https://www.ratemyprofessors.com/graphql", headers=headers, json=json_payload)        
        rjson = r.json()["data"][response_keys[0]][response_keys[1]]
        ret.extend(rjson["edges"])
        i += json_payload["variables"]["count"]
        if rjson["pageInfo"]["hasNextPage"] is False: break;
    return ret
None


### pulls information for a university on ratemyproffesor
### @param university_id_b64 U2Nob29sLTM1Mg== is School-352, which is GMU's ID number
### @return list of proffesor dicts, each dict will be printed to a file in TARGET_DIR
def parse_university(university_id_num=352, university_id_b64="U2Nob29sLTM1Mg=="):
    headers = {"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0"}
    r = requests.get(f"https://www.ratemyprofessors.com/search/professors/{university_id_num}", headers=headers)
    json_payload = {
        "query": "query TeacherSearchPaginationQuery(\n  $count: Int!\n  $cursor: String\n  $query: TeacherSearchQuery!\n) {\n  search: newSearch {\n    ...TeacherSearchPagination_search_1jWD3d\n  }\n}\n\nfragment CardFeedback_teacher on Teacher {\n  wouldTakeAgainPercent\n  avgDifficulty\n}\n\nfragment CardName_teacher on Teacher {\n  firstName\n  lastName\n}\n\nfragment CardSchool_teacher on Teacher {\n  department\n  school {\n    name\n    id\n  }\n}\n\nfragment TeacherBookmark_teacher on Teacher {\n  id\n  isSaved\n}\n\nfragment TeacherCard_teacher on Teacher {\n  id\n  legacyId\n  avgRating\n  numRatings\n  ...CardFeedback_teacher\n  ...CardSchool_teacher\n  ...CardName_teacher\n  ...TeacherBookmark_teacher\n}\n\nfragment TeacherSearchPagination_search_1jWD3d on newSearch {\n  teachers(query: $query, first: $count, after: $cursor) {\n    didFallback\n    edges {\n      cursor\n      node {\n        ...TeacherCard_teacher\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    resultCount\n    filters {\n      field\n      options {\n        value\n        id\n      }\n    }\n  }\n}\n",
        "variables": {
            "count": 1000,
            "cursor": "YXJyYXljb25uZWN0aW9uOjA=",
            "query": {
                "text": "",
                "schoolID": university_id_b64,
                "fallback": True
            }
        }
    }
    
    headers["Authorization"] = f"Basic {get_auth_code(r.text)}"
    professor = iterate_graphql(headers, json_payload, ("search", "teachers"))
    
    thread_list = [threading.Thread]*len(professor)
    for i in range(len(professor)):
        thread = threading.Thread(target=parse_proffesor, args=(professor[i],))
        thread_list[i] = thread
        thread.start()
    for thread in thread_list: thread.join()
    
    
    return professor
None


### parses out reviews and data for a professor dict
### performs write to TARGET_DIR at end of run
def parse_proffesor(prof: dict):
    headers = {"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0"}
    id_num = prof['node'].pop('legacyId')
    prof["url"] = f"https://www.ratemyprofessors.com/professor/{id_num}"
    r = requests.get(prof["url"], headers=headers)
    json_payload = {
        "query": "query RatingsListQuery(\n  $count: Int!\n  $id: ID!\n  $courseFilter: String\n  $cursor: String\n) {\n  node(id: $id) {\n    __typename\n    ... on Teacher {\n      ...RatingsList_teacher_4pguUW\n    }\n    id\n  }\n}\n\nfragment CourseMeta_rating on Rating {\n  attendanceMandatory\n  wouldTakeAgain\n  grade\n  textbookUse\n  isForOnlineClass\n  isForCredit\n}\n\nfragment NoRatingsArea_teacher on Teacher {\n  lastName\n  ...RateTeacherLink_teacher\n}\n\nfragment ProfessorNoteEditor_rating on Rating {\n  id\n  legacyId\n  class\n  teacherNote {\n    id\n    teacherId\n    comment\n  }\n}\n\nfragment ProfessorNoteEditor_teacher on Teacher {\n  id\n}\n\nfragment ProfessorNoteFooter_note on TeacherNotes {\n  legacyId\n  flagStatus\n}\n\nfragment ProfessorNoteFooter_teacher on Teacher {\n  legacyId\n  isProfCurrentUser\n}\n\nfragment ProfessorNoteHeader_note on TeacherNotes {\n  createdAt\n  updatedAt\n}\n\nfragment ProfessorNoteHeader_teacher on Teacher {\n  lastName\n}\n\nfragment ProfessorNoteSection_rating on Rating {\n  teacherNote {\n    ...ProfessorNote_note\n    id\n  }\n  ...ProfessorNoteEditor_rating\n}\n\nfragment ProfessorNoteSection_teacher on Teacher {\n  ...ProfessorNote_teacher\n  ...ProfessorNoteEditor_teacher\n}\n\nfragment ProfessorNote_note on TeacherNotes {\n  comment\n  ...ProfessorNoteHeader_note\n  ...ProfessorNoteFooter_note\n}\n\nfragment ProfessorNote_teacher on Teacher {\n  ...ProfessorNoteHeader_teacher\n  ...ProfessorNoteFooter_teacher\n}\n\nfragment RateTeacherLink_teacher on Teacher {\n  legacyId\n  numRatings\n  lockStatus\n}\n\nfragment RatingFooter_rating on Rating {\n  id\n  comment\n  adminReviewedAt\n  flagStatus\n  legacyId\n  thumbsUpTotal\n  thumbsDownTotal\n  thumbs {\n    thumbsUp\n    thumbsDown\n    computerId\n    id\n  }\n  teacherNote {\n    id\n  }\n  ...Thumbs_rating\n}\n\nfragment RatingFooter_teacher on Teacher {\n  id\n  legacyId\n  lockStatus\n  isProfCurrentUser\n  ...Thumbs_teacher\n}\n\nfragment RatingHeader_rating on Rating {\n  legacyId\n  date\n  class\n  helpfulRating\n  clarityRating\n  isForOnlineClass\n}\n\nfragment RatingSuperHeader_rating on Rating {\n  legacyId\n}\n\nfragment RatingSuperHeader_teacher on Teacher {\n  firstName\n  lastName\n  legacyId\n  school {\n    name\n    id\n  }\n}\n\nfragment RatingTags_rating on Rating {\n  ratingTags\n}\n\nfragment RatingValues_rating on Rating {\n  helpfulRating\n  clarityRating\n  difficultyRating\n}\n\nfragment Rating_rating on Rating {\n  comment\n  flagStatus\n  createdByUser\n  teacherNote {\n    id\n  }\n  ...RatingHeader_rating\n  ...RatingSuperHeader_rating\n  ...RatingValues_rating\n  ...CourseMeta_rating\n  ...RatingTags_rating\n  ...RatingFooter_rating\n  ...ProfessorNoteSection_rating\n}\n\nfragment Rating_teacher on Teacher {\n  ...RatingFooter_teacher\n  ...RatingSuperHeader_teacher\n  ...ProfessorNoteSection_teacher\n}\n\nfragment RatingsList_teacher_4pguUW on Teacher {\n  id\n  legacyId\n  lastName\n  numRatings\n  school {\n    id\n    legacyId\n    name\n    city\n    state\n    avgRating\n    numRatings\n  }\n  ...Rating_teacher\n  ...NoRatingsArea_teacher\n  ratings(first: $count, after: $cursor, courseFilter: $courseFilter) {\n    edges {\n      cursor\n      node {\n        ...Rating_rating\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment Thumbs_rating on Rating {\n  id\n  comment\n  adminReviewedAt\n  flagStatus\n  legacyId\n  thumbsUpTotal\n  thumbsDownTotal\n  thumbs {\n    computerId\n    thumbsUp\n    thumbsDown\n    id\n  }\n  teacherNote {\n    id\n  }\n}\n\nfragment Thumbs_teacher on Teacher {\n  id\n  legacyId\n  lockStatus\n  isProfCurrentUser\n}\n",
        "variables": {
            "count": 1000,
            "id": prof["node"].pop("id"), # base64 of Teacher-####, where #### is legacyId, which itself is stored at the end of the url
            "courseFilter": None,
            "cursor": "YXJyYXljb25uZWN0aW9uOjA=",
        }
    }
    
    headers["Authorization"] = f"Basic {get_auth_code(r.text)}"
    
    reviews = iterate_graphql(headers, json_payload, ("node", "ratings"))
    
    prof.pop("cursor")
    prof["node"].pop("__typename")
    prof["node"].pop("isSaved")
    prof["node"].pop("numRatings")
    prof["node"].pop("school")
    prof.update(prof.pop("node"))
    
    
    prof["textbookUse"] = prof["isAttendanceMandatory"] = prof["helpfulRating"] = prof["clarityRating"] = prof["averageGrade"] = None
    
    prof["reviews"] = {}
    textbook_use, textbook_total = 0, 0
    is_mandatory, mandatory_total = 0, 0
    helpful_rating, clarity_rating = 0, 0
    grade, grade_count = 0, 0
    for rating in reviews: 
        key = parse_rating(rating)
        if prof["reviews"].get(key) is None: prof["reviews"][key] = []
        prof["reviews"][key].append(rating) 
        if rating["textbookUse"] == 'No': textbook_total += 1
        if rating["textbookUse"] == 'Yes': textbook_total += 1; textbook_use += 1
        if rating["attendanceMandatory"] == "mandatory": is_mandatory += 1; mandatory_total += 1;
        if rating["attendanceMandatory"] == "non mandatory": mandatory_total += 1
        helpful_rating += rating["helpfulRating"]
        clarity_rating += rating["clarityRating"]
        
        grade_catch = grade_get_match_table(rating["grade"])
        if grade_catch is not None: grade += grade_catch; grade_count += 1
    None
    
    prof["textbookUse"] = textbook_use/textbook_total if textbook_total > 0 else None
     
    prof["isAttendanceMandatory"] = is_mandatory/mandatory_total if mandatory_total > 0 else None
    prof["helpfulRating"] = helpful_rating/len(reviews) if len(reviews) > 0 else None
    prof["clarityRating"] = clarity_rating/len(reviews) if len(reviews) > 0 else None
    prof["averageGrade"] = grade_set_if_table(grade/grade_count) if grade_count > 0 else None
    
    with open(f"{TARGET_DIR}/{id_num}", 'w') as file: json.dump(prof, file, indent=4)
None


def parse_rating(rating: dict):
    rating.pop("cursor")
    rating["node"].pop("__typename")
    rating["node"].pop("adminReviewedAt")
    rating["node"].pop("createdByUser")
    rating["node"].pop("flagStatus")
    rating["node"].pop("id")
    rating["node"].pop("legacyId")
    rating["node"].pop("teacherNote")
    rating["node"].pop("thumbs")
    rating.update(rating.pop("node"))
    
    rating["textbookUse"] = "Yes" if rating["textbookUse"] == 3 or rating["textbookUse"] == 5 else "No" if rating["textbookUse"] == 0 else "N/A" if rating["textbookUse"] == -1 else rating["textbookUse"] # I have no idea if a state other than Yes, No, or N/A exists
    rating["wouldTakeAgain"] = None if rating["wouldTakeAgain"] is None else bool(rating["wouldTakeAgain"])
    rating["ratingTags"] = rating["ratingTags"].split('--')
    return rating.pop("class")
None

### is the calculation perfect?  HELL NO! But it does get a somewhat reasonable result.
def grade_get_match_table(grade: str):
    match grade:
        case 'A+': return 4.33
        case 'A': return 4.0
        case 'A-': return 3.67
        case 'B+': return 3.33
        case 'B': return 3.0
        case 'B-': return 2.67
        case 'C+': return 2.33
        case 'C': return 2.0
        case 'C-': return 1.67
        case 'D+': return 1.33
        case 'D': return 1.0
        case 'D-': return 0.67
        case 'F': return 0
        case _: return None
    None
None

### we finish calulating our scuffed rounded calculation, by rounding it even more
def grade_set_if_table(grade: float):
    if grade > 4.0: return 'A+'
    elif grade > 3.67: return 'A'
    elif grade > 3.33: return 'A-'
    elif grade > 3.0: return 'B+'
    elif grade > 2.67: return 'B'
    elif grade > 2.33: return 'B-'
    elif grade > 2.0: return 'C+'
    elif grade > 1.67: return 'C'
    elif grade > 1.33: return 'C-'
    elif grade > 1.0: return 'D+'
    elif grade > 0.67: return 'D'
    elif grade > 0.33: return 'D-'
    else: return 'F'
None


#! uncomment following lines to meausre time: 44 seconds on crappy hardware
#from time import time
#start_time = time()
professor = parse_university() # suggested to comment this line out if importing this as a library
#stop_time = time()
#print(stop_time - start_time)








