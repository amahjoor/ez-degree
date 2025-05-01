package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API.ScheduleBuilder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.ScheduleBuilderLogic;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Models.ScheduleBuilderModel;

@RestController
@RequestMapping("/api/schedule-builder")
public class ScheduleBuilder_API 
{
    
    @Autowired
    private ScheduleBuilderLogic SBL;

    @PostMapping("/get-courses")
    public String getCourses(@RequestBody ScheduleBuilderModel request)
    {
        String Data = SBL.GetCourses(request);
        return Data;
    }

}
